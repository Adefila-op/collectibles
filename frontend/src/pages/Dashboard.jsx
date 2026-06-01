import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { swapAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import Timeline from '../components/Timeline';
import { formatCurrency } from '../utils/formatters';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeSwaps: 0,
    completedSwaps: 0,
    pendingApprovals: 0,
  });

  const fetchSwaps = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await swapAPI.getAll({ userId: user?.id });
      setSwaps(data);

      setStats({
        activeSwaps: data.filter(s => ['accepted', 'in-vault', 'audit-pending'].includes(s.status)).length,
        completedSwaps: data.filter(s => s.status === 'completed').length,
        pendingApprovals: data.filter(s => s.status === 'audit-pending').length,
      });
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSwaps();
  }, [fetchSwaps]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-gray-600 text-sm">Active Swaps</p>
            <p className="text-3xl font-bold text-orange-600">{stats.activeSwaps}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-gray-600 text-sm">Pending Approvals</p>
            <p className="text-3xl font-bold text-blue-600">{stats.pendingApprovals}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-gray-600 text-sm">Completed Swaps</p>
            <p className="text-3xl font-bold text-green-600">{stats.completedSwaps}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Swaps</h2>
            {swaps.length > 0 ? (
              swaps.map((swap) => (
                <div key={swap._id} className="bg-white rounded-lg p-6 shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">
                        {swap.piece1?.medium === 'Painting' ? '🎨' : '🏺'}
                      </div>
                      <div>
                        <p className="font-semibold">{swap.piece1?.title}</p>
                        <p className="text-sm text-gray-600">↔ {swap.piece2?.title}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      swap.status === 'completed' ? 'bg-green-100 text-green-800' :
                      swap.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {swap.status}
                    </span>
                  </div>

                  {swap.cashTopUp > 0 && (
                    <p className="text-sm text-orange-600 font-medium mb-4">Cash top-up: {formatCurrency(swap.cashTopUp)}</p>
                  )}

                  <Timeline timeline={swap.timeline} />

                  {swap.status === 'audit-pending' && (
                    <button
                      onClick={() => {
                        swapAPI.approveAudit(swap._id);
                        toast.success('Audit approved!');
                        fetchSwaps();
                      }}
                      className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      Approve Audit
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-600 mb-4">No active swaps yet</p>
                <p className="text-sm text-gray-500">Browse artworks and place offers to start trading</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
