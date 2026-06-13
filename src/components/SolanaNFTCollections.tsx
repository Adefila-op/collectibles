import React, { useEffect, useState } from 'react';
import { solanaAPI } from '@/lib/api-solana';
import { SolanaCollectionCard } from '@/components/SolanaCollectionCard';
import { TrendingUp } from 'lucide-react';

interface SolanaNFTCollectionsProps {
  onCollectionSelect?: (collection: any) => void;
}

export function SolanaNFTCollections({ onCollectionSelect }: SolanaNFTCollectionsProps) {
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        const topCollections = await solanaAPI.getTopCollections(12);
        setCollections(topCollections);
      } catch (error) {
        console.error('Failed to fetch Solana collections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-semibold text-muted-foreground">Solana Collections</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-muted rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 pt-4 border-t border-border">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-blue-500" />
        <span className="text-xs font-semibold text-muted-foreground">Trending Solana Collections</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {collections.map((collection) => (
          <SolanaCollectionCard
            key={collection.name}
            collection={collection}
            onBuyClick={onCollectionSelect}
            onOfferClick={onCollectionSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default SolanaNFTCollections;
