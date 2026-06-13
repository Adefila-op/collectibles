import { getImageFromCache } from './image-cache';

const OPENSEA_API_URL = 'https://api.opensea.io/api/v2';
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;

/**
 * Solana NFT listing from OpenSea
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
 * Fetch Solana NFT listings from OpenSea
 * Only retrieves NFTs on the Solana blockchain
 */
export async function fetchSolanaNFTListings(limit: number = 20): Promise<SolanaNFTListing[]> {
  try {
    if (!OPENSEA_API_KEY) {
      console.warn('OPENSEA_API_KEY not configured, using mock data');
      return getMockSolanaNFTs(limit);
    }

    // Popular Solana collections on OpenSea
    const solanaMagicEdenCollections = [
      // Magic Eden popular collections (use their contract addresses)
      'MagicEden', // General ME collection
      'DeGods',
      'SolPunks',
      'Okay Bears',
      'SMB',
      'Y00ts',
    ];

    const listings: SolanaNFTListing[] = [];

    // For each collection, fetch listings
    for (const collection of solanaMagicEdenCollections) {
      if (listings.length >= limit) break;

      try {
        // Query OpenSea API for Solana NFTs
        const url = new URL(`${OPENSEA_API_URL}/listings/collection/solana/${collection}`);
        url.searchParams.append('limit', String(Math.min(20, limit - listings.length)));

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'X-API-KEY': OPENSEA_API_KEY,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn(`Failed to fetch ${collection} from OpenSea:`, response.statusText);
          continue;
        }

        const data = (await response.json()) as any;

        if (data.listings && Array.isArray(data.listings)) {
          for (const listing of data.listings) {
            if (listings.length >= limit) break;

            const nft = mapSolanaNFTListing(listing, collection);
            if (nft) {
              listings.push(nft);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching ${collection} listings:`, error);
        continue;
      }
    }

    // If no real data, return mock data for demonstration
    if (listings.length === 0) {
      console.log('No real Solana NFTs found, using mock data for demo');
      return getMockSolanaNFTs(limit);
    }

    return listings;
  } catch (error) {
    console.error('Error fetching Solana NFT listings:', error);
    return getMockSolanaNFTs(limit);
  }
}

/**
 * Fetch best listings for Solana NFTs
 */
export async function fetchBestSolanaListings(limit: number = 20): Promise<SolanaNFTListing[]> {
  try {
    if (!OPENSEA_API_KEY) {
      throw new Error('OPENSEA_API_KEY not configured');
    }

    const url = new URL(`${OPENSEA_API_URL}/listings/collection/solana`);
    url.searchParams.append('limit', String(limit));
    url.searchParams.append('order_by', 'eth_price');
    url.searchParams.append('order_direction', 'asc');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-KEY': OPENSEA_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenSea API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const listings: SolanaNFTListing[] = [];

    if (data.listings && Array.isArray(data.listings)) {
      for (const listing of data.listings) {
        const nft = mapSolanaNFTListing(listing, 'Solana NFT');
        if (nft) {
          listings.push(nft);
        }
      }
    }

    return listings;
  } catch (error) {
    console.error('Error fetching best Solana listings:', error);
    return [];
  }
}

/**
 * Map OpenSea listing to SolanaNFTListing
 */
function mapSolanaNFTListing(listing: any, collectionName: string): SolanaNFTListing | null {
  try {
    const nft_item = listing.nft_item || {};
    const collection = listing.collection || {};
    const price = listing.price || {};

    const imageUrl =
      nft_item.image_url || nft_item.display_image_url || nft_item.image || '/images/placeholder-nft.jpg';

    return {
      id: `${nft_item.contract_address}-${nft_item.token_id}`,
      name: nft_item.name || 'Unnamed NFT',
      description: nft_item.description || '',
      imageUrl,
      imageUrlCached: imageUrl, // Will be cached on demand
      floorPrice: formatPrice(price.current?.value || price.total?.value || '0'),
      currency: price.current?.currency || 'SOL',
      collectionName: collection.name || collectionName,
      collectionAddress: collection.address || '',
      tokenAddress: nft_item.contract_address || '',
      tokenId: nft_item.token_id || '',
      chain: 'solana',
      contractAddress: nft_item.contract_address || '',
      permalinkUrl: listing.permalink || '',
      rarity: nft_item.rarity_rank ? `Rarity Rank: #${nft_item.rarity_rank}` : undefined,
    };
  } catch (error) {
    console.error('Error mapping Solana NFT listing:', error);
    return null;
  }
}

/**
 * Format price from OpenSea response
 */
function formatPrice(value: any): string {
  if (!value) return '0';

  if (typeof value === 'string') {
    return parseFloat(value).toFixed(4);
  }

  if (typeof value === 'number') {
    return value.toFixed(4);
  }

  return '0';
}

/**
 * Fetch Solana NFT details including image (cached)
 */
export async function getSolanaNFTWithCachedImage(nft: SolanaNFTListing): Promise<SolanaNFTListing> {
  try {
    if (!nft.imageUrl) {
      return nft;
    }

    // Cache the image and get local URL
    const cachedImageUrl = await getImageFromCache(nft.imageUrl);

    return {
      ...nft,
      imageUrlCached: cachedImageUrl,
    };
  } catch (error) {
    console.error('Error caching NFT image:', error);
    return nft;
  }
}

/**
 * Get NFT details from OpenSea
 */
export async function getSolanaNFTDetails(
  contractAddress: string,
  tokenId: string
): Promise<SolanaNFTListing | null> {
  try {
    if (!OPENSEA_API_KEY) {
      throw new Error('OPENSEA_API_KEY not configured');
    }

    const url = new URL(`${OPENSEA_API_URL}/nfts/solana/${contractAddress}/${tokenId}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-KEY': OPENSEA_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch NFT details: ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    if (data.nft) {
      const nft = mapSolanaNFTListing(data.nft, 'Solana NFT');
      if (nft) {
        return await getSolanaNFTWithCachedImage(nft);
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching Solana NFT details:', error);
    return null;
  }
}

/**
 * Search Solana NFTs
 */
export async function searchSolanaNFTs(query: string, limit: number = 20): Promise<SolanaNFTListing[]> {
  try {
    if (!OPENSEA_API_KEY) {
      throw new Error('OPENSEA_API_KEY not configured');
    }

    const url = new URL(`${OPENSEA_API_URL}/collections`);
    url.searchParams.append('chain', 'solana');
    url.searchParams.append('q', query);
    url.searchParams.append('limit', String(limit));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-KEY': OPENSEA_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const listings: SolanaNFTListing[] = [];

    // Get best listing from each collection
    if (data.collections && Array.isArray(data.collections)) {
      for (const collection of data.collections.slice(0, limit)) {
        const listing = collection.best_listing;
        if (listing) {
          const nft = mapSolanaNFTListing(listing, collection.name);
          if (nft) {
            listings.push(nft);
          }
        }
      }
    }

    return listings;
  } catch (error) {
    console.error('Error searching Solana NFTs:', error);
    return [];
  }
}

/**
 * Get mock Solana NFTs for demonstration
 */
function getMockSolanaNFTs(limit: number): SolanaNFTListing[] {
  const mockNFTs: SolanaNFTListing[] = [
    {
      id: 'degods-1',
      name: 'DeGods #1234',
      description: 'A rare DeGods NFT from the Solana blockchain',
      imageUrl: 'https://arweave.net/fake-degods-1.png',
      imageUrlCached: '/images/cache/degods-1.png',
      floorPrice: '45.5',
      currency: 'SOL',
      collectionName: 'DeGods',
      collectionAddress: 'DeGods123',
      tokenAddress: 'DeGodsToken',
      tokenId: '1234',
      chain: 'solana',
      contractAddress: 'DeGods123',
      permalinkUrl: 'https://opensea.io/assets/solana/degods/1234',
      rarity: 'Rare',
    },
    {
      id: 'solpunks-2',
      name: 'SolPunks #5678',
      description: 'A SolPunks NFT',
      imageUrl: 'https://arweave.net/fake-solpunks-2.png',
      imageUrlCached: '/images/cache/solpunks-2.png',
      floorPrice: '32.0',
      currency: 'SOL',
      collectionName: 'SolPunks',
      collectionAddress: 'SolPunks123',
      tokenAddress: 'SolPunksToken',
      tokenId: '5678',
      chain: 'solana',
      contractAddress: 'SolPunks123',
      permalinkUrl: 'https://opensea.io/assets/solana/solpunks/5678',
      rarity: 'Epic',
    },
    {
      id: 'okaybears-3',
      name: 'Okay Bears #9012',
      description: 'An Okay Bears NFT',
      imageUrl: 'https://arweave.net/fake-okaybears-3.png',
      imageUrlCached: '/images/cache/okaybears-3.png',
      floorPrice: '28.5',
      currency: 'SOL',
      collectionName: 'Okay Bears',
      collectionAddress: 'OkayBears123',
      tokenAddress: 'OkayBearsToken',
      tokenId: '9012',
      chain: 'solana',
      contractAddress: 'OkayBears123',
      permalinkUrl: 'https://opensea.io/assets/solana/okaybears/9012',
      rarity: 'Uncommon',
    },
    {
      id: 'y00ts-4',
      name: 'Y00ts #3456',
      description: 'A Y00ts NFT from DeGods',
      imageUrl: 'https://arweave.net/fake-y00ts-4.png',
      imageUrlCached: '/images/cache/y00ts-4.png',
      floorPrice: '12.0',
      currency: 'SOL',
      collectionName: 'Y00ts',
      collectionAddress: 'Y00ts123',
      tokenAddress: 'Y00tsToken',
      tokenId: '3456',
      chain: 'solana',
      contractAddress: 'Y00ts123',
      permalinkUrl: 'https://opensea.io/assets/solana/y00ts/3456',
      rarity: 'Common',
    },
    {
      id: 'smb-5',
      name: 'Sollamas #7890',
      description: 'A Sollamas NFT',
      imageUrl: 'https://arweave.net/fake-smb-5.png',
      imageUrlCached: '/images/cache/smb-5.png',
      floorPrice: '18.5',
      currency: 'SOL',
      collectionName: 'Sollamas',
      collectionAddress: 'Sollamas123',
      tokenAddress: 'SollamasToken',
      tokenId: '7890',
      chain: 'solana',
      contractAddress: 'Sollamas123',
      permalinkUrl: 'https://opensea.io/assets/solana/sollamas/7890',
      rarity: 'Rare',
    },
    {
      id: 'magiceden-6',
      name: 'Magic Eden Collection #1111',
      description: 'An NFT from Magic Eden',
      imageUrl: 'https://arweave.net/fake-me-6.png',
      imageUrlCached: '/images/cache/magiceden-6.png',
      floorPrice: '55.0',
      currency: 'SOL',
      collectionName: 'Magic Eden',
      collectionAddress: 'MagicEden123',
      tokenAddress: 'MagicEdenToken',
      tokenId: '1111',
      chain: 'solana',
      contractAddress: 'MagicEden123',
      permalinkUrl: 'https://opensea.io/assets/solana/magiceden/1111',
      rarity: 'Legendary',
    },
  ];

  return mockNFTs.slice(0, limit);
}
