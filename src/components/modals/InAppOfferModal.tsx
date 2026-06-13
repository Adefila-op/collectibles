import React, { useState } from 'react';
import { X, AlertCircle, Loader } from 'lucide-react';
import { SolanaNFTListing } from '../../lib/types';

interface InAppOfferModalProps {
  nft: SolanaNFTListing | null;
  isOpen: boolean;
  onClose: () => void;
  walletBalance: number;
  onSubmit: (offer: { nftId: string; amount: number; message?: string }) => Promise<void>;
}

export const InAppOfferModal: React.FC<InAppOfferModalProps> = ({
  nft,
  isOpen,
  onClose,
  walletBalance,
  onSubmit,
}) => {
  const [offerAmount, setOfferAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !nft) return null;

  const offerAmountNum = parseFloat(offerAmount) || 0;
  const insufficientBalance = offerAmountNum > walletBalance;
  const isValid = offerAmountNum > 0 && !insufficientBalance && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (insufficientBalance) {
      setError('Insufficient balance for this offer');
      return;
    }

    if (!offerAmount || offerAmountNum <= 0) {
      setError('Please enter a valid offer amount');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        nftId: nft.id,
        amount: offerAmountNum,
        message: message || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setOfferAmount('');
        setMessage('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Offer Submitted!</h2>
          <p className="text-gray-600">
            Your offer of <span className="font-semibold">{offerAmount} SOL</span> has been placed.
          </p>
          <p className="text-sm text-gray-500 mt-4">The seller will review your offer shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Make an Offer</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* NFT Preview */}
        <div className="px-6 pt-6 pb-4 bg-gray-50 flex items-center gap-4 border-b">
          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={nft.imageUrlCached || nft.imageUrl}
              alt={nft.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{nft.name}</p>
            <p className="text-sm text-gray-600 truncate">{nft.collectionName}</p>
            <p className="text-sm font-semibold text-blue-600 mt-1">Floor: {nft.floorPrice}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Wallet Balance Info */}
          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p className="text-gray-600">Available Balance</p>
            <p className="text-2xl font-bold text-blue-600">{walletBalance.toFixed(4)} SOL</p>
          </div>

          {/* Offer Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Offer Amount (SOL)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max={walletBalance}
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Enter amount..."
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  insufficientBalance ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                SOL
              </span>
            </div>
            {insufficientBalance && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                Insufficient balance
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message (Optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 200))}
              placeholder="Send a message with your offer..."
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/200</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Info */}
          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1">
            <p>✓ Your offer will be held in escrow</p>
            <p>✓ The seller can accept or reject your offer</p>
            <p>✓ You can cancel anytime before acceptance</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                isValid
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting && <Loader size={18} className="animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InAppOfferModal;
