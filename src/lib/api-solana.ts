import { SolanaNFTListing } from './types';

const API_BASE = '/api/solana';

export const solanaAPI = {
  // Get NFT listings
  async getListings(limit: number = 20): Promise<SolanaNFTListing[]> {
    const response = await fetch(`${API_BASE}/nfts/listings?limit=${Math.min(limit, 100)}`);
    if (!response.ok) throw new Error('Failed to fetch NFT listings');
    const data = await response.json();
    return data.listings || [];
  },

  // Get NFT details
  async getDetails(contractAddress: string, tokenId: string): Promise<SolanaNFTListing | null> {
    const response = await fetch(`${API_BASE}/nfts/${contractAddress}/${tokenId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.nft || null;
  },

  // Search NFTs
  async search(query: string, limit: number = 20): Promise<SolanaNFTListing[]> {
    const response = await fetch(`${API_BASE}/nfts/search?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 100)}`);
    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    return data.results || [];
  },

  // Cache image locally
  async cacheImage(imageUrl: string): Promise<string> {
    const response = await fetch('/api/images/cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });
    if (!response.ok) return imageUrl; // fallback
    const data = await response.json();
    return data.cachedUrl || imageUrl;
  },

  // Get wallet balance
  async getWalletBalance(address: string): Promise<{ balance: string; balanceFormatted: string }> {
    const response = await fetch(`${API_BASE}/wallet/${address}/balance`);
    if (!response.ok) throw new Error('Failed to fetch balance');
    return response.json();
  },

  // Create wallet
  async createWallet(): Promise<{ address: string }> {
    const response = await fetch(`${API_BASE}/wallet/create`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to create wallet');
    const data = await response.json();
    return data.wallet;
  },

  // Get top collections with volume
  async getTopCollections(limit: number = 20): Promise<any[]> {
    try {
      const listings = await this.getListings(limit * 2);
      
      // Group by collection and calculate volume
      const collections = new Map<string, any>();
      
      listings.forEach(nft => {
        const key = nft.collectionName;
        if (!collections.has(key)) {
          collections.set(key, {
            name: nft.collectionName,
            address: nft.collectionAddress,
            image: nft.imageUrlCached || nft.imageUrl,
            floorPrice: nft.floorPrice,
            currency: nft.currency,
            itemCount: 0,
            volume: 0,
            description: nft.description,
            permalink: nft.permalinkUrl,
          });
        }
        
        const collection = collections.get(key)!;
        collection.itemCount += 1;
        collection.volume += parseFloat(nft.floorPrice) || 0;
      });

      return Array.from(collections.values()).slice(0, limit);
    } catch (error) {
      console.error('Error fetching top collections:', error);
      return [];
    }
  },

  // Make offer via OpenSea
  async makeOfferOpenSea(contractAddress: string, tokenId: string, offerAmount: number): Promise<any> {
    // This would call your backend which in turn calls OpenSea's API
    // For now, we'll return a mock response
    return {
      success: true,
      message: 'Offer submitted successfully',
      offerAmount,
      expiresIn: '7 days',
    };
  },

  // Buy NFT via OpenSea
  async buyNFTOpenSea(contractAddress: string, tokenId: string, paymentMethod: 'wallet' | 'card' | 'bank'): Promise<any> {
    // This would call your backend which in turn calls OpenSea's fulfillment API
    return {
      success: true,
      message: 'Purchase initiated',
      transactionHash: '0x' + Math.random().toString(16).slice(2),
      paymentMethod,
    };
  },
};
