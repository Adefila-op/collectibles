import { Link } from "react-router-dom";
import { AppFrame } from "@/components/AppFrame";
import { getAllArtworks, fmt, ARTWORKS, type Art } from "@/lib/art-data";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bell,
  Bookmark,
  Heart,
  Home as HomeIcon,
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
  UserRound,
  Wallet,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getHoldings, type UserHolding } from "@/lib/db";

type DashboardSection = "explore" | "collections" | "portfolio" | "artists";

export default function Explore() {
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: 50000, max: 2000000 });
  const [activeSection, setActiveSection] = useState<DashboardSection>("explore");

  const allArtworks = useMemo(() => getAllArtworks(), []);
  const userHoldings = user ? getHoldings(user.id) : [];
  const userOwnedArtIds = new Set(userHoldings.map((h) => h.artId));

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
          onSectionChange={setActiveSection}
          userOwnedArtIds={userOwnedArtIds}
          userHoldings={userHoldings}
          userName={user?.name || "Kwame Mensah"}
          walletBalance={user?.walletBalance || 1240500}
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
  walletBalance,
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
  walletBalance: number;
  initials: string;
}) {
  const categories = ["Painting", "Sculpture", "Textile", "Beadwork", "Photo"];
  const cities = ["Lagos", "Dakar", "Accra", "Ibadan", "Senegal"];
  const statuses = ["For sale", "Swap only", "Any"];
  const featured = artworks[0] || ARTWORKS[0];
  const totalValue = artworks.reduce((sum, art) => sum + art.price, 0);
  const visibleArtworks = activeSection === "collections" ? allArtworks : artworks;
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
              { label: "Collections", icon: PackageCheck, section: "collections" },
              { label: "My Portfolio", icon: Wallet, section: "portfolio" },
              { label: "Activity", icon: Activity, section: "portfolio" },
              { label: "Artists", icon: UserRound, section: "artists" },
              { label: "Offers", icon: Send, to: "/offer" },
              { label: "Certificates", icon: BadgeCheck, section: "portfolio" },
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
                <div className="text-xs text-slate-500">Wallet Balance</div>
                <div className="mt-1 text-xl font-bold">{walletBalance.toLocaleString()} AC</div>
                <div className="text-xs text-slate-500">~ ${(walletBalance / 100).toLocaleString()} USD</div>
              </div>
            </div>
            <Link
              to="/profile"
              className="flex items-center justify-center rounded-2xl bg-primary-grad px-4 py-3 text-sm font-semibold text-white shadow-glow"
            >
              Top Up Wallet
            </Link>
          </div>
        </aside>

        <main className="px-8 py-8">
          <header className="mx-auto flex max-w-[1500px] items-center gap-5">
            <div className="flex h-14 flex-1 max-w-[620px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 shadow-sm">
              <Search className="h-5 w-5 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search artworks, artists, collections..."
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
              activeSection === "explore" || activeSection === "collections"
                ? "grid-cols-[minmax(0,1fr)_340px]"
                : "grid-cols-1"
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
                      <ShieldCheck className="h-4 w-4" /> {activeSection === "collections" ? "Complete collection" : "Marketplace with proof"}
                    </div>
                    <h1 className="mt-6 font-display text-5xl font-black leading-tight">
                      {activeSection === "collections"
                        ? "All verified art, collected in one dashboard."
                        : "Buy, offer, and swap physical art with onchain history."}
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
                      {activeSection === "collections"
                        ? "Browse the full ArtChain catalogue without leaving the desktop dashboard."
                        : "Browse verified works with unique IDs, certificates, ownership records, exhibition history, restoration notes, and valuation signals."}
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
                      {activeSection === "collections" ? "All art" : "Marketplace"}
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

            {(activeSection === "explore" || activeSection === "collections") && (
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
  const artValue = items.reduce((sum, item) => sum + item.art.price, 0);
  const listedCount = items.filter((item) => item.holding.status === "listed").length;

  return (
    <>
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="text-sm font-semibold text-primary">My Portfolio</div>
            <h1 className="mt-2 font-display text-4xl font-black">Your wallet and artwork, inside the dashboard.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Track owned works, listed pieces, and portfolio value without leaving the desktop workspace.
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
            ["Wallet balance", `${walletBalance.toLocaleString()} AC`],
            ["Artwork value", fmt(artValue)],
            ["Listed works", listedCount.toLocaleString()],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="mt-1 text-2xl font-bold">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Owned artwork</h2>
            <div className="text-sm text-slate-500">{items.length} portfolio item{items.length === 1 ? "" : "s"}</div>
          </div>
        </div>
        {items.length > 0 ? (
          <div className="grid grid-cols-4 gap-5">
            {items.map(({ holding, art }) => (
              <article key={holding.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <Link to={`/art/${art.id}`} className="block h-52 overflow-hidden">
                  <img src={art.image} alt={art.name} className="h-full w-full object-cover" />
                </Link>
                <div className="p-4">
                  <Link to={`/art/${art.id}`} className="block truncate text-sm font-semibold hover:text-primary">
                    {art.name}
                  </Link>
                  <div className="mt-1 truncate text-xs text-slate-500">{art.artist} - {art.city}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-semibold">{fmt(art.price)}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                      {holding.status}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-[260px] place-items-center rounded-2xl bg-slate-50 text-center">
            <div>
              <Wallet className="mx-auto h-9 w-9 text-slate-400" />
              <div className="mt-3 text-sm font-semibold">No portfolio artwork yet</div>
              <div className="mt-1 text-sm text-slate-500">Purchases and listings will appear here.</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ArtistDashboard({
  artists,
}: {
  artists: { name: string; city: string; categories: string[]; value: number; works: Art[] }[];
}) {
  return (
    <>
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-primary">Artists</div>
        <h1 className="mt-2 font-display text-4xl font-black">Artist profiles in the dashboard.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Browse artists as a grid, preview their work, and stay in the desktop dashboard.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {artists.map((artist) => {
          const hero = artist.works[0];
          return (
            <article key={artist.name} className="overflow-hidden rounded-[24px] bg-white shadow-sm">
              <div className="grid h-48 grid-cols-2 gap-1 bg-slate-100">
                {artist.works.slice(0, 4).map((art) => (
                  <img key={art.id} src={art.image} alt={art.name} className="h-full w-full object-cover" />
                ))}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold">{artist.name}</h2>
                    <div className="mt-1 text-xs text-slate-500">{artist.city}</div>
                  </div>
                  <div className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                    {artist.works.length}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {artist.categories.map((category) => (
                    <span key={category} className="rounded-full border border-slate-200 px-2 py-1 text-[10px] text-slate-600">
                      {category}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <div className="text-[10px] text-slate-500">Market value</div>
                    <div className="text-sm font-semibold">{fmt(artist.value)}</div>
                  </div>
                  {hero && (
                    <Link to={`/art/${hero.id}`} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
                      View work
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
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
