import React from 'react';
import { formatCurrency, getTimeAgo } from '../utils/formatters';

const OfferCard = ({ offer, onAccept, onDecline, onCounter }) => {
  const emojiMap = {
    'Painting': '🎨',
    'Sculpture': '🏺',
    'Textile': '🪘',
    'Photography': '📷',
  };

  const offeringEmoji = emojiMap[offer.offeringPiece?.medium] || '🎨';

  return (
    <div className={`border rounded-lg p-4 ${offer.status === 'active' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
            {offer.offeringUser?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-sm">{offer.offeringUser?.name}</p>
            <p className="text-xs text-gray-600">{getTimeAgo(offer.createdAt)} • {offer.offeringUser?.location}</p>
          </div>
        </div>
        {offer.status === 'active' && <span className="bg-black text-amber-400 text-xs px-2 py-1 rounded-full font-medium">Top</span>}
      </div>

      <div className="flex gap-3 items-center mb-3">
        <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-2xl">
          {offeringEmoji}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{offer.offeringPiece?.title}</p>
          <p className="text-xs text-gray-600">{offer.offeringPiece?.artist}</p>
          <p className="text-xs text-gray-500">Est. {formatCurrency(offer.offeringPiece?.estimatedValue)}</p>
          {offer.cashAmount > 0 && (
            <p className="text-sm font-medium text-orange-600 mt-1">+ {formatCurrency(offer.cashAmount)} cash</p>
          )}
        </div>
      </div>

      {onAccept && onDecline && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onAccept(offer._id)}
            className="flex-1 bg-black text-amber-400 py-2 rounded text-xs font-medium hover:bg-gray-900"
          >
            Accept offer
          </button>
          <button
            onClick={() => onCounter(offer._id)}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded text-xs font-medium hover:bg-gray-50"
          >
            Counter
          </button>
          <button
            onClick={() => onDecline(offer._id)}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded text-xs font-medium hover:bg-gray-50"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
};

export default OfferCard;
