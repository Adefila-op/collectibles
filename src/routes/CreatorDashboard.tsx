import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppFrame } from "@/components/AppFrame";
import { artAPI } from "@/lib/api";
import { fmt } from "@/lib/art-data";
import {
  Palette, TrendingUp, Plus, Upload, Eye,
  BadgeCheck, ChevronRight, Package, Settings,
  Clock, ShoppingBag, AlertCircle,
} from "lucide-react";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [myArtworks, setMyArtworks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"artworks" | "analytics" | "settings" | "collection">("artworks");

  const isApproved = user?.artistStatus === "approved" || user?.artist_status === "approved";
  const isPending = user?.artistStatus === "pending" || user?.artist_status === "pending";

  useEffect(() => {
    if (!user || !isApproved) { setIsLoading(false); return; }
    const load = async () => {
      try {
        const all = await artAPI.getAll();
        const mine = all.filter((a: any) =>
          a.artist?.toLowerCase() === user.name?.toLowerCase() ||
          a.artistId === user.id
        );
        setMyArtworks(mine);
      } catch (e) {
        console.error("Failed to load artworks", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user, isApproved]);

  const totalValue = myArtworks.reduce((sum, a) => sum + (a.price || 0), 0);
  const listedCount = myArtworks.filter(a => a.status === "listed" || a.listed_price).length;

  return (
    <AppFrame>
      <div className="dash-root">
        {/* Sidebar */}
        <aside className="dash-sidebar">
          <div className="dash-profile-card">
            <div className={`dash-avatar ${isApproved ? "creator-avatar" : "pending-avatar"}`}>
              {user?.firstName?.[0] || user?.name?.[0]?.toUpperCase() || "C"}
            </div>
            <div>
              <h3 className="dash-name">{user?.name || "Creator"}</h3>
              <p className="dash-username">@{user?.username || "—"}</p>
              <div className={`dash-badge ${isPending ? "pending" : ""}`}>
                {isPending ? <Clock size={13} /> : <BadgeCheck size={13} />}
                {isPending ? "Pending Approval" : "Verified Creator"}
              </div>
            </div>
          </div>

          <nav className="dash-nav">
            {/* Consumer view always available */}
            <Link to="/explore" className="dash-nav-item">
              <ShoppingBag size={18} />
              Marketplace
              <ChevronRight size={14} className="dash-nav-chevron" />
            </Link>

            {isApproved && [
              { key: "artworks", label: "My Artworks", icon: Palette },
              { key: "analytics", label: "Analytics", icon: TrendingUp },
              { key: "settings", label: "Creator Settings", icon: Settings },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={`dash-nav-item ${activeTab === key ? "active" : ""}`}
                onClick={() => setActiveTab(key as any)}
              >
                <Icon size={18} />
                {label}
                <ChevronRight size={14} className="dash-nav-chevron" />
              </button>
            ))}
          </nav>

          <Link to="/explore?section=settings" className="dash-back-link">← Account Settings</Link>
        </aside>

        {/* Main */}
        <main className="dash-main">

          {/* ── Pending verification gate ── */}
          {isPending && (
            <div className="creator-pending-gate">
              <div className="creator-pending-icon">
                <Clock size={40} />
              </div>
              <h2>Verification Pending</h2>
              <p>
                Your creator account is under review by our team. This usually takes 1–3 business days.
                While you wait, you can still browse and collect artworks as a consumer.
              </p>
              <div className="creator-pending-steps">
                <div className="creator-pending-step done">
                  <BadgeCheck size={16} /> Account created
                </div>
                <div className="creator-pending-step active">
                  <Clock size={16} /> Admin review in progress
                </div>
                <div className="creator-pending-step">
                  <Palette size={16} /> Creator tools unlocked
                </div>
              </div>
              <Link to="/explore" className="dash-btn primary">
                <ShoppingBag size={16} /> Browse Marketplace
              </Link>
            </div>
          )}

          {/* ── Approved creator tabs ── */}
          {isApproved && (
            <>
              {/* Artworks Tab */}
              {activeTab === "artworks" && (
                <div className="dash-section">
                  <div className="dash-section-header">
                    <h2>My Artworks</h2>
                    <Link to="/list" className="dash-btn primary small">
                      <Plus size={15} /> List New Artwork
                    </Link>
                  </div>

                  <div className="dash-stats-row">
                    <div className="dash-stat">
                      <Package size={20} />
                      <div>
                        <p className="dash-stat-val">{myArtworks.length}</p>
                        <p className="dash-stat-label">Total Listed</p>
                      </div>
                    </div>
                    <div className="dash-stat">
                      <Eye size={20} />
                      <div>
                        <p className="dash-stat-val">{listedCount}</p>
                        <p className="dash-stat-label">Active Listings</p>
                      </div>
                    </div>
                    <div className="dash-stat">
                      <TrendingUp size={20} />
                      <div>
                        <p className="dash-stat-val">{fmt(totalValue)}</p>
                        <p className="dash-stat-label">Total Value</p>
                      </div>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="dash-loading">Loading your artworks...</div>
                  ) : myArtworks.length === 0 ? (
                    <div className="dash-empty">
                      <Upload size={48} opacity={0.3} />
                      <p>You haven't listed any artworks yet</p>
                      <Link to="/list" className="dash-action-link">List your first artwork →</Link>
                    </div>
                  ) : (
                    <div className="dash-grid">
                      {myArtworks.map(art => (
                        <Link key={art.id} to={`/art/${art.id}`} className="dash-art-card">
                          <div
                            className="dash-art-img"
                            style={{ backgroundImage: art.image ? `url(${art.image})` : undefined }}
                          >
                            {!art.image && <Palette size={32} opacity={0.3} />}
                            <span className={`dash-art-status ${art.status || "available"}`}>
                              {art.status || "Available"}
                            </span>
                          </div>
                          <div className="dash-art-info">
                            <h4>{art.name}</h4>
                            <p>{art.category}</p>
                            <span className="dash-art-price">{fmt(art.price)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === "analytics" && (
                <div className="dash-section">
                  <div className="dash-section-header"><h2>Analytics</h2></div>
                  <div className="dash-analytics-placeholder">
                    <TrendingUp size={64} opacity={0.2} />
                    <h3>Analytics Coming Soon</h3>
                    <p>View your sales history, offer activity, and revenue breakdown here.</p>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === "settings" && (
                <div className="dash-section">
                  <div className="dash-section-header"><h2>Creator Settings</h2></div>
                  <div className="dash-settings-card">
                    <div className="dash-settings-row">
                      <Palette size={18} />
                      <div>
                        <p className="dash-settings-label">Artist Type</p>
                        <p className="dash-settings-val">{user?.artist_type || "—"}</p>
                      </div>
                    </div>
                    <div className="dash-settings-row">
                      <span>📝</span>
                      <div>
                        <p className="dash-settings-label">Bio</p>
                        <p className="dash-settings-val">{user?.artist_bio || "No bio set"}</p>
                      </div>
                    </div>
                  </div>
                  <p className="dash-hint">To update your creator profile, contact support or use the artist application form.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </AppFrame>
  );
}
