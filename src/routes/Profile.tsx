import { AppFrame } from "@/components/AppFrame";
import { getAllArtworks, fmt } from "@/lib/art-data";
import { BadgeCheck, Wallet, LogIn, TrendingUp, Repeat2, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { getUserHoldings, getHoldings } from "@/lib/db";

export default function Profile() {
  const { user, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  
  // Get user holdings and balance
  const userHoldings = user ? getUserHoldings(user.id) : { owned: 0, listed: 0, swapped: 0, arts: [] };
  const allHoldings = user ? getHoldings(user.id) : [];
  const balance = user?.walletBalance ?? 0;

  // Get artworks that belong to this user (deduplicated by artId)
  const allArtworks = getAllArtworks();
  
  // Calculate portfolio balance (total value of owned artworks)
  const uniqueOwnedIds = new Set<string>();
  const portfolioBalance = userHoldings.arts
    .filter((holding) => holding.status === "owned")
    .reduce((total, holding) => {
      if (uniqueOwnedIds.has(holding.artId)) return total;
      uniqueOwnedIds.add(holding.artId);
      const art = allArtworks.find((a) => a.id === holding.artId);
      return total + (art?.price ?? 0);
    }, 0);

  // Get artworks for display (deduplicated by artId)
  const uniqueArtIds = new Set<string>();
  const userArts = userHoldings.arts
    .slice(0, 3)
    .filter((holding) => {
      if (uniqueArtIds.has(holding.artId)) return false;
      uniqueArtIds.add(holding.artId);
      return true;
    })
    .map((holding) => {
      const art = allArtworks.find((a) => a.id === holding.artId);
      return { art, holding };
    })
    .filter((item) => item.art);

  return (
    <AppFrame label="Profile · Wallet">
      <div className="px-5 pt-3 pb-6">
        <div className="flex items-end gap-3 px-1">
          <button
            onClick={() => {
              if (user) {
                signOut();
              } else {
                setAuthOpen(true);
              }
            }}
            className="grid h-16 w-16 place-items-center rounded-2xl bg-card text-lg font-bold text-primary ring-4 ring-card shadow-glow hover:opacity-80 transition-opacity cursor-pointer"
          >
            {user ? user.avatar : "?"}
          </button>
          <div className="pb-1">
            {user ? (
              <>
                <div className="flex items-center gap-1.5 font-display text-lg font-semibold">
                  {user.name} <BadgeCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Lagos · Collector since{" "}
                  {new Date(user.createdAt).toLocaleDateString("en", {
                    year: "numeric",
                    month: "long",
                  })}
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground cursor-help">
                  Click avatar to sign out
                </div>
              </>
            ) : (
              <>
                <div className="font-display text-lg font-semibold text-muted-foreground">
                  Guest
                </div>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="mt-1 flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  <LogIn className="h-3.5 w-3.5" /> Sign in to your account
                </button>
              </>
            )}
          </div>
        </div>

        {user ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* Wallet Balance */}
              <div className="rounded-3xl bg-[hsl(var(--ink))] p-4 text-white shadow-glow animate-fade-up">
                <div className="flex items-center gap-2 text-[11px] text-white/60">
                  <Wallet className="h-3.5 w-3.5" /> Wallet
                </div>
                <div className="mt-1 font-display text-2xl font-semibold">{fmt(balance)}</div>
                <div className="text-[10px] text-white/50">Liquid funds</div>
              </div>

              {/* Portfolio Balance */}
              <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-4 text-white shadow-glow animate-fade-up">
                <div className="flex items-center gap-2 text-[11px] text-white/70">
                  <TrendingUp className="h-3.5 w-3.5" /> Portfolio
                </div>
                <div className="mt-1 font-display text-2xl font-semibold">{fmt(portfolioBalance)}</div>
                <div className="text-[10px] text-white/50">Art value</div>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-card p-3 text-center">
              <div className="text-xs text-muted-foreground">Total Assets</div>
              <div className="mt-1 font-display text-xl font-semibold text-gradient">{fmt(balance + portfolioBalance)}</div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {(
                [
                  [userHoldings.owned.toString(), "Owned"],
                  [userHoldings.listed.toString(), "Listed"],
                  [userHoldings.swapped.toString(), "Swaps"],
                ] as [string, string][]
              ).map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-muted/60 p-3 text-center">
                  <div className="font-display text-lg font-semibold">{v}</div>
                  <div className="text-[10px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 text-sm font-semibold">My collection</div>
            {userArts.length > 0 ? (
              <div className="mt-2 space-y-3">
                {userArts.map(({ art, holding }, i) => (
                  <div
                    key={holding.id}
                    className="rounded-2xl border border-border bg-card p-3 shadow-card animate-fade-up"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <img src={art!.image} alt={art!.name} className="h-16 w-16 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold">{art!.name}</div>
                        <div className="text-[10px] text-muted-foreground">{art!.artist}</div>
                        <div className="mt-1 text-xs text-primary font-semibold">{fmt(art!.price)}</div>
                        <div className={`text-[9px] mt-0.5 ${holding.status === 'listed' ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ● {holding.status}
                        </div>
                      </div>
                    </div>
                    
                    {holding.status === 'owned' && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link
                          to="/list"
                          className="rounded-lg bg-primary/10 hover:bg-primary/20 py-2 text-center text-[10px] font-semibold text-primary transition flex items-center justify-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> List
                        </Link>
                        <Link
                          to="/swap"
                          className="rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 py-2 text-center text-[10px] font-semibold text-emerald-600 transition flex items-center justify-center gap-1"
                        >
                          <Repeat2 className="h-3 w-3" /> Swap
                        </Link>
                      </div>
                    )}

                    {holding.status === 'listed' && (
                      <div className="mt-3">
                        <button className="w-full rounded-lg bg-amber-500/10 hover:bg-amber-500/20 py-2 text-center text-[10px] font-semibold text-amber-600 transition flex items-center justify-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Listed for sale
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-2xl border border-border bg-muted/30 p-4 text-center">
                <div className="text-xs text-muted-foreground">No artworks in collection</div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center">
            <div className="text-4xl mb-3">🎨</div>
            <div className="font-display text-base font-semibold">Start your collection</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign in to track your artworks, wallet, and trades.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="mt-4 rounded-2xl bg-primary-grad px-6 py-2.5 text-sm font-semibold text-white shadow-glow"
            >
              Sign in / Sign up
            </button>
          </div>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </AppFrame>
  );
}
