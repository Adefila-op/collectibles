import { Link } from "react-router-dom";
import { AppFrame } from "@/components/AppFrame";
import { getAllArtworks, fmt } from "@/lib/art-data";
import {
  Repeat2,
  Search,
  Send,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getHoldings } from "@/lib/db";

export default function Home() {
  const { user } = useAuth();
  const greeting = user ? user.name.split(" ")[0] : "Collector";
  const initials = user ? user.avatar : "?";

  const userHoldings = user ? getHoldings(user.id) : [];
  const userOwnedArtIds = new Set(userHoldings.map((h) => h.artId));
  const allArtworks = getAllArtworks();

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

        {/* hero feature */}
        <Link to={`/art/${allArtworks[0].id}`} className="block animate-pop">
          <div className="relative overflow-hidden rounded-3xl bg-primary-grad p-4 text-white shadow-glow hover-lift">
            <div className="absolute inset-0 shine opacity-40" />
            <div className="relative flex gap-4">
              <img
                src={allArtworks[0].image}
                width={120}
                height={120}
                alt={allArtworks[0].name}
                className="h-28 w-28 rounded-2xl object-cover ring-2 ring-white/40"
              />
              <div className="flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium">
                    <Sparkles className="h-3 w-3" /> Featured
                  </div>
                  <div className="mt-1.5 font-display text-lg leading-tight">{allArtworks[0].name}</div>
                  <div className="text-xs text-white/80">by {allArtworks[0].artist}</div>
                </div>
                <div className="text-sm font-semibold">{fmt(allArtworks[0].price)}</div>
              </div>
            </div>
          </div>
        </Link>

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
          {allArtworks.map((a, i) => {
            const isOwned = userOwnedArtIds.has(a.id);
            return (
              <div
                key={a.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card animate-fade-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <Link
                  to={`/art/${a.id}`}
                  className="block relative aspect-square overflow-hidden"
                >
                  <img
                    src={a.image}
                    alt={a.name}
                    width={400}
                    height={400}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ink))]/80 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> onchain
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                </Link>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 backdrop-blur-sm pointer-events-none">
                  <div className="flex gap-2 flex-wrap justify-center pointer-events-auto">
                    {isOwned ? (
                      <Link
                        to="/swap"
                        className="flex items-center gap-1 rounded-full bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-xs text-white font-semibold transition"
                      >
                        <Repeat2 className="h-3.5 w-3.5" /> Swap
                      </Link>
                    ) : (
                      <Link
                        to={`/offer?artId=${a.id}`}
                        className="flex items-center gap-1 rounded-full bg-primary hover:bg-primary/90 px-3 py-1.5 text-xs text-white font-semibold transition"
                      >
                        <Send className="h-3.5 w-3.5" /> Offer
                      </Link>
                    )}
                    <Link
                      to="/buy"
                      className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-white font-semibold transition hover:bg-primary/90"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> Buy
                    </Link>
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="truncate text-xs font-semibold">{a.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {a.artist} · {a.city}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-primary">{fmt(a.price)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppFrame>
  );
}

function DesktopLanding() {
  return (
    <div className="min-h-screen bg-white p-8 text-white">
      <h2 className="sr-only">Collectible landing page - buy resellable artworks directly from artists</h2>
      <section className="relative mx-auto min-h-[480px] max-w-6xl overflow-hidden rounded-2xl bg-[#1a43d4] font-sans">
        <div className="absolute -right-[60px] -top-20 h-[300px] w-[300px] rounded-full bg-white/[0.06]" />
        <div className="absolute -left-10 bottom-5 h-[180px] w-[180px] rounded-full bg-white/[0.06]" />
        <div className="absolute right-[200px] top-[60px] h-[100px] w-[100px] rounded-full bg-white/[0.06]" />

        <nav className="relative z-10 flex items-center justify-between px-8 py-5">
          <Link to="/" className="text-[15px] font-medium tracking-normal text-white">
            Collectible
          </Link>
          <div className="flex items-center gap-7">
            <Link to="/explore" className="text-[13px] text-white/65 transition hover:text-white">
              How it works
            </Link>
            <Link to="/explore?section=artists" className="text-[13px] text-white/65 transition hover:text-white">
              Artists
            </Link>
            <Link
              to="/explore"
              className="rounded-full bg-white px-[18px] py-[7px] text-[13px] font-medium text-[#1a43d4]"
            >
              Shop art
            </Link>
          </div>
        </nav>

        <div className="relative z-10 grid grid-cols-2 items-center gap-8 px-8 pb-12 pt-10">
          <div>
            <h1 className="mb-5 font-sans text-[42px] font-bold leading-[1.1] tracking-normal text-white">
              Buy resellable
              <br />
              artworks <span className="text-[#8cbeff]">directly</span>
              <br />
              from artists
            </h1>
            <p className="mb-2 text-sm leading-[1.65] text-white/65">
              Verified provenance. Transparent ownership.
              <br />
              Stronger resale value.
            </p>
            <p className="mb-8 text-[13px] leading-[1.65] text-white/40">
              Collectible is the provenance infrastructure for overlooked art markets, starting with Africa.
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/explore"
                className="rounded-full bg-white px-[22px] py-2.5 text-sm font-medium text-[#1a43d4]"
              >
                Shop art
              </Link>
              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-[18px] py-2.5 text-[13px] text-white/65 transition hover:border-white/45 hover:text-white"
              >
                Learn more <span aria-hidden="true">-&gt;</span>
              </Link>
            </div>
          </div>

          <div className="flex items-end justify-center">
            <svg width="220" height="230" viewBox="0 0 220 230" role="img" aria-labelledby="landing-art-title landing-art-desc">
              <title id="landing-art-title">Floating artwork frame with provenance certificate</title>
              <desc id="landing-art-desc">An animated 3D-style artwork frame floating against the blue background</desc>

              <ellipse cx="110" cy="210" rx="65" ry="14" fill="rgba(0,0,0,0.18)" className="origin-center animate-pulse" />

              <g className="origin-center animate-float">
                <rect x="30" y="20" width="130" height="160" rx="6" fill="#1a2a6e" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <rect x="38" y="28" width="114" height="138" rx="4" fill="#0f1a50" />

                <rect x="44" y="34" width="102" height="126" rx="3" fill="#2a1a0e" />
                <ellipse cx="95" cy="72" rx="28" ry="34" fill="#8B4513" opacity="0.7" />
                <ellipse cx="95" cy="62" rx="18" ry="20" fill="#D2691E" />
                <circle cx="88" cy="56" r="3" fill="#1a0a00" />
                <circle cx="102" cy="56" r="3" fill="#1a0a00" />
                <path d="M88 65 Q95 70 102 65" stroke="#1a0a00" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <ellipse cx="95" cy="108" rx="22" ry="26" fill="#8B4513" opacity="0.5" />
                <rect x="72" y="96" width="46" height="36" rx="2" fill="#D2691E" opacity="0.6" />

                <rect x="44" y="34" width="102" height="126" rx="3" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

                <rect x="38" y="168" width="114" height="16" rx="2" fill="#c9a96e" />
                <rect x="42" y="169" width="106" height="2" rx="1" fill="rgba(255,255,255,0.3)" />
                <rect x="38" y="182" width="114" height="4" rx="1" fill="#b8924a" />
              </g>

              <g className="animate-float" transform="translate(140, 80)">
                <rect x="0" y="0" width="72" height="44" rx="8" fill="rgba(255,255,255,0.95)" />
                <circle cx="18" cy="14" r="8" fill="#1a43d4" />
                <text x="18" y="18" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">OK</text>
                <rect x="30" y="8" width="34" height="3" rx="1" fill="#1a43d4" opacity="0.7" />
                <rect x="30" y="14" width="24" height="2" rx="1" fill="#888" opacity="0.5" />
                <rect x="8" y="28" width="56" height="2" rx="1" fill="#eee" />
                <rect x="8" y="33" width="40" height="2" rx="1" fill="#eee" />
              </g>
            </svg>
          </div>
        </div>

        <div className="relative z-10 flex border-t border-white/10">
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
      </section>
    </div>
  );
}
