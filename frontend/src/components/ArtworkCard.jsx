import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheck } from 'react-icons/fi';
import { formatCurrency, getTimeAgo } from '../utils/formatters';

const ArtworkCard = ({ artwork, showOffers = false }) => {
  const emojiMap = {
    'Painting': '🎨',
    'Sculpture': '🏺',
    'Textile': '🪘',
    'Photography': '📷',
    'Digital Art': '🖼️',
    'Mixed Media': '🎭',
  };

  const emoji = emojiMap[artwork.medium] || '🎨';

  return (
    <Link to={`/artwork/${artwork._id}`}>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="h-48 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-6xl relative">
          {emoji}
          {artwork.onchain && (
            <div className="absolute top-2 right-2 bg-black text-amber-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              ⛓ verified
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-lg truncate">{artwork.title}</h3>
          <p className="text-sm text-gray-600">{artwork.artist}</p>
          
          <div className="mt-3 space-y-1">
            <p className="text-sm text-gray-600">Est. value: <span className="font-semibold text-orange-600">{formatCurrency(artwork.estimatedValue)}</span></p>
            {artwork.lastSoldPrice && (
              <p className="text-xs text-gray-500">Last sold: {formatCurrency(artwork.lastSoldPrice)}</p>
            )}
          </div>

          {showOffers && artwork.standingOffers > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-orange-600 font-medium">{artwork.standingOffers} standing offers</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ArtworkCard;
