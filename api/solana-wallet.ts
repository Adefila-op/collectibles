import { Keypair, PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

// Solana RPC endpoint - using mainnet
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// Solana devnet for testing (optional)
const SOLANA_DEVNET_URL = 'https://api.devnet.solana.com';

/**
 * Generate a new Solana keypair for deterministic wallet generation
 * Returns the public key (address) and can store private key in secure manner
 */
export function generateSolanaKeypair(): { publicKey: string; privateKey?: string } {
  try {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    const secretKey = bs58.encode(keypair.secretKey);

    return {
      publicKey,
      privateKey: secretKey, // Store securely in production
    };
  } catch (error: any) {
    throw new Error(`Failed to generate Solana keypair: ${error.message}`);
  }
}

/**
 * Get Solana wallet balance in SOL
 */
export async function getSolanaBalance(walletAddress: string, useDevnet: boolean = false): Promise<{
  address: string;
  balance: number; // in SOL
  balanceLamports: number; // in Lamports
  chain: 'solana-mainnet' | 'solana-devnet';
}> {
  try {
    const rpcUrl = useDevnet ? SOLANA_DEVNET_URL : SOLANA_RPC_URL;
    const connection = new Connection(rpcUrl, 'confirmed');
    const publicKey = new PublicKey(walletAddress);

    const balanceLamports = await connection.getBalance(publicKey);
    const balance = balanceLamports / LAMPORTS_PER_SOL;

    return {
      address: walletAddress,
      balance,
      balanceLamports,
      chain: useDevnet ? 'solana-devnet' : 'solana-mainnet',
    };
  } catch (error: any) {
    throw new Error(`Failed to get Solana balance: ${error.message}`);
  }
}

/**
 * Validate Solana wallet address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get formatted balance info
 */
export async function getSolanaBalanceFormatted(
  walletAddress: string,
  useDevnet: boolean = false
): Promise<{
  address: string;
  balance: string;
  balanceFormatted: string;
  chain: string;
  token: 'SOL';
}> {
  try {
    const balanceData = await getSolanaBalance(walletAddress, useDevnet);
    return {
      address: balanceData.address,
      balance: balanceData.balanceLamports.toString(),
      balanceFormatted: `${balanceData.balance.toFixed(4)} SOL`,
      chain: balanceData.chain,
      token: 'SOL',
    };
  } catch (error: any) {
    throw new Error(`Failed to get formatted balance: ${error.message}`);
  }
}

/**
 * Get balances across multiple Solana networks (if needed)
 */
export async function getSolanaBalancesAllChains(
  walletAddress: string
): Promise<Array<{ chain: string; balance: string; balanceFormatted: string }>> {
  try {
    const mainnetData = await getSolanaBalanceFormatted(walletAddress, false);
    const devnetData = await getSolanaBalanceFormatted(walletAddress, true);

    return [
      {
        chain: mainnetData.chain,
        balance: mainnetData.balance,
        balanceFormatted: mainnetData.balanceFormatted,
      },
      {
        chain: devnetData.chain,
        balance: devnetData.balance,
        balanceFormatted: devnetData.balanceFormatted,
      },
    ];
  } catch (error: any) {
    throw new Error(`Failed to get balances from all chains: ${error.message}`);
  }
}

/**
 * Create a Solana connection
 */
export function getSolanaConnection(useDevnet: boolean = false): Connection {
  const rpcUrl = useDevnet ? SOLANA_DEVNET_URL : SOLANA_RPC_URL;
  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}
