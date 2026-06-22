

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
