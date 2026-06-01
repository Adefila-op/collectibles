import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import ArtworkCard from '../components/ArtworkCard';
import { artworkAPI } from '../utils/api';

const BrowseArtworks = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ medium: '', condition: '' });

  const fetchArtworks = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await artworkAPI.getAll(filters);
      setArtworks(data);
    } catch (err) {
      toast.error('Failed to load artworks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchArtworks();
  }, [fetchArtworks]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-dark via-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <h1 className="text-5xl lg:text-6xl font-bold mb-4">Discover African Art</h1>
            <p className="text-lg lg:text-xl text-gray-300 mb-6">
              Explore a curated collection of exceptional artworks and connect with collectors worldwide. 
              Place offers, negotiate swaps, and build your collection.
            </p>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-2xl">🎨</span>
                <span>Diverse Mediums</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-2xl">🔐</span>
                <span>Secure Trading</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-2xl">🌍</span>
                <span>Global Community</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:gap-4 mb-8">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <div>
                <label className="label text-sm font-semibold text-gray-700 mb-2 block">
                  Medium
                </label>
                <select
                  value={filters.medium}
                  onChange={(e) => setFilters({ ...filters, medium: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Mediums</option>
                  <option value="Painting">Painting</option>
                  <option value="Sculpture">Sculpture</option>
                  <option value="Textile">Textile</option>
                  <option value="Photography">Photography</option>
                </select>
              </div>

              <div>
                <label className="label text-sm font-semibold text-gray-700 mb-2 block">
                  Condition
                </label>
                <select
                  value={filters.condition}
                  onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Conditions</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>

            <button
              onClick={fetchArtworks}
              className="lg:w-auto w-full px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition shadow-md hover:shadow-lg"
            >
              Apply Filters
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-lg">📊</span>
            <span>
              Showing <strong>{artworks.length}</strong> {artworks.length === 1 ? 'artwork' : 'artworks'}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading artworks...</p>
          </div>
        ) : (
          <>
            {/* Grid */}
            {artworks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {artworks.map((artwork) => (
                  <ArtworkCard key={artwork._id} artwork={artwork} showOffers={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-2xl text-gray-400 mb-2">🎨</p>
                <p className="text-lg font-semibold text-gray-600 mb-1">No artworks found</p>
                <p className="text-gray-500">Try adjusting your filters to discover more pieces</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BrowseArtworks;
