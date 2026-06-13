import React, { useState } from 'react';
import { X, AlertCircle, Loader, CreditCard } from 'lucide-react';
import { SolanaNFTListing } from '../../lib/types';

interface InAppBuyModalProps {
  nft: SolanaNFTListing | null;
  isOpen: boolean;
  onClose: () => void;
  walletBalance: number;
  onBuy: (purchase: { nftId: string; price: number; paymentMethod: 'wallet' | 'card' | 'bank' }) => Promise<void>;
}

export const InAppBuyModal: React.FC<InAppBuyModalProps> = ({
  nft,
  isOpen,
  onClose,
  walletBalance,
  onBuy,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card' | 'bank'>('wallet');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !nft) return null;

  const price = parseFloat(nft.floorPrice) || 0;
  const platformFee = price * 0.02; // 2% platform fee
  const totalCost = price + platformFee;
  const insufficientBalance = paymentMethod === 'wallet' && totalCost > walletBalance;
  const canProceed = agreedToTerms && !isProcessing && !insufficientBalance;

  const handleBuy = async () => {
    setError('');

    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    if (paymentMethod === 'wallet' && insufficientBalance) {
      setError('Insufficient balance for this purchase');
      return;
    }

    try {
      setIsProcessing(true);
      await onBuy({
        nftId: nft.id,
        price,
        paymentMethod,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Purchase Complete!</h2>
          <p className="text-gray-600 mb-2">{nft.name}</p>
          <p className="text-lg font-semibold text-blue-600">
            Purchased for {price.toFixed(4)} SOL
          </p>
          <p className="text-sm text-gray-500 mt-4">
            The NFT is now in your wallet. You can view it in your collection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-md w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Purchase NFT</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* NFT Preview */}
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
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
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">NFT Price</span>
              <span className="font-semibold">{price.toFixed(4)} SOL</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Fee (2%)</span>
              <span className="font-semibold">{platformFee.toFixed(4)} SOL</span>
            </div>
            <div className="border-t border-blue-200 pt-3 flex justify-between">
              <span className="font-bold">Total Cost</span>
              <span className="text-lg font-bold text-blue-600">{totalCost.toFixed(4)} SOL</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Method</label>
            <div className="space-y-2">
              {/* Wallet */}
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50" style={{borderColor: paymentMethod === 'wallet' ? '#2563eb' : '#e5e7eb'}}>
                <input
                  type="radio"
                  name="payment"
                  value="wallet"
                  checked={paymentMethod === 'wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-4 h-4"
                />
                <div className="ml-3 flex-1">
                  <p className="font-semibold text-sm">Wallet Balance</p>
                  <p className="text-xs text-gray-600">{walletBalance.toFixed(4)} SOL available</p>
                </div>
                {insufficientBalance && (
                  <AlertCircle size={16} className="text-red-500" />
                )}
              </label>

              {/* Card */}
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50" style={{borderColor: paymentMethod === 'card' ? '#2563eb' : '#e5e7eb'}}>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-4 h-4"
                />
                <div className="ml-3 flex-1">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <CreditCard size={16} />
                    Credit Card
                  </p>
                  <p className="text-xs text-gray-600">Visa, Mastercard, Amex</p>
                </div>
              </label>

              {/* Bank Transfer */}
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50" style={{borderColor: paymentMethod === 'bank' ? '#2563eb' : '#e5e7eb'}}>
                <input
                  type="radio"
                  name="payment"
                  value="bank"
                  checked={paymentMethod === 'bank'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-4 h-4"
                />
                <div className="ml-3 flex-1">
                  <p className="font-semibold text-sm">Bank Transfer</p>
                  <p className="text-xs text-gray-600">Direct bank payment</p>
                </div>
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-4 h-4 mt-1 cursor-pointer"
            />
            <span className="text-sm text-gray-600">
              I agree to the{' '}
              <a href="#" className="text-blue-600 hover:underline">
                terms and conditions
              </a>
              . I understand the purchase is final and non-refundable.
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBuy}
              disabled={!canProceed}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                canProceed
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isProcessing && <Loader size={18} className="animate-spin" />}
              {isProcessing ? 'Processing...' : `Buy for ${totalCost.toFixed(4)} SOL`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InAppBuyModal;
