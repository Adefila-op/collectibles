import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI, artAPI, type Art } from "@/lib/api";
import type { User } from "@/lib/db";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, TrendingUp, Users } from "lucide-react";

type AdminEvent = any; // Type from backend
type Transaction = any; // Type from backend
type ArtistRoyalty = any; // Type from backend

export default function AdminDashboard() {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [adminEvents, setAdminEvents] = useState<AdminEvent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [artworks, setArtworks] = useState<Art[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Admin unlock code (hardcoded for security demo - in production use backend auth)
  const ADMIN_CODE = "DIPO-ADMIN-2024";

  useEffect(() => {
    if (unlocked) {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          const [fetchedUsers, fetchedArtworks] = await Promise.all([
            userAPI.getAll(),
            artAPI.getAll(),
          ]);
          setUsers(fetchedUsers);
          setArtworks(fetchedArtworks);
          // Note: adminEvents and transactions need backend endpoints - placeholder for now
          setAdminEvents([]);
          setTransactions([]);
        } catch (err) {
          console.error("Failed to fetch admin data:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [unlocked]);

  const handleUnlock = () => {
    if (password === ADMIN_CODE) {
      setUnlocked(true);
      setError("");
      setPassword("");
    } else {
      setError("Invalid admin code");
    }
  };

  const handleApproveArtist = (userId: string) => {
    updateArtistStatus(userId, "approved");
    setUsers(getUsers());
  };

  const handleRejectArtist = (userId: string) => {
    updateArtistStatus(userId, "collector");
    setUsers(getUsers());
  };

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <Lock className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">Exclusive Access Required</p>
          </div>

          {error && (
            <div className="mb-4 flex gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300">Admin Code</label>
              <div className="mt-2 flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleUnlock()}
                  placeholder="Enter admin code"
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="rounded-lg bg-slate-700 p-2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleUnlock}
              className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition hover:bg-primary/90"
            >
              Unlock Dashboard
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            This page is for administrators only. Unauthorized access is logged and monitored.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Exclusive administrative control panel</p>
          </div>
          <button
            onClick={() => setUnlocked(false)}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
          >
            Lock
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Users", value: users.length, icon: Users },
            { label: "Pending Artists", value: users.filter((u) => u.artistStatus === "pending").length, icon: AlertCircle },
            { label: "Approved Artists", value: users.filter((u) => u.artistStatus === "approved").length, icon: CheckCircle2 },
            { label: "Total Artworks", value: artworks.length, icon: TrendingUp },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <stat.icon className="h-8 w-8 text-slate-600" />
              </div>
            </div>
          ))}
        </div>

        {/* Artist Applications */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Artist Applications</h2>
          <div className="space-y-3">
            {users.filter((u) => u.artistStatus === "pending").length === 0 ? (
              <p className="text-slate-400">No pending applications</p>
            ) : (
              users
                .filter((u) => u.artistStatus === "pending")
                .map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-700/50 p-4">
                    <div>
                      <h3 className="font-semibold text-white">{u.name}</h3>
                      <p className="text-xs text-slate-400">{u.artistType}</p>
                      <p className="mt-1 text-xs text-slate-500">{u.artistBio}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveArtist(u.id)}
                        className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectArtist(u.id)}
                        className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-2 font-semibold text-slate-300">ID</th>
                  <th className="px-4 py-2 font-semibold text-slate-300">Type</th>
                  <th className="px-4 py-2 font-semibold text-slate-300">Amount</th>
                  <th className="px-4 py-2 font-semibold text-slate-300">Status</th>
                  <th className="px-4 py-2 font-semibold text-slate-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((t) => (
                  <tr key={t.id} className="border-b border-slate-700">
                    <td className="px-4 py-2 font-mono text-xs text-slate-400">{t.id.slice(0, 8)}</td>
                    <td className="px-4 py-2">{t.type}</td>
                    <td className="px-4 py-2 font-semibold">₦{t.amount.toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${
                        t.status === "completed" ? "bg-green-600 text-white" :
                        t.status === "pending" ? "bg-yellow-600 text-white" :
                        "bg-slate-600 text-white"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Events Audit Log */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Audit Log</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {adminEvents.slice(0, 20).map((e) => (
              <div key={e.id} className="text-xs text-slate-400 font-mono border-l border-slate-600 pl-3 py-1">
                <span className="text-slate-300 font-semibold">[{new Date(e.createdAt).toLocaleTimeString()}]</span> {e.action}
                {e.targetUserId && ` (user: ${e.targetUserId.slice(0, 8)})`}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          <p>All activities are monitored and logged. Unauthorized access is prohibited.</p>
        </div>
      </div>
    </div>
  );
}
