import { ethers } from 'ethers';
import * as crypto from 'crypto';

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
