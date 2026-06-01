import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { offerAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import OfferCard from '../components/OfferCard';
import { formatCurrency } from '../utils/formatters';

const MyOffers = () => {
  const { user } = useAuthStore();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const { data } = await offerAPI.getAll();
      setOffers(data.filter(o => o.offeringUser?._id === user?.id || o.targetUser?._id === user?.id));
    } catch (err) {
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      await offerAPI.updateStatus(offerId, { status: 'accepted' });
      toast.success('Offer accepted! Swap initiated.');
      fetchOffers();
    } catch (err) {
      toast.error('Failed to accept offer');
    }
  };

  const handleDeclineOffer = async (offerId) => {
    try {
      await offerAPI.decline(offerId);
      toast.success('Offer declined');
      fetchOffers();
    } catch (err) {
      toast.error('Failed to decline offer');
    }
  };

  const filteredOffers = filter === 'all' 
    ? offers 
    : offers.filter(o => o.status === filter);

  const myOutgoingOffers = filteredOffers.filter(o => o.offeringUser?._id === user?.id);
  const incomingOffers = filteredOffers.filter(o => o.targetUser?._id === user?.id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Offers</h1>

        <div className="mb-6 flex gap-2">
          {['all', 'active', 'accepted', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading offers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">I'm Offering ({myOutgoingOffers.length})</h2>
              <div className="space-y-4">
                {myOutgoingOffers.length > 0 ? (
                  myOutgoingOffers.map(offer => (
                    <OfferCard
                      key={offer._id}
                      offer={offer}
                    />
                  ))
                ) : (
                  <p className="text-gray-600">No outgoing offers yet</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">I've Received ({incomingOffers.length})</h2>
              <div className="space-y-4">
                {incomingOffers.length > 0 ? (
                  incomingOffers.map(offer => (
                    <OfferCard
                      key={offer._id}
                      offer={offer}
                      onAccept={handleAcceptOffer}
                      onDecline={handleDeclineOffer}
                      onCounter={() => toast.info('Counter offer feature coming soon!')}
                    />
                  ))
                ) : (
                  <p className="text-gray-600">No incoming offers yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOffers;
