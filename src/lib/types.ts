/**
 * Solana NFT Listing Type Definition
 */
export interface SolanaNFTListing {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageUrlCached: string; // Local cached URL
  floorPrice: string;
  currency: string;
  collectionName: string;
  collectionAddress: string;
  tokenAddress: string;
  tokenId: string;
  chain: 'solana';
  contractAddress: string;
  permalinkUrl: string;
  rarity?: string;
}

/**
 * Solana Wallet Info
 */
export interface SolanaWallet {
  address: string;
  balance: number; // in SOL
  chain: 'solana-mainnet' | 'solana-devnet';
}

/**
 * NFT Offer
 */
export interface NFTOffer {
  id: string;
  nftId: string;
  amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  expiresAt?: string;
}

/**
 * NFT Purchase
 */
export interface NFTPurchase {
  id: string;
  nftId: string;
  price: number;
  paymentMethod: 'wallet' | 'card' | 'bank';
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
  createdAt: string;
}
