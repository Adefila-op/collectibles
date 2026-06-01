import { Link, useNavigate } from "react-router-dom";
import { AppFrame } from "@/components/AppFrame";
import { getAllArtworks, fmt } from "@/lib/art-data";
import { useAuth } from "@/contexts/AuthContext";
import { getHoldings } from "@/lib/db";
import { ArrowLeft, ShoppingCart } from "lucide-react";

export default function BuyArt() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const allArtworks = getAllArtworks();
  const allHoldings = getHoldings();
  const userHeldArtIds = new Set(
    user ? allHoldings.filter((h) => h.userId === user.id && h.status !== "swapped").map((h) => h.artId) : []
  );

  const availableForPurchase = allArtworks.filter((art) => {
    if (userHeldArtIds.has(art.id)) return false;
    const activeHolding = allHoldings.find((h) => h.artId === art.id && h.status !== "swapped");
    return !activeHolding || activeHolding.status === "listed";
  });

  return (
    <AppFrame label="Buy Art">
      <div className="space-y-4 px-5 pt-3 pb-6">
        {/* Back button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card hover:bg-muted transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-semibold">Buy Art</div>
        </div>

        {availableForPurchase.length === 0 ? (
          // No art available
          <div className="space-y-4 pt-4">
            <div className="rounded-2xl border border-border bg-muted/60 p-6 text-center space-y-3">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">No art listed for sale</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  All available artworks have been purchased or listed
                </p>
              </div>
            </div>

            {/* Suggested artworks section */}
            <div className="pt-4 space-y-3">
              <div className="text-sm font-semibold">Explore other artworks</div>
              <div className="grid grid-cols-2 gap-3">
                {allArtworks.slice(0, 4).map((a) => (
                  <Link
                    key={a.id}
                    to={`/art/${a.id}`}
                    className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card hover-lift"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={a.image}
                        alt={a.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-2.5">
                      <div className="truncate text-xs font-semibold">{a.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {a.artist} · {a.city}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-primary">{fmt(a.price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Art available for purchase
          <div className="space-y-3 pt-2">
            <div className="text-xs font-semibold text-muted-foreground">
              {availableForPurchase.length} artwork{availableForPurchase.length !== 1 ? "s" : ""}{" "}
              available
            </div>
            <div className="grid grid-cols-2 gap-3">
              {availableForPurchase.map((a) => (
                <Link
                  key={a.id}
                  to={`/checkout/${a.id}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card hover-lift"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={a.image}
                      alt={a.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="rounded-full bg-primary px-2 py-1 text-[10px] text-white font-semibold flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3" /> Buy
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div className="truncate text-xs font-semibold">{a.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {a.artist} · {a.city}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-primary">{fmt(a.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppFrame>
  );
}
