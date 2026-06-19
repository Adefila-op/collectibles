import { Link } from "react-router-dom";
import { AppFrame } from "@/components/AppFrame";
import Lightfall from "@/components/Lightfall";
import PillNav from "@/components/PillNav";
import { fmt } from "@/lib/art-data";
import { artAPI, holdingsAPI } from "@/lib/api";
import {
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import logo from "@/assets/collectible-logo.svg";


export default function Home() {
  const { user } = useAuth();
  const [allArtworks, setAllArtworks] = useState<any[]>([]);
  const [userOwnedArtIds, setUserOwnedArtIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    artAPI
      .getAll()
      .then((arts) => setAllArtworks(Array.isArray(arts) ? arts : []))
      .catch((err) => {
        console.error("Failed to load artworks:", err);
        setAllArtworks([]);
      });
  }, []);

  useEffect(() => {
    if (!user) {
      setUserOwnedArtIds(new Set());
      return;
    }

    holdingsAPI
      .getByUserId(user.id)
      .then((holdings) => {
        const ownedIds = new Set<string>();
        (Array.isArray(holdings) ? holdings : []).forEach((holding: any) => {
          const artId = holding.art_id || holding.artId;
          if (artId && holding.status !== "swapped") {
            ownedIds.add(artId);
          }
        });
        setUserOwnedArtIds(ownedIds);
      })
      .catch((err) => {
        console.error("Failed to load user holdings:", err);
        setUserOwnedArtIds(new Set());
      });
  }, [user]);

  const greeting = user?.name?.split(" ")[0] || "Collector";
  const initials = user?.avatar || "?";
  const featuredArtwork = allArtworks[0];

  return (
    <AppFrame label="Home · Discover" desktop={<DesktopLanding />}>
      <div className="space-y-5 px-5 pt-3 pb-6">
        {/* greeting */}
        <div className="flex items-start justify-between animate-fade-up">
          <div>
            <div className="text-xs text-muted-foreground">Welcome back</div>
            <h2 className="font-display text-xl font-semibold leading-tight">
              Collect art, <span className="text-gradient">{greeting}</span> 👋
            </h2>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-grad text-sm font-semibold text-white shadow-glow">
            {initials}
          </div>
        </div>

        {/* search */}
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/60 px-3.5 py-2.5 text-sm text-muted-foreground backdrop-blur">
          <Search className="h-4 w-4" />
          Search artists, styles, cities…
        </div>

        <Link to="/explore" className="block animate-fade-up">
          <div className="rounded-3xl border border-primary/15 bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">Original digital collectibles</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Live OpenSea listings tagged as Digital Art.
                </div>
              </div>
              <div className="text-xs font-bold text-primary">Shop</div>
            </div>
          </div>
        </Link>

        {/* hero feature */}
        {featuredArtwork ? (
          <Link to={`/art/${featuredArtwork.id}`} className="block animate-pop">
            <div className="relative overflow-hidden rounded-3xl bg-primary-grad p-4 text-white shadow-glow hover-lift">
              <div className="absolute inset-0 shine opacity-40" />
              <div className="relative flex gap-4">
                <img
                  src={featuredArtwork.image}
                  width={120}
                  height={120}
                  alt={featuredArtwork.name}
                  className="h-28 w-28 rounded-2xl object-cover ring-2 ring-white/40"
                />
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium">
                      <Sparkles className="h-3 w-3" /> Featured
                    </div>
                    <div className="mt-1.5 font-display text-lg leading-tight">{featuredArtwork.name}</div>
                    <div className="text-xs text-white/80">by {featuredArtwork.artist}</div>
                  </div>
                  <div className="text-sm font-semibold">{fmt(featuredArtwork.price)}</div>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center text-sm text-muted-foreground">
            Loading featured artwork...
          </div>
        )}

        {/* chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 no-scrollbar">
          {["All", "Paintings", "Sculpture", "Textile", "Beadwork", "Photo"].map((c, i) => (
            <button
              key={c}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition ${
                i === 0
                  ? "border-primary bg-primary text-white shadow-soft"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* grid */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Trending</div>
          <div className="text-xs text-primary">See all ›</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {typeof allArtworks === "undefined" || allArtworks === null || allArtworks.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-muted-foreground">
              {typeof allArtworks === "undefined" ? "Loading..." : "No artworks available"}
            </div>
          ) : (
            (allArtworks || []).map((item: any) => {
              try {
                if (!item) return <div key="empty" />;
                const artwork = item;
                if (!artwork.id) return <div key="no-id" />;
                const isOwned = userOwnedArtIds.has(artwork.id);
                return (
                  <div
                    key={artwork.id}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                  >
                    <Link
                      to={`/art/${artwork.id}`}
                      className="block relative aspect-square overflow-hidden"
                    >
                      <img
                        src={artwork.image || ""}
                        alt={artwork.name || "Artwork"}
                        width={400}
                        height={400}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    <div className="p-2.5">
                      <div className="truncate text-xs font-semibold">{artwork.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {artwork.artist} · {artwork.city}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-primary">{fmt(artwork.price)}</div>
                      {isOwned && (
                        <div className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
                          Owned
                        </div>
                      )}
                    </div>
                  </div>
                );
              } catch (e) {
                console.error("Error rendering artwork:", e);
                return <div key="error" className="p-2 text-red-600">Error rendering artwork</div>;
              }
            })
          )}
        </div>
      </div>
    </AppFrame>
  );
}

function DesktopLanding() {
  const { user, signIn, signOut } = useAuth();

  const navItems = [
    { label: 'Explore', href: '/explore' },
    { label: 'Artists', href: '/explore?section=artists' },
    { label: 'Portfolio', href: '/explore?section=portfolio' },
  ];

  const rightSlot = user ? (
    <>
      <Link
        to="/explore?section=settings"
        className="pill-nav-avatar"
        style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 13, fontWeight: 700 }}
      >
        {user.avatar || (user.name ? user.name.slice(0, 2).toUpperCase() : '?')}
      </Link>
      <Link to="/profile" className="pill-nav-cta" style={{ background: '#fff', color: '#1a43d4' }}>
        Dashboard
      </Link>
      <button
        type="button"
        onClick={() => signOut()}
        className="pill-nav-ghost"
        style={{ color: 'rgba(255,255,255,0.7)' }}
      >
        Sign out
      </button>
    </>
  ) : (
    <>
      <button
        type="button"
        onClick={() => signIn()}
        className="pill-nav-ghost"
        style={{ color: 'rgba(255,255,255,0.75)' }}
      >
        Log in
      </button>
      <button
        type="button"
        onClick={() => signIn()}
        className="pill-nav-cta"
        style={{ background: '#fff', color: '#1a43d4' }}
      >
        Get started
      </button>
    </>
  );

  return (
    <div className="min-h-screen text-white">
      <h2 className="sr-only">COllectible landing page - buy resellable artworks directly from artists</h2>
      <section className="relative flex min-h-screen w-full flex-col overflow-hidden font-sans">

        {/* ── Lightfall WebGL background ── */}
        <div className="absolute inset-0 z-0">
          <Lightfall
            colors={['#8cbeff', '#1a43d4', '#0759e8', '#4fa3ff', '#ffffff']}
            backgroundColor="#1a43d4"
            speed={0.7}
            streakCount={6}
            streakWidth={1.2}
            streakLength={1.4}
            glow={1.2}
            density={0.7}
            twinkle={0.6}
            zoom={2.5}
            backgroundGlow={0.8}
            opacity={1}
            mouseInteraction={true}
            mouseStrength={0.7}
            mouseRadius={0.7}
            mouseDampening={0.18}
          />
        </div>

        {/* ── subtle dark vignette so text stays readable ── */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

        {/* ── PillNav ── */}
        <div className="relative z-50 mx-auto w-full max-w-7xl px-10 pt-6">
          <PillNav
            logo={logo}
            logoAlt="COllectible"
            items={navItems}
            rightSlot={rightSlot}
            baseColor="rgba(255,255,255,0.12)"
            pillColor="rgba(255,255,255,0.18)"
            hoveredPillTextColor="#ffffff"
            pillTextColor="rgba(255,255,255,0.9)"
            initialLoadAnimation={true}
          />
        </div>

        {/* ── HERO ── */}
        <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-2 items-center gap-10 px-10 py-12">
          <div>
            <h1 className="mb-6 font-sans text-[56px] font-bold leading-[1.04] tracking-normal text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]">
              Buy resellable
              <br />
              artworks <span className="text-[#8cbeff]">directly</span>
              <br />
              from artists
            </h1>
            <p className="mb-2 text-base leading-[1.65] text-white/70">
              Verified provenance. Transparent ownership.
              <br />
              Stronger resale value.
            </p>
            <p className="mb-10 max-w-xl text-[15px] leading-[1.65] text-white/45">
              COllectible is the provenance infrastructure for overlooked art markets, starting with Africa.
            </p>
            <div className="flex items-center gap-3 relative z-50">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="rounded-full bg-white px-[22px] py-2.5 text-sm font-medium text-[#1a43d4] shadow-lg"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-[18px] py-2.5 text-[13px] text-white/65 transition hover:border-white/45 hover:text-white cursor-pointer"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                   onClick={() => signIn()}
                  className="rounded-full bg-white px-[22px] py-2.5 text-sm font-medium text-[#1a43d4] transition hover:opacity-90 cursor-pointer shadow-lg"
                >
                  Get started →
                </button>
              )}
              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 backdrop-blur px-[18px] py-2.5 text-[13px] text-white/80 transition hover:border-white/45 hover:text-white hover:bg-white/20"
              >
                Shop art
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center py-8">
            <div className="animate-float" style={{ perspective: '1000px' }}>
              {/* Outer glow */}
              <div style={{
                width: 320,
                height: 400,
                transform: 'rotateY(-12deg) rotateX(4deg)',
                transformStyle: 'preserve-3d',
                position: 'relative',
              }}>
                {/* Glow halo */}
                <div style={{
                  position: 'absolute', inset: '-24px',
                  borderRadius: 40,
                  background: 'radial-gradient(ellipse at 50% 50%, rgba(79,163,255,0.35) 0%, transparent 70%)',
                  filter: 'blur(24px)',
                  zIndex: 0,
                }} />

                {/* Card body */}
                <div style={{
                  position: 'relative', zIndex: 1,
                  width: '100%', height: '100%',
                  borderRadius: 24,
                  background: 'linear-gradient(145deg, rgba(15,26,80,0.85) 0%, rgba(10,18,60,0.95) 100%)',
                  border: '1.5px solid rgba(140,190,255,0.25)',
                  boxShadow: '0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  padding: 16,
                  gap: 12,
                }}>
                  {/* Gold top border accent */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg, transparent, #c9a96e, #e8c97e, #c9a96e, transparent)',
                  }} />

                  {/* Artwork area */}
                  <div style={{
                    flex: 1, borderRadius: 14,
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #312e81 55%, #1e3a8a 80%, #0c4a6e 100%)',
                    position: 'relative', overflow: 'hidden',
                    minHeight: 240,
                  }}>
                    {/* African geometric pattern overlay */}
                    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.7 }} viewBox="0 0 288 240" preserveAspectRatio="xMidYMid slice">
                      <polygon points="0,0 144,120 288,0" fill="rgba(79,163,255,0.15)" />
                      <polygon points="0,240 144,120 288,240" fill="rgba(147,51,234,0.2)" />
                      <rect x="80" y="40" width="128" height="3" fill="rgba(56,189,248,0.3)" rx="2" />
                      <rect x="80" y="197" width="128" height="3" fill="rgba(56,189,248,0.3)" rx="2" />
                      <rect x="40" y="80" width="3" height="80" fill="rgba(168,85,247,0.25)" rx="2" />
                      <rect x="245" y="80" width="3" height="80" fill="rgba(168,85,247,0.25)" rx="2" />
                      <circle cx="144" cy="120" r="48" fill="none" stroke="rgba(56,189,248,0.25)" strokeWidth="1.5" />
                      <circle cx="144" cy="120" r="26" fill="none" stroke="rgba(232,121,249,0.3)" strokeWidth="1" />
                      <polygon points="144,80 168,132 120,132" fill="rgba(56,189,248,0.3)" />
                      <polygon points="144,160 168,108 120,108" fill="rgba(147,51,234,0.25)" />
                    </svg>
                    {/* Shine sweep */}
                    <div style={{
                      position: 'absolute', top: 0, left: '-60%', width: '40%', height: '100%',
                      background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
                      animation: 'shine 4s ease-in-out infinite',
                    }} />
                  </div>

                  {/* Card footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 2px' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.3px' }}>African Abstract #042</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>by Kolade Ade</div>
                    </div>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(79,163,255,0.25), rgba(26,67,212,0.35))',
                      border: '1px solid rgba(140,190,255,0.3)',
                      borderRadius: 20, padding: '5px 12px',
                      fontSize: 11, fontWeight: 700, color: '#8cbeff',
                    }}>₦ 420,000</div>
                  </div>
                </div>

                {/* Verified badge floating below */}
                <div style={{
                  position: 'absolute', bottom: -22, left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 30, padding: '6px 16px',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  whiteSpace: 'nowrap',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#1a43d4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1a2060' }}>Verified on-chain</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <div className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl">
            {[
              ["2,400+", "Artworks"],
              ["180+", "Artists"],
              ["100%", "Verified"],
              ["Africa-first", "Starting point"],
            ].map(([value, label]) => (
              <div key={label} className="flex-1 border-r border-white/10 px-8 py-[1.1rem] last:border-r-0">
                <div className="mb-0.5 text-lg font-medium text-white">{value}</div>
                <div className="text-[11px] uppercase tracking-[0.05em] text-white/40">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

