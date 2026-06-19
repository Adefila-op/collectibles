import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppFrame } from "@/components/AppFrame";
import { userAPI, artAPI } from "@/lib/api";
import {
  Users, Palette, AlertCircle, CheckCircle2, XCircle,
  TrendingUp, ChevronRight, Shield, Clock, Search
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allArtworks, setAllArtworks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "artists" | "artworks">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    if (!user?.isAdmin) return;
    const load = async () => {
      try {
        const [u, a] = await Promise.all([
          userAPI.getAll().catch(() => []),
          artAPI.getAll().catch(() => []),
        ]);
        setAllUsers(u);
        setAllArtworks(a);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user?.isAdmin) {
    return (
      <AppFrame>
        <div className="dash-gate">
          <div className="dash-gate-inner">
            <Shield size={48} />
            <h2>Admin Access Only</h2>
            <p>You do not have permission to access this area.</p>
            <Link to="/" className="dash-gate-btn">Go Home</Link>
          </div>
        </div>
      </AppFrame>
    );
  }

  const handleApproveArtist = async (userId: string) => {
    try {
      await userAPI.updateArtistStatus(userId, "approved");
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, artistStatus: "approved", artist_status: "approved" } : u));
      setActionMsg("✓ Artist approved successfully");
      setTimeout(() => setActionMsg(""), 3000);
    } catch { setActionMsg("Failed to approve artist"); }
  };

  const handleRejectArtist = async (userId: string) => {
    try {
      await userAPI.updateArtistStatus(userId, "collector");
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, artistStatus: "collector", artist_status: "collector" } : u));
      setActionMsg("Artist application rejected");
      setTimeout(() => setActionMsg(""), 3000);
    } catch { setActionMsg("Failed to reject artist"); }
  };

  const pendingArtists = allUsers.filter(u => (u.artistStatus || u.artist_status) === "pending");
  const approvedArtists = allUsers.filter(u => (u.artistStatus || u.artist_status) === "approved");
  const filteredUsers = allUsers.filter(u =>
    !searchQuery ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppFrame>
      <div className="dash-root">
        {/* Sidebar */}
        <aside className="dash-sidebar admin-sidebar">
          <div className="dash-profile-card">
            <div className="dash-avatar admin-avatar">
              <Shield size={22} />
            </div>
            <div>
              <h3 className="dash-name">{user.name || "Admin"}</h3>
              <div className="dash-badge admin-badge"><Shield size={12} /> Admin</div>
            </div>
          </div>

          <nav className="dash-nav">
            {[
              { key: "overview", label: "Overview", icon: TrendingUp },
              { key: "users", label: `All Users (${allUsers.length})`, icon: Users },
              { key: "artists", label: `Artists (${pendingArtists.length} pending)`, icon: Palette },
              { key: "artworks", label: `Artworks (${allArtworks.length})`, icon: Palette },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={`dash-nav-item ${activeTab === key ? "active" : ""} ${key === "artists" && pendingArtists.length > 0 ? "has-badge" : ""}`}
                onClick={() => setActiveTab(key as any)}
              >
                <Icon size={18} />
                {label}
                {key === "artists" && pendingArtists.length > 0 && (
                  <span className="nav-badge">{pendingArtists.length}</span>
                )}
                <ChevronRight size={14} className="dash-nav-chevron" />
              </button>
            ))}
          </nav>

          <Link to="/profile" className="dash-back-link">← Back to Profile</Link>
        </aside>

        {/* Main */}
        <main className="dash-main">
          {actionMsg && (
            <div className="dash-action-toast">{actionMsg}</div>
          )}

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="dash-section">
              <div className="dash-section-header"><h2>Platform Overview</h2></div>
              <div className="dash-stats-grid">
                <div className="dash-stat-card">
                  <Users size={28} className="stat-icon blue" />
                  <p className="dash-stat-val">{allUsers.length}</p>
                  <p className="dash-stat-label">Total Users</p>
                </div>
                <div className="dash-stat-card">
                  <Clock size={28} className="stat-icon yellow" />
                  <p className="dash-stat-val">{pendingArtists.length}</p>
                  <p className="dash-stat-label">Pending Artists</p>
                </div>
                <div className="dash-stat-card">
                  <CheckCircle2 size={28} className="stat-icon green" />
                  <p className="dash-stat-val">{approvedArtists.length}</p>
                  <p className="dash-stat-label">Approved Creators</p>
                </div>
                <div className="dash-stat-card">
                  <Palette size={28} className="stat-icon orange" />
                  <p className="dash-stat-val">{allArtworks.length}</p>
                  <p className="dash-stat-label">Total Artworks</p>
                </div>
              </div>

              {pendingArtists.length > 0 && (
                <div className="dash-alert-banner">
                  <AlertCircle size={18} />
                  <span>{pendingArtists.length} creator application{pendingArtists.length > 1 ? "s" : ""} awaiting review.</span>
                  <button className="dash-alert-action" onClick={() => setActiveTab("artists")}>Review Now</button>
                </div>
              )}
            </div>
          )}

          {/* All Users */}
          {activeTab === "users" && (
            <div className="dash-section">
              <div className="dash-section-header"><h2>All Users</h2></div>
              <div className="dash-search-bar">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by name, email, or username..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              {isLoading ? <div className="dash-loading">Loading users...</div> : (
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="dash-table-user">
                              <div className="dash-table-avatar">{u.name?.[0]?.toUpperCase() || "?"}</div>
                              <span>{u.name || "Anonymous"}</span>
                            </div>
                          </td>
                          <td className="mono">{u.email}</td>
                          <td className="mono">@{u.username || "—"}</td>
                          <td>
                            <span className={`dash-role-badge ${u.is_admin ? "admin" : (u.artist_status || u.artistStatus)}`}>
                              {u.is_admin ? "Admin" : (u.artist_status || u.artistStatus || "collector")}
                            </span>
                          </td>
                          <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Artist Applications */}
          {activeTab === "artists" && (
            <div className="dash-section">
              <div className="dash-section-header"><h2>Creator Applications</h2></div>

              {pendingArtists.length === 0 ? (
                <div className="dash-empty">
                  <CheckCircle2 size={48} opacity={0.3} />
                  <p>No pending applications</p>
                </div>
              ) : (
                <div className="dash-artist-list">
                  {pendingArtists.map(u => (
                    <div key={u.id} className="dash-artist-row">
                      <div className="dash-table-avatar large">{u.name?.[0]?.toUpperCase() || "?"}</div>
                      <div className="dash-artist-info">
                        <h4>{u.name}</h4>
                        <p className="mono">@{u.username || "—"} · {u.email}</p>
                        <p className="dash-artist-type">{u.artist_type || "Artist type not specified"}</p>
                        {u.artist_bio && <p className="dash-artist-bio">"{u.artist_bio}"</p>}
                      </div>
                      <div className="dash-artist-actions">
                        <button
                          className="dash-btn primary small"
                          onClick={() => handleApproveArtist(u.id)}
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button
                          className="dash-btn danger small"
                          onClick={() => handleRejectArtist(u.id)}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {approvedArtists.length > 0 && (
                <>
                  <h3 className="dash-subsection-title">Approved Creators</h3>
                  <div className="dash-artist-list">
                    {approvedArtists.map(u => (
                      <div key={u.id} className="dash-artist-row approved">
                        <div className="dash-table-avatar large green">{u.name?.[0]?.toUpperCase() || "?"}</div>
                        <div className="dash-artist-info">
                          <h4>{u.name} <CheckCircle2 size={14} className="inline-check" /></h4>
                          <p className="mono">@{u.username || "—"} · {u.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Artworks */}
          {activeTab === "artworks" && (
            <div className="dash-section">
              <div className="dash-section-header"><h2>All Artworks</h2></div>
              {isLoading ? <div className="dash-loading">Loading artworks...</div> : (
                <div className="dash-grid">
                  {allArtworks.map(art => (
                    <Link key={art.id} to={`/art/${art.id}`} className="dash-art-card">
                      <div
                        className="dash-art-img"
                        style={{ backgroundImage: art.image ? `url(${art.image})` : undefined }}
                      >
                        {!art.image && <Palette size={28} opacity={0.3} />}
                      </div>
                      <div className="dash-art-info">
                        <h4>{art.name}</h4>
                        <p>{art.artist}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AppFrame>
  );
}
