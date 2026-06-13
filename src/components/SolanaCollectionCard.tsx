import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingCart, Send } from 'lucide-react';
import { solanaAPI } from '@/lib/api-solana';

interface SolanaCollectionCardProps {
  collection: {
    name: string;
    address: string;
    image: string;
    floorPrice: string;
    currency: string;
    itemCount: number;
    volume: number;
    description?: string;
    permalink?: string;
  };
  onBuyClick?: (collection: any) => void;
  onOfferClick?: (collection: any) => void;
}

export function SolanaCollectionCard({
  collection,
  onBuyClick,
  onOfferClick,
}: SolanaCollectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [cachedImage, setCachedImage] = useState(collection.image);

  // Cache image on mount
  useEffect(() => {
    if (collection.image) {
      solanaAPI.cacheImage(collection.image)
        .then(setCachedImage)
        .catch(() => setCachedImage(collection.image));
    }
  }, [collection.image]);

  return (
    <Link to={`/solana-collection/${encodeURIComponent(collection.name)}`}>
      <div
        className="group relative overflow-hidden rounded-3xl bg-card border border-border transition-all duration-300 hover:shadow-lg animate-pop"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden bg-muted aspect-square">
          {/* Shine Effect */}
          <div className="absolute inset-0 shine opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          
          {/* Image */}
          <img
            src={cachedImage}
            alt={collection.name}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Trending Badge */}
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur px-2.5 py-1 text-[10px] font-medium text-white border border-white/20">
            <TrendingUp className="h-3 w-3" />
            <span>Floor: {collection.floorPrice} {collection.currency}</span>
          </div>

          {/* Item Count Badge */}
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-blue-500/80 backdrop-blur px-2.5 py-1 text-[10px] font-medium text-white">
            {collection.itemCount} items
          </div>

          {/* Action Buttons - Show on Hover */}
          <div
            className={`absolute inset-0 flex items-end justify-center gap-2 p-3 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                onOfferClick?.(collection);
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600/90 backdrop-blur hover:bg-blue-700 text-white font-medium py-2 text-sm transition-colors"
            >
              <Send className="h-4 w-4" />
              Offer
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onBuyClick?.(collection);
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white/90 backdrop-blur hover:bg-white text-black font-medium py-2 text-sm transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Buy
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 space-y-2">
          {/* Collection Name */}
          <div>
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {collection.name}
            </h3>
            {collection.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {collection.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-semibold text-foreground">{collection.volume.toFixed(2)}</span>
              <span className="text-muted-foreground">{collection.currency}</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+12%</span>
            </div>
          </div>
        </div>

        {/* Hover Lift Animation */}
        {isHovered && (
          <style>{`
            @keyframes lift {
              0% { transform: translateY(0); }
              100% { transform: translateY(-8px); }
            }
          `}</style>
        )}
      </div>
    </Link>
  );
}

export default SolanaCollectionCard;
