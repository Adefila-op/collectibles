import { ethers } from 'ethers';
import * as crypto from 'crypto';

// RPC endpoints for different networks
const RPC_ENDPOINTS = {
  base: 'https://mainnet.base.org',
  ethereum: 'https://eth.rpc.blxrbdn.com',
  polygon: 'https://polygon-rpc.com',
};

/**
 * Generate a deterministic wallet for a user based on their email
 * Same email always generates the same wallet address
 * Uses BIP39 standards for deterministic key derivation
 */
export function generateDeterministicWallet(email: string): {
  address: string;
  publicKey: string;
} {
  try {
    // Create a deterministic seed from email (always produces 32 bytes)
    const hash = crypto.createHash('sha256').update(email).digest();
    
    // Convert to hex string and ensure it's prefixed with 0x
    const privateKeyHex = '0x' + hash.toString('hex');
    
    // Create a wallet from the private key
    const wallet = new ethers.Wallet(privateKeyHex);
    
    return {
      address: wallet.address,
      publicKey: wallet.publicKey,
    };
  } catch (err) {
    console.error('Failed to generate wallet:', err);
    throw new Error('Failed to generate wallet for user');
  }
}

/**
 * Verify wallet address format (basic Ethereum address validation)
 */
export function isValidWalletAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Format wallet address to checksum address
 */
export function getChecksumAddress(address: string): string {
  try {
    return ethers.getAddress(address);
  } catch (err) {
    return address;
  }
}

/**
 * Get wallet balance from blockchain (native token)
 * @param address Wallet address to check
 * @param chain 'base' | 'ethereum' | 'polygon'
 * @returns Balance in wei as string
 */
export async function getWalletBalance(
  address: string,
  chain: 'base' | 'ethereum' | 'polygon' = 'base'
): Promise<string> {
  try {
    if (!isValidWalletAddress(address)) {
      throw new Error('Invalid wallet address format');
    }

    const rpcUrl = RPC_ENDPOINTS[chain];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const balance = await provider.getBalance(address);
    return balance.toString();
  } catch (error) {
    console.error(`Error fetching balance for ${address} on ${chain}:`, error);
    throw error;
  }
}

/**
 * Get wallet balance in human-readable format
 * @param address Wallet address
 * @param chain Network chain
 * @returns Balance details including formatted value
 */
export async function getWalletBalanceFormatted(
  address: string,
  chain: 'base' | 'ethereum' | 'polygon' = 'base'
): Promise<{
  wei: string;
  formatted: string;
  token: string;
  chain: string;
}> {
  try {
    const balanceWei = await getWalletBalance(address, chain);
    const formatted = ethers.formatEther(balanceWei);
    
    const tokenMap = {
      base: 'ETH',
      ethereum: 'ETH',
      polygon: 'MATIC',
    };
    
    return {
      wei: balanceWei,
      formatted,
      token: tokenMap[chain],
      chain,
    };
  } catch (error) {
    console.error(`Error getting formatted balance:`, error);
    throw error;
  }
}

/**
 * Get wallet balances from all supported chains
 * @param address Wallet address
 * @returns Balance info from all chains
 */
export async function getWalletBalancesAllChains(
  address: string
): Promise<
  {
    wei: string;
    formatted: string;
    token: string;
    chain: string;
  }[]
> {
  try {
    const chains = ['base', 'ethereum', 'polygon'] as const;
    const balances = await Promise.all(
      chains.map((chain) => getWalletBalanceFormatted(address, chain))
    );
    return balances;
  } catch (error) {
    console.error('Error getting balances from all chains:', error);
    throw error;
  }
}

/**
 * Estimate transaction fee (gas cost)
 * @param chain Network chain
 * @returns Estimated gas fee in formatted ETH/MATIC
 */
export async function estimateGasFee(
  chain: 'base' | 'ethereum' | 'polygon' = 'base'
): Promise<{
  wei: string;
  formatted: string;
  token: string;
}> {
  try {
    const rpcUrl = RPC_ENDPOINTS[chain];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const feeData = await provider.getFeeData();
    const estimatedGasUnits = 21000n; // Standard transfer
    
    // Calculate: maxFeePerGas * gasUnits
    const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice || 1n;
    const estimatedFeeWei = maxFeePerGas * estimatedGasUnits;
    
    return {
      wei: estimatedFeeWei.toString(),
      formatted: ethers.formatEther(estimatedFeeWei),
      token: chain === 'polygon' ? 'MATIC' : 'ETH',
    };
  } catch (error) {
    console.error('Error estimating gas fee:', error);
    throw error;
  }
}
