import { Link } from "react-router-dom";
import { AppFrame } from "@/components/AppFrame";
import heroCharacter from "@/assets/hero-character.png";
import { getAllArtworks, fmt } from "@/lib/art-data";
import {
  Instagram,
  Menu,
  Repeat2,
  Search,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Twitter,
  Wallet,
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
    <div className="min-h-screen bg-[#0759e8] p-8 text-white">
      <section className="relative mx-auto min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-[36px] bg-[#0b6fff] px-10 py-9 shadow-[0_30px_90px_rgba(0,24,95,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_16%,rgba(255,255,255,0.22),transparent_13%),radial-gradient(circle_at_76%_43%,rgba(74,201,255,0.22),transparent_28%),linear-gradient(135deg,#1585ff,#0759e8_64%,#0651d5)]" />
        <div className="absolute bottom-20 right-28 h-24 w-64 rounded-full bg-[#03245f]/40 blur-2xl" />

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl font-black tracking-normal">
            ARTCHAIN
          </Link>
          <div className="flex items-center gap-5 text-white/90">
            <Instagram className="h-4 w-4" />
            <Twitter className="h-4 w-4" />
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-5">
            <Link
              to="/explore"
              className="rounded-full border border-white/80 px-7 py-2.5 text-sm font-bold text-white transition hover:bg-white hover:text-primary"
            >
              Shop Art
            </Link>
            <Menu className="h-7 w-7" />
          </div>
        </div>

        <div className="relative z-10 grid min-h-[calc(100vh-13rem)] grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)] items-center gap-10">
          <div>
            <div className="mb-9 grid h-16 w-16 place-items-center rounded-full bg-white/15 shadow-soft">
              <ShieldCheck className="h-8 w-8 text-cyan-100" />
            </div>
            <h1 className="font-display text-[clamp(4.5rem,8vw,7.7rem)] font-black leading-[0.94] text-white">
              Collect
              <span className="block">Art</span>
              <span className="block text-cyan-200">with</span>
              <span className="block text-cyan-200">proof.</span>
            </h1>
            <Link
              to="/profile"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-black text-primary shadow-soft transition hover:bg-cyan-100"
            >
              <Wallet className="h-4 w-4" /> Connect Wallet
            </Link>
            <div className="mt-20 text-center font-display text-2xl font-black leading-tight text-white">
              <div>Say "5/10000"</div>
              <div>Proofed</div>
            </div>
          </div>

          <div className="relative flex min-h-[520px] items-center justify-center">
            <div className="absolute bottom-16 h-12 w-72 rounded-full bg-[#03245f]/50 blur-xl" />
            <img
              src={heroCharacter}
              alt="ArtChain character holding African artwork"
              loading="eager"
              decoding="async"
              className="relative z-10 w-full max-w-[480px] animate-float drop-shadow-[0_34px_40px_rgba(0,25,96,0.38)]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
