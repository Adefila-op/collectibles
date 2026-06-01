import { Link } from "react-router-dom";
import { AppFrame } from "@/components/AppFrame";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import heroCharacter from "@/assets/hero-character.png";
import { getAllArtworks, fmt, ARTWORKS, type Art } from "@/lib/art-data";
import { OFFERS } from "@/lib/offers-data";
import {
  ArrowRight,
  Bell,
  Bookmark,
  CalendarDays,
  Heart,
  Home as HomeIcon,
  MapPin,
  MessageCircle,
  PackageCheck,
  Plus,
  Repeat2,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getHoldings, type UserHolding } from "@/lib/db";

type DashboardSection = "explore" | "portfolio" | "artists";
const dashboardSections: DashboardSection[] = ["explore", "portfolio", "artists"];
const NAIRA_PER_USDC = 1500;
const NETWORKS = ["Base", "Ethereum", "Polygon"] as const;

function walletAddressForUser(userId: string) {
  let hash = "";
  for (let i = 0; i < 40; i++) {
    const code = userId.charCodeAt(i % userId.length) + i * 17;
    hash += (code % 16).toString(16);
  }
  return `0x${hash}`;
}

export default function Explore() {
  const { user, updateWalletBalance } = useAuth();
  const initialSection = new URLSearchParams(window.location.search).get("section");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: 50000, max: 2000000 });
  const [activeSection, setActiveSection] = useState<DashboardSection>(
    dashboardSections.includes(initialSection as DashboardSection) ? (initialSection as DashboardSection) : "explore"
  );

  const allArtworks = useMemo(() => getAllArtworks(), []);
  const userHoldings = user ? getHoldings(user.id) : [];
  const userOwnedArtIds = new Set(userHoldings.map((h) => h.artId));

  function handleSectionChange(section: DashboardSection) {
    setActiveSection(section);
    const nextUrl = section === "explore" ? "/explore" : `/explore?section=${section}`;
    window.history.replaceState(null, "", nextUrl);
  }

  const filteredArtworks = useMemo(() => {
    let results = allArtworks;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.artist.toLowerCase().includes(query) ||
          a.city.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      results = results.filter((a) => a.category === selectedCategory);
    }

    // City filter
    if (selectedCity) {
      results = results.filter((a) => a.city === selectedCity);
    }

    // Price range filter
    results = results.filter((a) => a.price >= priceRange.min && a.price <= priceRange.max);

    // Status filter
    if (selectedStatus === "For sale") {
      results = results.filter((a) => !userOwnedArtIds.has(a.id));
    } else if (selectedStatus === "Swap only") {
      results = results.filter((a) => userOwnedArtIds.has(a.id));
    }

    return results;
  }, [allArtworks, searchQuery, selectedCategory, selectedCity, selectedStatus, priceRange, userOwnedArtIds]);

  return (
    <AppFrame
      label="Explore · Filters"
      desktop={
        <DesktopMarketplace
          artworks={filteredArtworks}
          allArtworks={allArtworks}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          userOwnedArtIds={userOwnedArtIds}
          userHoldings={userHoldings}
          userName={user?.name || "Kwame Mensah"}
          userId={user?.id || "demo-user"}
          walletBalance={user?.walletBalance || 1240500}
          onWalletBalanceChange={updateWalletBalance}
          initials={user?.avatar || "KM"}
        />
      }
    >
      <div className="space-y-4 px-5 pt-3 pb-6">
        <h2 className="font-display text-xl font-semibold">Explore</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artworks, artists, cities…"
            className="flex-1 rounded-2xl border border-border bg-muted/60 px-3.5 py-2.5 text-sm text-muted-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-muted/60 transition hover:border-primary/40"
          >
            <SlidersHorizontal className="h-4 w-4 text-primary" />
          </button>
        </div>

        {showFilters && (
          <div className="space-y-4 animate-fade-up">
            {[
              { 
                t: "Category", 
                opts: ["Paintings", "Sculpture", "Textile", "Beadwork", "Photo"], 
                selected: selectedCategory,
                onChange: setSelectedCategory
              },
              { 
                t: "City", 
                opts: ["Lagos", "Dakar", "Accra", "Ibadan", "Senegal"], 
                selected: selectedCity,
                onChange: setSelectedCity
              },
              { 
                t: "Status", 
                opts: ["For sale", "Swap only", "Any"], 
                selected: selectedStatus,
                onChange: (val: string | null) => setSelectedStatus(val === "Any" ? null : val)
              },
            ].map((g) => (
              <div key={g.t}>
                <div className="mb-2 text-xs font-semibold text-foreground">{g.t}</div>
                <div className="flex flex-wrap gap-2">
                  {g.opts.map((o) => {
                    const isSelected = g.selected === o;
                    return (
                      <button
                        key={o}
                        onClick={() => g.onChange(isSelected ? null : o)}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <div className="mb-2 text-xs font-semibold">Price range</div>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })
                  }
                  className="flex-1 rounded-lg border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                  placeholder="Min"
                />
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 2000000 })
                  }
                  className="flex-1 rounded-lg border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                  placeholder="Max"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                ₦{priceRange.min.toLocaleString()} - ₦{priceRange.max.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {filteredArtworks.length > 0 ? (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted-foreground">
              {filteredArtworks.length} result{filteredArtworks.length !== 1 ? "s" : ""} found
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filteredArtworks.map((a) => {
                const isOwned = userOwnedArtIds.has(a.id);
                return (
                  <div
                    key={a.id}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                  >
                    <Link
                      to={`/art/${a.id}`}
                      className="block relative aspect-square overflow-hidden"
                    >
                      <img
                        src={a.image}
                        alt={a.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
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
                      <Link
                        to={`/art/${a.id}`}
                        className="truncate text-xs font-semibold hover:text-primary transition"
                      >
                        {a.name}
                      </Link>
                      <div className="truncate text-[10px] text-muted-foreground">{a.artist} · {a.city}</div>
                      <div className="text-[10px] text-primary font-semibold mt-1">{fmt(a.price)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : !showFilters && !searchQuery && !selectedCategory && !selectedCity && !selectedStatus ? (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-semibold text-muted-foreground">Trending now</div>
            <div className="grid grid-cols-2 gap-3">
              {ARTWORKS.slice(0, 4).map((a) => (
                <Link
                  key={a.id}
                  to={`/art/${a.id}`}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-card hover-lift"
                >
                  <img
                    src={a.image}
                    width={300}
                    height={200}
                    loading="lazy"
                    alt={a.name}
                    className="h-24 w-full object-cover"
                  />
                  <div className="p-2">
                    <div className="truncate text-xs font-semibold">{a.name}</div>
                    <div className="text-[10px] text-primary font-semibold">{fmt(a.price)}</div>
                  </div>
                </Link>
              ))}
            </div>

            <button className="w-full rounded-2xl bg-primary-grad py-3 text-sm font-semibold text-white shadow-glow">
              Show 24 results
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No results found</p>
          </div>
        )}
      </div>
    </AppFrame>
  );
}

function DesktopMarketplace({
  artworks,
  allArtworks,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCity,
  onCityChange,
  selectedStatus,
  onStatusChange,
  priceRange,
  onPriceRangeChange,
  activeSection,
  onSectionChange,
  userOwnedArtIds,
  userHoldings,
  userName,
  userId,
  walletBalance,
  onWalletBalanceChange,
  initials,
}: {
  artworks: Art[];
  allArtworks: Art[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (value: string | null) => void;
  selectedCity: string | null;
  onCityChange: (value: string | null) => void;
  selectedStatus: string | null;
  onStatusChange: (value: string | null) => void;
  priceRange: { min: number; max: number };
  onPriceRangeChange: (value: { min: number; max: number }) => void;
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  userOwnedArtIds: Set<string>;
  userHoldings: UserHolding[];
  userName: string;
  userId: string;
  walletBalance: number;
  onWalletBalanceChange: (nextBalance: number) => { ok: true } | { ok: false; error: string };
  initials: string;
}) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("100");
  const [network, setNetwork] = useState<(typeof NETWORKS)[number]>("Base");
  const [depositMessage, setDepositMessage] = useState("");
  const categories = ["Painting", "Sculpture", "Textile", "Beadwork", "Photo"];
  const cities = ["Lagos", "Dakar", "Accra", "Ibadan", "Senegal"];
  const statuses = ["For sale", "Swap only", "Any"];
  const walletAddress = walletAddressForUser(userId);
  const depositNaira = Math.max(0, Math.round((Number(depositAmount) || 0) * NAIRA_PER_USDC));
  const featured = artworks[0] || ARTWORKS[0];
  const totalValue = artworks.reduce((sum, art) => sum + art.price, 0);
  const visibleArtworks = artworks;
  const portfolioItems = userHoldings
    .filter((holding) => holding.status === "owned" || holding.status === "listed")
    .map((holding) => ({
      holding,
      art: allArtworks.find((art) => art.id === holding.artId),
    }))
    .filter((item): item is { holding: UserHolding; art: Art } => Boolean(item.art));
  const artists = Array.from(
    allArtworks.reduce((map, art) => {
      const current = map.get(art.artist) ?? {
        name: art.artist,
        city: art.city,
        categories: new Set<string>(),
        value: 0,
        works: [] as Art[],
      };
      current.categories.add(art.category);
      current.value += art.price;
      current.works.push(art);
      map.set(art.artist, current);
      return map;
    }, new Map<string, { name: string; city: string; categories: Set<string>; value: number; works: Art[] }>()).values()
  ).map((artist) => ({
    ...artist,
    categories: Array.from(artist.categories),
  }));

  function handleDeposit() {
    if (depositNaira <= 0) {
      setDepositMessage("Enter a deposit amount first.");
      return;
    }

    const result = onWalletBalanceChange(walletBalance + depositNaira);
    setDepositMessage(
      result.ok ? `${depositAmount} USDC received on ${network}. Liquid balance updated.` : result.error
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8ff] text-slate-950">
      <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)]">
        <aside className="sticky top-0 flex h-screen flex-col border-r border-slate-200/80 bg-white/90 px-6 py-8 backdrop-blur">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-grad text-white shadow-soft">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-black">ArtChain</span>
          </Link>
          <nav className="mt-10 space-y-1 text-sm">
            {[
              { label: "Home", icon: HomeIcon, to: "/" },
              { label: "Explore", icon: Search, section: "explore" },
              { label: "My Portfolio", icon: Wallet, section: "portfolio" },
              { label: "Artists", icon: UserRound, section: "artists" },
            ].map((item) => (
              "to" in item ? (
              <Link
                key={item.label}
                to={item.to as string}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
              ) : (
              <button
                key={item.label}
                type="button"
                onClick={() => onSectionChange(item.section as DashboardSection)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                  activeSection === item.section
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
              )
            ))}
          </nav>
          <div className="mt-8 border-t border-slate-100 pt-6">
            {[
              { label: "Watchlist", icon: Bookmark },
              { label: "Messages", icon: MessageCircle },
              { label: "Settings", icon: Settings },
            ].map((item) => (
              <Link
                key={item.label}
                to="/profile"
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-auto space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{userName}</div>
                  <div className="text-xs text-slate-500">Collector</div>
                </div>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="text-xs text-slate-500">Liquid Balance</div>
                <div className="mt-1 text-xl font-bold">{walletBalance.toLocaleString()} AC</div>
                <div className="text-xs text-slate-500">~ ${(walletBalance / 100).toLocaleString()} USD</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDepositOpen(true);
                setDepositMessage("");
              }}
              className="flex items-center justify-center rounded-2xl bg-primary-grad px-4 py-3 text-sm font-semibold text-white shadow-glow"
            >
              Top Up Wallet
            </button>
          </div>
        </aside>

        <main className="px-8 py-8">
          <header className="mx-auto flex max-w-[1500px] items-center gap-5">
            <div className="flex h-14 flex-1 max-w-[620px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 shadow-sm">
              <Search className="h-5 w-5 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search artworks, artists, cities..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </div>
            <button className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm">
              <Bell className="h-5 w-5" />
            </button>
            <Link
              to="/list"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary-grad px-6 py-3 text-sm font-semibold text-white shadow-glow"
            >
              List Your Art <Plus className="h-4 w-4" />
            </Link>
          </header>

          <div
            className={`mx-auto mt-8 grid max-w-[1500px] gap-7 ${
              activeSection === "explore" ? "grid-cols-[minmax(0,1fr)_340px]" : "grid-cols-1"
            }`}
          >
            <section className="space-y-6">
              {activeSection === "portfolio" ? (
                <PortfolioDashboard items={portfolioItems} walletBalance={walletBalance} userName={userName} initials={initials} />
              ) : activeSection === "artists" ? (
                <ArtistDashboard artists={artists} />
              ) : (
                <>
              <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#d9edff,#f1ddff_54%,#ffe1ed)] p-8 shadow-sm">
                <div className="grid grid-cols-[1fr_320px] items-center gap-8">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-primary">
                      <ShieldCheck className="h-4 w-4" /> Marketplace with proof
                    </div>
                    <h1 className="mt-6 font-display text-5xl font-black leading-tight">
                      Buy, offer, and swap physical art with onchain history.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
                      Browse verified works with unique IDs, certificates, ownership records, exhibition history, restoration notes, and valuation signals.
                    </p>
                  </div>
                  <img
                    src={featured.image}
                    alt={featured.name}
                    loading="eager"
                    decoding="async"
                    className="h-72 w-full rounded-[24px] object-cover shadow-2xl"
                  />
                </div>
              </div>

              <div className="rounded-[28px] bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold">
                      Marketplace
                    </h2>
                    <div className="text-sm text-slate-500">
                      {visibleArtworks.length} verified result{visibleArtworks.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold">
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                  </button>
                </div>

                {visibleArtworks.length > 0 ? (
                  <div className="grid grid-cols-4 gap-5">
                    {visibleArtworks.map((art) => {
                      const isOwned = userOwnedArtIds.has(art.id);
                      return (
                        <article
                          key={art.id}
                          className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-card"
                        >
                          <Link to={`/art/${art.id}`} className="relative block h-52 overflow-hidden">
                            <img
                              src={art.image}
                              alt={art.name}
                              loading="eager"
                              decoding="async"
                              className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                            />
                            <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                              <ShieldCheck className="h-3 w-3" /> verified
                            </div>
                          </Link>
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Link to={`/art/${art.id}`} className="block truncate text-sm font-semibold hover:text-primary">
                                  {art.name}
                                </Link>
                                <div className="mt-1 truncate text-xs text-slate-500">
                                  {art.artist} · {art.city}, {art.year}
                                </div>
                              </div>
                              <button className="text-slate-400 hover:text-primary">
                                <Heart className="h-5 w-5" />
                              </button>
                            </div>
                            <div className="mt-3 font-semibold">{fmt(art.price)}</div>
                            <div className="text-xs text-slate-500">#{art.token}</div>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                              <Link
                                to={isOwned ? "/swap" : `/offer?artId=${art.id}`}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-semibold hover:border-primary hover:text-primary"
                              >
                                {isOwned ? "Swap" : "Offer"}
                              </Link>
                              <Link
                                to={`/checkout/${art.id}`}
                                className="rounded-xl bg-slate-950 px-3 py-2 text-center text-xs font-semibold text-white"
                              >
                                Buy
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid min-h-[320px] place-items-center rounded-2xl bg-slate-50 text-center">
                    <div>
                      <Search className="mx-auto h-9 w-9 text-slate-400" />
                      <div className="mt-3 text-sm font-semibold">No matching artwork</div>
                      <div className="mt-1 text-sm text-slate-500">Try a different city, category, or price range.</div>
                    </div>
                  </div>
                )}
              </div>
                </>
              )}
            </section>

            {activeSection === "explore" && (
            <aside className="space-y-5">
              <div className="rounded-[28px] bg-white p-6 shadow-sm">
                <h2 className="font-display text-lg font-semibold">Filter Artwork</h2>
                <div className="mt-5 space-y-5">
                  <FilterGroup title="Category" options={categories} value={selectedCategory} onChange={onCategoryChange} />
                  <FilterGroup title="City" options={cities} value={selectedCity} onChange={onCityChange} />
                  <FilterGroup
                    title="Status"
                    options={statuses}
                    value={selectedStatus || "Any"}
                    onChange={(value) => onStatusChange(value === "Any" ? null : value)}
                  />
                  <div>
                    <div className="mb-2 text-xs font-semibold text-slate-500">Price range</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={priceRange.min}
                        onChange={(event) =>
                          onPriceRangeChange({ ...priceRange, min: parseInt(event.target.value) || 0 })
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <input
                        type="number"
                        value={priceRange.max}
                        onChange={(event) =>
                          onPriceRangeChange({ ...priceRange, max: parseInt(event.target.value) || 2000000 })
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">Market Snapshot</h2>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-5 space-y-4">
                  {[
                    ["Visible value", fmt(totalValue), "+12.4%"],
                    ["Verified works", artworks.length.toLocaleString(), "live"],
                    ["Avg. listing", artworks.length ? fmt(Math.round(totalValue / artworks.length)) : fmt(0), "current"],
                  ].map(([label, value, meta]) => (
                    <div key={label} className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs text-slate-500">{label}</div>
                      <div className="mt-1 text-xl font-bold">{value}</div>
                      <div className="mt-1 text-xs font-semibold text-emerald-600">{meta}</div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
            )}
          </div>
        </main>
      </div>

      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-[420px] overflow-hidden rounded-3xl border-0 p-0">
          <div className="bg-[hsl(var(--ink))] p-5 text-white">
            <DialogHeader>
              <DialogTitle className="text-left text-xl">Deposit crypto</DialogTitle>
              <DialogDescription className="text-left text-white/55">
                Send USDC to your built-in ArtChain wallet.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 rounded-2xl bg-white/10 p-3">
              <div className="text-[11px] text-white/45">Built-in wallet</div>
              <div className="mt-1 break-all font-mono text-xs">{walletAddress}</div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <div className="mb-2 text-xs font-semibold text-slate-500">Network</div>
              <div className="grid grid-cols-3 gap-2">
                {NETWORKS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setNetwork(item)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      network === item ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500">Amount to credit</label>
              <div className="mt-2 flex items-center rounded-2xl bg-slate-100 px-3 py-2.5">
                <input
                  value={depositAmount}
                  onChange={(event) => {
                    setDepositAmount(event.target.value);
                    setDepositMessage("");
                  }}
                  inputMode="decimal"
                  className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none"
                />
                <span className="text-xs font-semibold text-slate-500">USDC</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">Credits {fmt(depositNaira)}</div>
            </div>

            {depositMessage && (
              <div className="rounded-2xl bg-primary/10 p-3 text-xs font-medium text-primary">
                {depositMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleDeposit}
              className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white shadow-glow"
            >
              Confirm deposit
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PortfolioDashboard({
  items,
  walletBalance,
  userName,
  initials,
}: {
  items: { holding: UserHolding; art: Art }[];
  walletBalance: number;
  userName: string;
  initials: string;
}) {
  const collectionItems =
    items.length > 0
      ? items
      : ARTWORKS.slice(0, 3).map((art, index) => ({
          art,
          holding: {
            id: `demo-${art.id}`,
            userId: "demo",
            artId: art.id,
            status: index === 1 ? "listed" as const : "owned" as const,
            acquiredAt: "2026-05-12T12:00:00.000Z",
          },
        }));
  const [selectedArtId, setSelectedArtId] = useState(collectionItems[0]?.art.id || "");
  const [transferRoute, setTransferRoute] = useState<"platform" | "onchain">("platform");
  const [recipient, setRecipient] = useState("collector@artchain");
  const [transferNote, setTransferNote] = useState("");
  const [transferMessage, setTransferMessage] = useState("");
  const activeHolding = collectionItems.find((item) => item.art.id === selectedArtId) || collectionItems[0];
  const heldArtIds = new Set(collectionItems.map((item) => item.art.id));
  const artValue = collectionItems.reduce((sum, item) => sum + item.art.price, 0);
  const listedCount = collectionItems.filter((item) => item.holding.status === "listed").length;
  const generalBalance = walletBalance + artValue;
  const activeOffers = OFFERS.filter((offer) => collectionItems.some((item) => item.art.category === offer.category)).slice(0, 4);
  const suggestedArt = ARTWORKS.filter((art) => !heldArtIds.has(art.id)).slice(0, 3);

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <section className="rounded-[28px] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-sm font-semibold text-primary">My Portfolio</div>
              <h1 className="mt-2 font-display text-4xl font-black">Collection balance and transfers.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Track liquid funds, collection value, and collection transfers from the desktop dashboard.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                {initials}
              </div>
              <div>
                <div className="text-sm font-semibold">{userName}</div>
                <div className="text-xs text-slate-500">Collector portfolio</div>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              ["General balance", fmt(generalBalance), "Liquid + collection"],
              ["Liquid balance", `${walletBalance.toLocaleString()} AC`, "Spendable wallet"],
              ["Portfolio balance", fmt(artValue), `${collectionItems.length} held, ${listedCount} listed`],
            ].map(([label, value, meta]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">{label}</div>
                <div className="mt-1 text-2xl font-bold">{value}</div>
                <div className="mt-1 text-xs text-slate-500">{meta}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold">Collection holdings</h2>
                <div className="text-sm text-slate-500">Choose a work to route inside the transfer frame</div>
              </div>
              <PackageCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              {collectionItems.map(({ holding, art }) => (
                <button
                  key={holding.id}
                  type="button"
                  onClick={() => {
                    setSelectedArtId(art.id);
                    setTransferMessage("");
                  }}
                  className={`flex w-full items-center gap-4 rounded-2xl p-3 text-left transition ${
                    activeHolding?.art.id === art.id
                      ? "bg-primary/10 ring-1 ring-primary/20"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <img src={art.image} alt={art.name} className="h-20 w-20 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{art.name}</div>
                    <div className="mt-1 truncate text-xs text-slate-500">{art.artist} - {art.city}</div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold">
                      <span className="rounded-full bg-white px-2 py-1 text-primary">{holding.status}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">{art.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{fmt(art.price)}</div>
                    <div className="text-xs text-slate-500">#{art.token}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <div className="relative mx-auto mb-3 grid h-32 w-44 place-items-end overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#0b6fff,#19c6ff)]">
              <div className="absolute inset-x-5 top-4 flex items-center justify-between text-xs font-semibold text-white/85">
                <span>ArtChain</span>
                <ShieldCheck className="h-4 w-4" />
              </div>
              <img
                src={heroCharacter}
                alt="ArtChain blue platform mascot"
                className="relative z-10 h-28 object-contain drop-shadow-[0_18px_22px_rgba(0,24,95,0.35)]"
              />
            </div>
            <h2 className="text-center font-display text-lg font-semibold">Route collection</h2>
            <div className="mt-4 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-semibold">
              {[
                ["platform", "ArtChain user"],
                ["onchain", "Onchain route"],
              ].map(([route, label]) => (
                <button
                  key={route}
                  type="button"
                  onClick={() => {
                    setTransferRoute(route as "platform" | "onchain");
                    setTransferMessage("");
                  }}
                  className={`rounded-xl px-3 py-2 transition ${
                    transferRoute === route ? "bg-slate-950 text-white shadow-sm" : "text-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Collection</span>
                <select
                  value={selectedArtId}
                  onChange={(event) => {
                    setSelectedArtId(event.target.value);
                    setTransferMessage("");
                  }}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                >
                  {collectionItems.map(({ art }) => (
                    <option key={art.id} value={art.id}>{art.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">
                  {transferRoute === "platform" ? "Send to ArtChain user" : "Wallet or ENS destination"}
                </span>
                <input
                  value={recipient}
                  onChange={(event) => {
                    setRecipient(event.target.value);
                    setTransferMessage("");
                  }}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Transfer note</span>
                <input
                  value={transferNote}
                  onChange={(event) => setTransferNote(event.target.value)}
                  placeholder="Optional private memo"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-slate-500">Route fee</div>
                  <div className="mt-1 font-bold">{transferRoute === "platform" ? "0 AC" : "12 AC"}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-slate-500">Route status</div>
                  <div className="mt-1 font-bold">{transferRoute === "platform" ? "Instant" : "Onchain"}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setTransferMessage(
                    `${activeHolding?.art.name || "Collection"} routed to ${recipient || "recipient"} via ${
                      transferRoute === "platform" ? "ArtChain" : "onchain"
                    }.`
                  )
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-glow"
              >
                <Send className="h-4 w-4" /> Send collection
              </button>
              {transferMessage && (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                  {transferMessage}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-[28px] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Active offers</h2>
              <div className="text-xs text-slate-500">Open demand for held categories</div>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="space-y-3">
            {activeOffers.map((offer) => (
              <div key={offer.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-xs font-bold text-primary shadow-sm">
                      {offer.buyerInitials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{offer.buyer}</div>
                      <div className="text-xs text-slate-500">{offer.buyerCity} - {offer.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{fmt(offer.cash)}</div>
                    <Link to="/offer" className="text-xs font-semibold text-primary">Review</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Suggested art</h2>
              <div className="text-xs text-slate-500">Additions based on your holdings</div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {suggestedArt.map((art) => (
              <Link key={art.id} to={`/art/${art.id}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-slate-100">
                <img src={art.image} alt={art.name} className="h-14 w-14 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{art.name}</div>
                  <div className="truncate text-xs text-slate-500">{art.artist}</div>
                </div>
                <div className="text-right text-xs font-semibold">{fmt(art.price)}</div>
              </Link>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function ArtistDashboard({
  artists,
}: {
  artists: { name: string; city: string; categories: string[]; value: number; works: Art[] }[];
}) {
  const trendingArtists = artists
    .map((artist, index) => ({
      ...artist,
      growth: [24, 19, 16, 14, 11, 9][index % 6],
      collectors: [820, 690, 540, 430, 390, 310][index % 6],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const profitableCollections = artists
    .flatMap((artist, artistIndex) =>
      artist.works.map((art, artIndex) => {
        const priceSurge = 12 + ((artistIndex + artIndex) % 5) * 7;
        const resellSurge = 8 + ((artistIndex * 2 + artIndex) % 4) * 6;
        return {
          art,
          artist,
          priceSurge,
          resellSurge,
          change: Math.round(art.price * (priceSurge / 100)),
        };
      })
    )
    .sort((a, b) => b.priceSurge + b.resellSurge - (a.priceSurge + a.resellSurge))
    .slice(0, 4);

  const events = [
    { title: "Lagos Gallery Night", venue: "Victoria Island", time: "Fri, 7:30 PM", tag: "Open viewing" },
    { title: "Accra Modern Fair", venue: "Osu Arts District", time: "Sat, 12:00 PM", tag: "Collector preview" },
    { title: "Ibadan Studio Walk", venue: "Dugbe Quarter", time: "Sun, 4:00 PM", tag: "Artist talks" },
  ];

  const opportunities = [
    { title: "Early collector allocation", detail: "Priority offers on verified Lagos painting drops." },
    { title: "Resale fee holiday", detail: "Reduced marketplace fee on selected sculpture listings." },
  ];

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <section className="rounded-[28px] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-primary">Streaming now</div>
              <h1 className="mt-2 font-display text-4xl font-black">Artist market dashboard.</h1>
            </div>
            <Link to="/explore" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              Explore art <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-3">
            {trendingArtists.map((artist) => {
              const hero = artist.works[0];
              return (
                <Link
                  key={artist.name}
                  to={hero ? `/art/${hero.id}` : "/explore"}
                  className="group relative grid h-14 w-14 place-items-center rounded-full border-2 border-white bg-slate-100 shadow-sm ring-2 ring-primary/20"
                  title={artist.name}
                >
                  {hero ? (
                    <img src={hero.image} alt={artist.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <UserRound className="h-5 w-5 text-slate-500" />
                  )}
                  <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                    {artist.works.length}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Popular this week</h2>
              <div className="text-sm text-slate-500">Trending artists with rising collector attention</div>
            </div>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            {trendingArtists.slice(0, 2).map((artist) => {
              const hero = artist.works[0];
              return (
                <Link
                  key={artist.name}
                  to={hero ? `/art/${hero.id}` : "/explore"}
                  className="group relative min-h-[320px] overflow-hidden rounded-[28px] bg-slate-900 shadow-sm"
                >
                  {hero && (
                    <img
                      src={hero.image}
                      alt={hero.name}
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/88 via-slate-950/25 to-transparent" />
                  <div className="absolute left-5 top-5 rounded-2xl bg-white/92 px-3 py-2 text-xs font-semibold text-primary shadow-sm">
                    +{artist.growth}% interest
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white/75">
                      <MapPin className="h-3.5 w-3.5" /> {artist.city}
                    </div>
                    <h3 className="mt-2 font-display text-2xl font-black">{artist.name}</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-white/80">
                      {artist.categories.join(", ")} artist with {artist.collectors} weekly collector views.
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Profitable collections</h2>
              <div className="text-sm text-slate-500">Art with price surge, resale surge, and value change</div>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {profitableCollections.map(({ art, artist, priceSurge, resellSurge, change }) => (
              <Link
                key={art.id}
                to={`/art/${art.id}`}
                className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3 transition hover:bg-slate-100"
              >
                <img src={art.image} alt={art.name} className="h-16 w-16 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{art.name}</div>
                  <div className="mt-1 truncate text-xs text-slate-500">{artist.name} - {art.category}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">+{priceSurge}% price</span>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">+{resellSurge}% resale</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{fmt(art.price)}</div>
                  <div className="text-xs font-semibold text-emerald-600">+{fmt(change)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-[28px] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Upcoming art events</h2>
              <div className="text-xs text-slate-500">Across town this week</div>
            </div>
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.title} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{event.title}</h3>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-primary">{event.tag}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> {event.venue}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CalendarDays className="h-3.5 w-3.5" /> {event.time}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#e7fbff,#eef0ff_52%,#fff1f4)] p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" /> Special offers and opportunity
          </div>
          <h2 className="mt-3 font-display text-2xl font-black">Collector advantage week</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Access selected artist drops, reduced resale fees, and curated city events from one dashboard.
          </p>
          <div className="mt-5 space-y-3">
            {opportunities.map((item) => (
              <div key={item.title} className="rounded-2xl bg-white/75 p-4">
                <div className="text-sm font-semibold">{item.title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</div>
              </div>
            ))}
          </div>
          <Link
            to="/offer"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-glow"
          >
            View opportunities <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </aside>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold text-slate-500">{title}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              onClick={() => onChange(active ? null : option)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
