import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Download, Share2 } from 'lucide-react';
import { SolanaNFTListing } from '../../lib/types';

interface SolanaNFTDetailModalProps {
  nft: SolanaNFTListing | null;
  isOpen: boolean;
  onClose: () => void;
  onMakeOffer?: (nft: SolanaNFTListing) => void;
  onBuy?: (nft: SolanaNFTListing) => void;
}

export const SolanaNFTDetailModal: React.FC<SolanaNFTDetailModalProps> = ({
  nft,
  isOpen,
  onClose,
  onMakeOffer,
  onBuy,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !nft) return null;

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = nft.imageUrl;
    link.download = `${nft.name || 'nft'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b flex items-center justify-between p-6 z-10">
          <div>
            <h2 className="text-2xl font-bold">{nft.name || 'Unnamed NFT'}</h2>
            <p className="text-gray-600 text-sm">{nft.collectionName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Image */}
          <div className="mb-6">
            <div className="bg-gray-200 rounded-lg overflow-hidden aspect-square mb-3">
              <img
                src={nft.imageUrlCached || nft.imageUrl}
                alt={nft.name}
                className={`w-full h-full object-cover transition-opacity ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadImage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={18} />
                Download
              </button>
              <button
                onClick={() => handleCopyAddress(nft.imageUrl)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 size={18} />
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Price */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Floor Price</p>
              <p className="text-2xl font-bold mt-1">{nft.floorPrice}</p>
              <p className="text-gray-500 text-xs mt-1">{nft.currency}</p>
            </div>

            {/* Chain */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Blockchain</p>
              <p className="text-2xl font-bold mt-1">Solana</p>
              <p className="text-gray-500 text-xs mt-1">SOL Network</p>
            </div>

            {/* Rarity */}
            {nft.rarity && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm font-medium">Rarity</p>
                <p className="text-lg font-bold mt-1">{nft.rarity}</p>
              </div>
            )}

            {/* Collection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Collection</p>
              <p className="text-lg font-bold mt-1 truncate">{nft.collectionName}</p>
            </div>
          </div>

          {/* Description */}
          {nft.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{nft.description}</p>
            </div>
          )}

          {/* Token Info */}
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Token Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Contract:</span>
                <button
                  onClick={() => handleCopyAddress(nft.contractAddress)}
                  className="text-blue-600 hover:text-blue-700 font-mono text-xs truncate max-w-xs"
                >
                  {nft.contractAddress.slice(0, 12)}...
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Token ID:</span>
                <code className="bg-white px-2 py-1 rounded text-xs">{nft.tokenId}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Chain:</span>
                <span className="font-medium">{nft.chain.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {onBuy && (
              <button
                onClick={() => {
                  onBuy(nft);
                  onClose();
                }}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Buy Now
              </button>
            )}
            {onMakeOffer && (
              <button
                onClick={() => {
                  onMakeOffer(nft);
                  onClose();
                }}
                className="flex-1 border-2 border-blue-600 text-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Make Offer
              </button>
            )}
          </div>

          {/* View on OpenSea */}
          {nft.permalinkUrl && (
            <a
              href={nft.permalinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm"
            >
              View on OpenSea
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolanaNFTDetailModal;
