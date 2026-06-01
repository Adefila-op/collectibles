import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { artworkAPI, offerAPI } from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';

const ArtworkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [artwork, setArtwork] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArtworkDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data: artworkData } = await artworkAPI.getById(id);
      setArtwork(artworkData);

      const { data: offersData } = await offerAPI.getAll({ targetPieceId: id });
      setOffers(offersData);
    } catch (err) {
      toast.error('Failed to load artwork details');
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchArtworkDetails();
  }, [fetchArtworkDetails]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!artwork) return <div className="min-h-screen flex items-center justify-center">Artwork not found</div>;

  const emojiMap = {
    'Painting': '🎨',
    'Sculpture': '🏺',
    'Textile': '🪘',
    'Photography': '📷',
  };

  const emoji = emojiMap[artwork.medium] || '🎨';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Link to="/browse" className="text-orange-600 hover:text-orange-700 mb-6 inline-block">
          ← Back to Browse
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg p-8 h-96 flex items-center justify-center text-9xl">
            {emoji}
          </div>

          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{artwork.title}</h1>
            <p className="text-lg text-gray-600 mb-4">by {artwork.artist}</p>

            <div className="bg-white rounded-lg p-6 mb-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Medium</span>
                <span className="font-semibold">{artwork.medium}</span>
              </div>
              <div className="flex justify-between border-t pt-4">
                <span className="text-gray-600">Est. Value</span>
                <span className="font-semibold text-orange-600 text-lg">{formatCurrency(artwork.estimatedValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Condition</span>
                <span className="font-semibold capitalize">{artwork.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-semibold">{artwork.listingStatus}</span>
              </div>
              {artwork.lastSoldPrice && (
                <div className="flex justify-between border-t pt-4">
                  <span className="text-gray-600">Last Sold For</span>
                  <span className="font-semibold">{formatCurrency(artwork.lastSoldPrice)}</span>
                </div>
              )}
            </div>

            {artwork.description && (
              <div className="bg-white rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{artwork.description}</p>
              </div>
            )}

            {isAuthenticated && (
              <Link
                to={`/place-offer/${artwork._id}`}
                className="w-full block bg-black text-amber-400 font-medium py-3 rounded-lg text-center hover:bg-gray-900 transition"
              >
                Place an Offer
              </Link>
            )}

            {!isAuthenticated && (
              <Link
                to="/login"
                className="w-full block bg-black text-amber-400 font-medium py-3 rounded-lg text-center hover:bg-gray-900 transition"
              >
                Login to Place an Offer
              </Link>
            )}
          </div>
        </div>

        {offers.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Standing Offers ({offers.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offers.map((offer) => (
                <div key={offer._id} className="bg-white rounded-lg p-6 border border-orange-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                      {offer.offeringUser?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{offer.offeringUser?.name}</p>
                      <p className="text-sm text-gray-600">{offer.offeringUser?.location}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-orange-600 mb-2">Offering: {offer.offeringPiece?.title}</p>
                  {offer.cashAmount > 0 && (
                    <p className="text-sm text-orange-600 font-medium">+ {formatCurrency(offer.cashAmount)} cash</p>
                  )}
                  <p className="text-xs text-gray-600 mt-2">Status: {offer.status}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtworkDetail;
