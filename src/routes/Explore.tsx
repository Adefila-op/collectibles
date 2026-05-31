import { Link } from "react-router-dom";
import { AppFrame } from "@/components/AppFrame";
import { getAllArtworks, fmt } from "@/lib/art-data";
import { Search, SlidersHorizontal, Send, Repeat2, ShoppingCart } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getHoldings } from "@/lib/db";

export default function Explore() {
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: 50000, max: 2000000 });

  const userHoldings = user ? getHoldings(user.id) : [];
  const userOwnedArtIds = new Set(userHoldings.map((h) => h.artId));

  const filteredArtworks = useMemo(() => {
    let results = getAllArtworks();

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
      results = results.filter((a) => !userOwnedArtIds.has(a.id) || !a.swap);
    } else if (selectedStatus === "Swap only") {
      results = results.filter((a) => a.swap);
    }

    return results;
  }, [searchQuery, selectedCategory, selectedCity, selectedStatus, priceRange, userOwnedArtIds]);

  return (
    <AppFrame label="Explore · Filters">
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
                onChange: (val) => setSelectedStatus(val === "Any" ? null : val)
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
                          className="flex items-center gap-1 rounded-full bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs text-white font-semibold transition"
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
