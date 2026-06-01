import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { artworkAPI, offerAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatters';

const PlaceOffer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [targetArtwork, setTargetArtwork] = useState(null);
  const [userArtworks, setUserArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    offerType: 'art-swap',
    selectedArtworkId: '',
    cashAmount: 0,
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: artwork } = await artworkAPI.getById(id);
      setTargetArtwork(artwork);

      const { data: artworks } = await artworkAPI.getAll({ owner: user?.id });
      setUserArtworks(artworks);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.selectedArtworkId && formData.offerType !== 'cash-only') {
      toast.error('Please select an artwork to offer');
      return;
    }

    try {
      await offerAPI.create({
        offeringPieceId: formData.selectedArtworkId || null,
        targetPieceId: id,
        offerType: formData.offerType,
        cashAmount: formData.offerType === 'cash-only' ? formData.cashAmount : formData.cashAmount,
        topUp: formData.offerType === 'art-plus-cash',
      });

      toast.success('Offer placed successfully!');
      navigate('/my-offers');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place offer');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const emojiMap = {
    'Painting': '🎨',
    'Sculpture': '🏺',
    'Textile': '🪘',
    'Photography': '📷',
  };

  const targetEmoji = emojiMap[targetArtwork?.medium] || '🎨';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Place a Standing Offer</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">You want</h3>
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg h-40 flex items-center justify-center text-6xl mb-4">
              {targetEmoji}
            </div>
            <p className="font-semibold">{targetArtwork?.title}</p>
            <p className="text-sm text-gray-600">{targetArtwork?.artist}</p>
            <p className="text-sm font-medium text-orange-600 mt-2">Est. {formatCurrency(targetArtwork?.estimatedValue)}</p>
          </div>

          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Offer type</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="art-swap"
                    checked={formData.offerType === 'art-swap'}
                    onChange={(e) => setFormData({ ...formData, offerType: e.target.value })}
                  />
                  <span>Art swap only</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="art-plus-cash"
                    checked={formData.offerType === 'art-plus-cash'}
                    onChange={(e) => setFormData({ ...formData, offerType: e.target.value })}
                  />
                  <span>Art + cash top-up</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="cash-only"
                    checked={formData.offerType === 'cash-only'}
                    onChange={(e) => setFormData({ ...formData, offerType: e.target.value })}
                  />
                  <span>Cash offer only</span>
                </label>
              </div>

              {formData.offerType !== 'cash-only' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select your artwork</label>
                  <select
                    value={formData.selectedArtworkId}
                    onChange={(e) => setFormData({ ...formData, selectedArtworkId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Choose an artwork...</option>
                    {userArtworks.map((art) => (
                      <option key={art._id} value={art._id}>
                        {art.title} - {formatCurrency(art.estimatedValue)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(formData.offerType === 'art-plus-cash' || formData.offerType === 'cash-only') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.offerType === 'cash-only' ? 'Offer amount' : 'Cash top-up'}
                  </label>
                  <input
                    type="number"
                    value={formData.cashAmount}
                    onChange={(e) => setFormData({ ...formData, cashAmount: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="₦0"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-black text-amber-400 font-medium py-3 rounded-lg hover:bg-gray-900 transition"
              >
                Place Standing Offer
              </button>
            </form>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p><strong>Note:</strong> Your standing offer will remain active until the seller accepts it or you cancel. You'll be notified immediately if they decide to sell.</p>
        </div>
      </div>
    </div>
  );
};

export default PlaceOffer;
