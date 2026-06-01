import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { artworkAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import ArtworkCard from '../components/ArtworkCard';

const MyCollection = () => {
  const { user } = useAuthStore();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    description: '',
    medium: 'Painting',
    condition: 'good',
    estimatedValue: 0,
  });

  const fetchCollection = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await artworkAPI.getAll({ owner: user?.id });
      setArtworks(data);
    } catch (err) {
      toast.error('Failed to load collection');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const handleAddArtwork = async (e) => {
    e.preventDefault();
    try {
      const { data } = await artworkAPI.create({
        ...formData,
        images: [],
      });
      setArtworks([data, ...artworks]);
      setFormData({
        title: '',
        artist: '',
        description: '',
        medium: 'Painting',
        condition: 'good',
        estimatedValue: 0,
      });
      setShowForm(false);
      toast.success('Artwork added to collection!');
    } catch (err) {
      toast.error('Failed to add artwork');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Collection</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            {showForm ? 'Cancel' : 'Add Artwork'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Add Artwork to Collection</h2>
            <form onSubmit={handleAddArtwork} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Artist"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <select
                  value={formData.medium}
                  onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Painting">Painting</option>
                  <option value="Sculpture">Sculpture</option>
                  <option value="Textile">Textile</option>
                  <option value="Photography">Photography</option>
                  <option value="Digital Art">Digital Art</option>
                </select>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
                <input
                  type="number"
                  placeholder="Estimated Value (NGN)"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                  className="px-4 py-2 border border-gray-300 rounded-lg md:col-span-2"
                  required
                />
              </div>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows="3"
              ></textarea>
              <button
                type="submit"
                className="w-full bg-black text-amber-400 font-medium py-2 rounded-lg hover:bg-gray-900"
              >
                Add Artwork
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your collection...</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">{artworks.length} artworks in your collection</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {artworks.map((artwork) => (
                <ArtworkCard key={artwork._id} artwork={artwork} />
              ))}
            </div>

            {artworks.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600 mb-4">Your collection is empty</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                >
                  Add Your First Artwork
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyCollection;
