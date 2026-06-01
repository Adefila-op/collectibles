import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { userAPI, artworkAPI } from '../utils/api';
import ArtworkCard from '../components/ArtworkCard';

const CollectorProfile = () => {
  const { id } = useParams();
  const [collector, setCollector] = useState(null);
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollectorData();
  }, [id]);

  const fetchCollectorData = async () => {
    try {
      setLoading(true);
      const { data: collectorData } = await userAPI.getById(id);
      setCollector(collectorData);

      const { data: artworks } = await artworkAPI.getAll({ owner: id });
      setCollection(artworks);
    } catch (err) {
      toast.error('Failed to load collector profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!collector) return <div className="min-h-screen flex items-center justify-center">Collector not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-white text-3xl font-bold">
              {collector.name?.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{collector.name}</h1>
              <p className="text-gray-600">{collector.location}</p>
              <p className="text-sm text-gray-500 mt-2">{collection.length} pieces owned</p>
            </div>
          </div>

          {collector.bio && (
            <p className="text-gray-700">{collector.bio}</p>
          )}

          <Link
            to={`/place-offer`}
            className="inline-block mt-6 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
          >
            View Available Works
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Collection ({collection.length} pieces)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {collection.map((artwork) => (
            <ArtworkCard key={artwork._id} artwork={artwork} />
          ))}
        </div>

        {collection.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">This collector has no public pieces yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectorProfile;
