import { OFFERS, type Offer } from "@/lib/offers-data";
import { ARTWORKS, getAllArtworks, fmt, type Art } from "@/lib/art-data";
import { useAuth } from "@/contexts/AuthContext";
import { holdingsAPI, swapsAPI } from "@/lib/api-transactions";
import {
  ArrowDownUp,
  ShieldCheck,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SwapModal({ open, onOpenChange }: SwapModalProps) {
  const { user, updateWalletBalance } = useAuth();
  const [userHoldings, setUserHoldings] = useState<any[]>([]);
  const allArtworks = getAllArtworks();

  // Fetch user holdings on component mount
  useEffect(() => {
    const fetchHoldings = async () => {
      if (user?.id) {
        try {
          const holdings = await holdingsAPI.getByUser(user.id);
          setUserHoldings(holdings);
        } catch (error) {
          console.error("Error fetching holdings:", error);
        }
      }
    };
    if (open) {
      fetchHoldings();
    }
  }, [user?.id, open]);

  const ownedHolding = user ? userHoldings.find((holding) => holding.status === "owned") : null;
  const [myArt] = useState<Art>(
    ownedHolding ? allArtworks.find((art) => art.id === ownedHolding.artId) || ARTWORKS[0] : ARTWORKS[0]
  );
  const [message, setMessage] = useState("");

  async function acceptStandingOffer(offer: Offer) {
    if (!user || !ownedHolding) {
      setMessage("Sign in with an owned artwork before accepting a swap offer.");
      return;
    }

    try {
      // Call API to propose swap
      await swapsAPI.proposeSwap({
        initiatorUserId: user.id,
        initiatorHoldingId: ownedHolding.id,
        targetHoldingId: offer.offeredArt?.id || offer.id,
      });
      
      setMessage(`Swap accepted! You'll receive ${fmt(offer.cash)}.`);
      
      // Auto-close after success message
      setTimeout(() => {
        onOpenChange(false);
        setMessage("");
      }, 1500);
    } catch (error) {
      setMessage("Error proposing swap. Please try again.");
      console.error("Error proposing swap:", error);
    }
  }

  const matching = useMemo(
    () =>
      [...OFFERS.filter((o) => o.category === myArt.category)].sort((a, b) => b.cash - a.cash),
    [myArt.category]
  );
  const top = matching[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] rounded-3xl border-0 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Swap into a live offer</DialogTitle>
          <DialogDescription>
            Buyers post standing offers for collections. Match yours in one tap.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Your piece info */}
          <div className="rounded-3xl bg-primary-grad p-[1px] shadow-glow">
            <div className="rounded-[calc(1.5rem-1px)] bg-card p-3">
              <div className="flex items-center gap-3">
                <img
                  src={myArt.image}
                  alt={myArt.name}
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Your piece
                  </div>
                  <div className="truncate text-sm font-semibold">{myArt.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {myArt.category} · {myArt.artist}
                  </div>
                </div>
              </div>

              <div className="my-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-grad text-white shadow-glow">
                  <ArrowDownUp className="h-4 w-4" />
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>

              {top && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Top offer
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {top.id}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-semibold text-gradient">
                      {fmt(top.cash)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      cash{top.offeredArt && " + art"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                      {top.buyerInitials}
                    </span>
                    {top.buyer} · {top.buyerCity} · {top.placedAgo}
                  </div>
                  <button
                    onClick={() => acceptStandingOffer(top)}
                    className="w-full rounded-2xl bg-primary-grad py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
                  >
                    Swap for {fmt(top.cash)} →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Other offers */}
          {matching.length > 1 && (
            <div>
              <div className="mb-2 text-xs font-semibold">Other matching offers</div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {matching.slice(1).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => acceptStandingOffer(o)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card hover:border-primary/50 hover:bg-card/80 transition"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary flex-shrink-0">
                      {o.buyerInitials}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs font-semibold truncate">{o.buyer}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {o.buyerCity} · {o.placedAgo}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-primary">{fmt(o.cash)}</div>
                      {o.offeredArt && <div className="text-[10px] text-muted-foreground">+ art</div>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[11px] text-emerald-700">
            <ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> Funds locked in escrow immediately.
            Released after condition review.
          </div>

          {message && (
            <div className="rounded-2xl bg-primary/10 p-3 text-xs font-semibold text-primary">
              {message}
            </div>
          )}

          <button
            onClick={() => onOpenChange(false)}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-muted"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
