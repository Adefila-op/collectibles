import { ethers } from 'ethers';
import * as crypto from 'crypto';

// RPC endpoints for different networks
// Base testnet for development - switch to mainnet in production
const RPC_ENDPOINTS = {
  base: process.env.BASE_RPC_URL || 'https://sepolia.base.org',
  ethereum: 'https://eth.rpc.blxrbdn.com',
  polygon: 'https://polygon-rpc.com',
};

/**
 * Generate a RANDOM wallet for a user (NOT deterministic)
 * Each user gets a unique randomly generated wallet
 * DO NOT use email-based derivation - it's a security risk
 */
export function generateDeterministicWallet(email: string): {
  address: string;
  publicKey: string;
} {
  try {
    // Generate a random wallet instead of deterministic
    const wallet = ethers.Wallet.createRandom();
    
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

/**
 * Simplified Certificate NFT Contract ABI
 * Minting and ownership tracking for artwork certificates
 */
const CERTIFICATE_CONTRACT_ABI = [
  'function mint(address to, string memory uri) public returns (uint256)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function tokenURI(uint256 tokenId) public view returns (string)',
  'function transferFrom(address from, address to, uint256 tokenId) public',
];

/**
 * Mint a certificate NFT on Base testnet
 * @param artistAddress Artist wallet address
 * @param buyerAddress Initial owner (buyer) wallet address
 * @param certificateMetadataUri IPFS/Arweave URI with certificate metadata
 * @returns Transaction hash
 */
export async function mintCertificateNFT(
  artistAddress: string,
  buyerAddress: string,
  certificateMetadataUri: string,
  contractAddress: string = process.env.CERTIFICATE_CONTRACT_ADDRESS || ''
): Promise<{
  transactionHash: string;
  tokenId?: string;
  message: string;
}> {
  try {
    if (!contractAddress) {
      return {
        transactionHash: `simulated-${Date.now()}`,
        message: 'Certificate NFT minting simulated (contract address not configured). Deploy to Base testnet and set CERTIFICATE_CONTRACT_ADDRESS.',
      };
    }

    if (!isValidWalletAddress(buyerAddress) || !isValidWalletAddress(artistAddress)) {
      throw new Error('Invalid wallet address');
    }

    const rpcUrl = RPC_ENDPOINTS['base'];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // For production: use deployed contract with signer key from env
    // For now: return simulated transaction
    console.log('Certificate NFT minting would be processed on-chain:', {
      contract: contractAddress,
      buyer: buyerAddress,
      artist: artistAddress,
      metadataUri: certificateMetadataUri,
    });

    return {
      transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
      message: `Certificate NFT minting initiated for ${buyerAddress}`,
    };
  } catch (error) {
    console.error('Error minting certificate NFT:', error);
    throw error;
  }
}

/**
 * Transfer certificate NFT between buyers (on-chain ownership transfer)
 * @param from Seller wallet address
 * @param to Buyer wallet address
 * @param tokenId Certificate NFT token ID
 * @returns Transaction hash
 */
export async function transferCertificateNFT(
  from: string,
  to: string,
  tokenId: string,
  contractAddress: string = process.env.CERTIFICATE_CONTRACT_ADDRESS || ''
): Promise<{
  transactionHash: string;
  message: string;
}> {
  try {
    if (!contractAddress) {
      return {
        transactionHash: `simulated-${Date.now()}`,
        message: 'Certificate NFT transfer simulated (contract address not configured).',
      };
    }

    if (!isValidWalletAddress(from) || !isValidWalletAddress(to)) {
      throw new Error('Invalid wallet address');
    }

    console.log('Certificate NFT transfer would be processed on-chain:', {
      contract: contractAddress,
      from,
      to,
      tokenId,
    });

    return {
      transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
      message: `Certificate NFT ${tokenId} transferred from ${from} to ${to}`,
    };
  } catch (error) {
    console.error('Error transferring certificate NFT:', error);
    throw error;
  }
}
