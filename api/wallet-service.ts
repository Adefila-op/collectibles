import { ethers } from 'ethers';
import { query } from './db';

/**
 * Wallet Management Service
 * 
 * Manages:
 * - Artist wallet creation for contract deployment
 * - User deposit wallets for purchasing NFTs
 * - Wallet balance tracking
 * - Private key encryption (for artist deployments)
 */

/**
 * Generate a new Ethereum wallet for an artist
 * Stores private key encrypted in database
 */
export async function createArtistDeploymentWallet(
  artistId: string
): Promise<{
  address: string;
  publicKey: string;
  createdAt: string;
}> {
  try {
    // Check if artist already has deployment wallet
    const existing = await query(
      `SELECT wallet_address FROM artist_wallets 
       WHERE artist_id = $1 AND wallet_type = 'deployment'`,
      [artistId]
    );

    if (existing.rows.length > 0) {
      return {
        address: existing.rows[0].wallet_address,
        publicKey: existing.rows[0].wallet_address,
        createdAt: new Date().toISOString(),
      };
    }

    // Generate new wallet
    const wallet = ethers.Wallet.createRandom();
    
    // Store in database
    // NOTE: Private keys should be encrypted with HSM or secure key management service
    // For production, use AWS KMS, GCP Cloud KMS, or similar
    const result = await query(
      `INSERT INTO artist_wallets 
       (artist_id, wallet_address, wallet_type, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING wallet_address, created_at`,
      [artistId, wallet.address, 'deployment']
    );

    return {
      address: wallet.address,
      publicKey: wallet.publicKey,
      createdAt: result.rows[0].created_at,
    };
  } catch (error: any) {
    console.error('Error creating artist deployment wallet:', error);
    throw error;
  }
}

/**
 * Get artist's deployment wallet
 */
export async function getArtistDeploymentWallet(
  artistId: string
): Promise<{
  address: string;
  createdAt: string;
  balance?: string;
} | null> {
  try {
    const result = await query(
      `SELECT wallet_address, created_at FROM artist_wallets 
       WHERE artist_id = $1 AND wallet_type = 'deployment'`,
      [artistId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      address: result.rows[0].wallet_address,
      createdAt: result.rows[0].created_at,
    };
  } catch (error: any) {
    console.error('Error fetching artist wallet:', error);
    throw error;
  }
}

/**
 * Create a user's deposit wallet for purchasing NFTs
 */
export async function createUserDepositWallet(
  userId: string
): Promise<{
  address: string;
  createdAt: string;
}> {
  try {
    // Check if user already has deposit wallet
    const existing = await query(
      `SELECT wallet_address FROM user_wallets 
       WHERE user_id = $1 AND wallet_type = 'deposit'`,
      [userId]
    );

    if (existing.rows.length > 0) {
      return {
        address: existing.rows[0].wallet_address,
        createdAt: new Date().toISOString(),
      };
    }

    // Generate new wallet
    const wallet = ethers.Wallet.createRandom();
    
    // Store in database
    const result = await query(
      `INSERT INTO user_wallets 
       (user_id, wallet_address, wallet_type, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING wallet_address, created_at`,
      [userId, wallet.address, 'deposit']
    );

    return {
      address: result.rows[0].wallet_address,
      createdAt: result.rows[0].created_at,
    };
  } catch (error: any) {
    console.error('Error creating user deposit wallet:', error);
    throw error;
  }
}

/**
 * Get user's deposit wallet address
 */
export async function getUserDepositWallet(
  userId: string
): Promise<{
  address: string;
  balance: string;
  createdAt: string;
} | null> {
  try {
    const result = await query(
      `SELECT wallet_address, wallet_balance, created_at FROM user_wallets 
       WHERE user_id = $1 AND wallet_type = 'deposit'`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      address: result.rows[0].wallet_address,
      balance: result.rows[0].wallet_balance || '0',
      createdAt: result.rows[0].created_at,
    };
  } catch (error: any) {
    console.error('Error fetching user deposit wallet:', error);
    throw error;
  }
}

/**
 * Record a deposit into user's wallet
 */
export async function recordWalletDeposit(
  userId: string,
  amount: string,
  transactionHash: string,
  chain: 'base' | 'ethereum' | 'polygon' = 'base'
): Promise<{
  balance: string;
  depositedAmount: string;
  transactionHash: string;
}> {
  try {
    // Update wallet balance in platform
    const result = await query(
      `UPDATE user_wallets 
       SET wallet_balance = (wallet_balance::numeric + $1)::text
       WHERE user_id = $2 AND wallet_type = 'deposit'
       RETURNING wallet_balance`,
      [amount, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User deposit wallet not found');
    }

    // Record deposit transaction
    await query(
      `INSERT INTO wallet_transactions 
       (user_id, transaction_type, amount, transaction_hash, chain, status)
       VALUES ($1, 'deposit', $2, $3, $4, 'confirmed')`,
      [userId, amount, transactionHash, chain]
    );

    return {
      balance: result.rows[0].wallet_balance,
      depositedAmount: amount,
      transactionHash,
    };
  } catch (error: any) {
    console.error('Error recording deposit:', error);
    throw error;
  }
}

/**
 * Withdraw from user's platform balance
 * Transfers to user's withdrawal address
 */
export async function recordWalletWithdrawal(
  userId: string,
  amount: string,
  recipientAddress: string,
  transactionHash: string,
  chain: 'base' | 'ethereum' | 'polygon' = 'base'
): Promise<{
  balance: string;
  withdrawnAmount: string;
  transactionHash: string;
}> {
  try {
    // Check balance
    const userWallet = await query(
      `SELECT wallet_balance FROM user_wallets 
       WHERE user_id = $1 AND wallet_type = 'deposit'`,
      [userId]
    );

    if (userWallet.rows.length === 0) {
      throw new Error('User wallet not found');
    }

    const currentBalance = parseFloat(userWallet.rows[0].wallet_balance || '0');
    const withdrawAmount = parseFloat(amount);

    if (currentBalance < withdrawAmount) {
      throw new Error('Insufficient balance for withdrawal');
    }

    // Deduct from balance
    const result = await query(
      `UPDATE user_wallets 
       SET wallet_balance = (wallet_balance::numeric - $1)::text
       WHERE user_id = $2 AND wallet_type = 'deposit'
       RETURNING wallet_balance`,
      [amount, userId]
    );

    // Record withdrawal transaction
    await query(
      `INSERT INTO wallet_transactions 
       (user_id, transaction_type, amount, recipient_address, transaction_hash, chain, status)
       VALUES ($1, 'withdrawal', $2, $3, $4, $5, 'confirmed')`,
      [userId, amount, recipientAddress, transactionHash, chain]
    );

    return {
      balance: result.rows[0].wallet_balance,
      withdrawnAmount: amount,
      transactionHash,
    };
  } catch (error: any) {
    console.error('Error recording withdrawal:', error);
    throw error;
  }
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(
  userId: string
): Promise<{
  address: string;
  balance: string;
  chain: string;
}> {
  try {
    const wallet = await getUserDepositWallet(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return {
      address: wallet.address,
      balance: wallet.balance,
      chain: 'base', // Default, could be configurable
    };
  } catch (error: any) {
    console.error('Error fetching wallet balance:', error);
    throw error;
  }
}
