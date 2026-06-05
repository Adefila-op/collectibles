import { AppFrame } from "@/components/AppFrame";
import { fmt, type Art } from "@/lib/art-data";
import { useAuth } from "@/contexts/AuthContext";
import { holdingsAPI, offersAPI, artAPI } from "@/lib/api";
import { swapAPI } from "@/lib/api";
import {
  ArrowDownUp,
  ShieldCheck,
  Sparkles,
  Truck,
  CheckCircle2,
  Coins,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";

type Offer = {
  id: string;
  buyer_id: string;
  art_id: string;
  cash: number;
  buyer_initials?: string;
  buyer_city?: string;
  placed_ago?: string;
  category?: string;
  status: string;
};

type Stage = 0 | 1 | 2 | 3 | 4;

export default function SwapPage() {
  const { user } = useAuth();
  const [userHoldings, setUserHoldings] = useState<any[]>([]);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [allArtworks, setAllArtworks] = useState<Art[]>([]);
  const [loading, setLoading] = useState(true);
  const query = new URLSearchParams(window.location.search);
  const requestedArtId = query.get("artId");
  const requestedOfferId = query.get("offerId");

  // Fetch all data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [holdings, offers, artworks] = await Promise.all([
          user?.id ? holdingsAPI.getByUserId(user.id) : Promise.resolve([]),
          offersAPI.getAll(),
          artAPI.getAll(),
        ]);
        setUserHoldings(holdings || []);
        setAllOffers((offers || []).filter((o: Offer) => o.status === 'pending'));
        setAllArtworks(artworks || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const ownedHolding =
    userHoldings.find((holding) => holding.status !== "swapped" && holding.art_id === requestedArtId) ||
    userHoldings.find((holding) => holding.status !== "swapped") ||
    null;
  const myArt: Art = ownedHolding ? (allArtworks.find((art) => art.id === ownedHolding.art_id) || allArtworks[0]) : (allArtworks[0] || { id: "placeholder", name: "Your Art", artist: "You", city: "Location", year: 2024, category: "Art", price: 0, image: "" } as Art);
  const [selected, setSelected] = useState<Offer | null>(null);
  const [stage, setStage] = useState<Stage>(0);
  const [message, setMessage] = useState("");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function acceptStandingOffer(offer: Offer) {
    if (!user || !ownedHolding) {
      setMessage("Sign in with an owned artwork before accepting a swap offer.");
      return;
    }

    setIsProcessing(true);
    try {
      // Get the offer details and buyer info
      const result = await offersAPI.accept(offer.id, user.id);
      
      setTransactionId(result.transaction?.id || offer.id);
      setSelected(offer);
      setMessage("✓ Swap proposal accepted! Artworks locked in escrow.");
      setStage(1);
    } catch (error: any) {
      setMessage(error.message || "Failed to accept swap proposal.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function completeSwap() {
    if (!transactionId || !selected) {
      setMessage("Transaction ID not found.");
      return;
    }

    setIsProcessing(true);
    try {
      if (!user) {
        setMessage("You must be logged in to accept offers.");
        return;
      }
      // Call the accept endpoint to complete the swap
      const result = await offersAPI.accept(selected.id, user.id);
      setMessage("✓ Swap completed! Artworks exchanged and funds released.");
      setStage(4);
    } catch (error: any) {
      setMessage(error.message || "Failed to complete swap.");
    } finally {
      setIsProcessing(false);
    }
  }

  // Auto-accept the highest offer when component loads
  useEffect(() => {
    if (allOffers.length > 0 && !selected && myArt) {
      // Filter offers by category matching user's artwork
      const relevantOffers = allOffers
        .filter((o: Offer) => !o.category || o.category === myArt.category)
        .sort((a: Offer, b: Offer) => (b.cash || 0) - (a.cash || 0));
      
      if (relevantOffers.length > 0) {
        const topOffer = relevantOffers[0];
        // Auto-accept the top offer
        acceptStandingOffer(topOffer);
      }
    }
  }, [allOffers, myArt, selected]);

  const matching = useMemo(() => {
    if (!myArt) return [];
    const offers = allOffers
      .filter((o: Offer) => !o.category || o.category === myArt.category)
      .sort((a: Offer, b: Offer) => (b.cash || 0) - (a.cash || 0));
    
    if (!requestedOfferId) return offers;
    return offers.sort((a: Offer, b: Offer) => {
      if (a.id === requestedOfferId) return -1;
      if (b.id === requestedOfferId) return 1;
      return 0;
    });
  }, [myArt, allOffers, requestedOfferId]);
  const top = matching[0];

  if (selected) {
    return (
      <AppFrame label={`Swap · ${selected.id}`}>
        <AcceptedFlow
          offer={selected}
          art={myArt}
          stage={stage}
          setStage={setStage}
          onBack={() => {
            setSelected(null);
            setStage(0);
            setTransactionId(null);
          }}
          onComplete={completeSwap}
          isProcessing={isProcessing}
          message={message}
        />
      </AppFrame>
    );
  }

  return (
    <AppFrame label="Swap into top offer">
      <div className="space-y-4 px-5 pt-3 pb-6">
        <div>
          <h2 className="font-display text-xl font-semibold">Swap into a live offer</h2>
          <p className="text-xs text-muted-foreground">
            Buyers post standing offers for collections. Match yours in one tap — auto-accepts highest offer.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border bg-muted p-6 text-center">
            <div className="text-sm text-muted-foreground">Loading offers...</div>
          </div>
        ) : allOffers.length === 0 ? (
          <div className="rounded-2xl border border-border bg-muted p-6 text-center">
            <div className="text-sm text-muted-foreground">No active offers at the moment</div>
          </div>
        ) : (
          <>
            <div className="rounded-3xl bg-primary-grad p-[1px] shadow-glow animate-pop">
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
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-grad text-white shadow-glow animate-float">
                    <ArrowDownUp className="h-4 w-4" />
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {matching.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> {selected ? "Accepted offer" : "Top open offer"}
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {matching[0].id}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl font-semibold text-gradient">
                        {fmt(matching[0].cash || 0)}
                      </span>
                      <span className="text-xs text-muted-foreground">naira</span>
                    </div>
                    {selected && (
                      <button
                        onClick={() => completeSwap()}
                        disabled={isProcessing}
                        className="w-full rounded-2xl bg-primary-grad py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
                      >
                        {isProcessing ? "Completing swap..." : "Complete Swap →"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {matching.length > 1 && (
              <div>
                <div className="mb-2 text-xs font-semibold">Other offers</div>
                <div className="space-y-2">
                  {matching.slice(1).map((o: Offer) => (
                    <button
                      key={o.id}
                      onClick={() => acceptStandingOffer(o)}
                      disabled={isProcessing}
                      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50 transition"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                        {o.buyer_initials || o.buyer_id?.slice(0, 2).toUpperCase() || "B"}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-xs font-semibold">{o.buyer_city || "Buyer"}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Offer #{o.id?.slice(0, 8)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-primary">{fmt(o.cash || 0)}</div>
                        <div className="text-[10px] text-muted-foreground">naira</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[11px] text-emerald-700">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> Highest offer automatically accepted. Funds and artworks locked in escrow.
        </div>

        {message && (
          <div className={`rounded-2xl p-3 text-xs font-semibold ${message.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
            {message}
          </div>
        )}
      </div>
    </AppFrame>
  );
}

function AcceptedFlow({
  offer,
  art,
  stage,
  setStage,
  onBack,
  onComplete,
  isProcessing,
  message,
}: {
  offer: Offer;
  art: Art;
  stage: Stage;
  setStage: (s: Stage) => void;
  onBack: () => void;
  onComplete: () => Promise<void>;
  isProcessing: boolean;
  message: string;
}) {
  const steps = [
    { icon: CheckCircle2, t: "Swap accepted onchain", d: "Both parties notified instantly" },
    { icon: Truck, t: "Artworks locked in escrow", d: "Both pieces secured in vault" },
    { icon: ShieldCheck, t: "Conditions verified", d: "Both artworks confirmed received" },
    { icon: Sparkles, t: "Exchange confirmed", d: "Both parties approve swap" },
    { icon: Coins, t: "Swap completed", d: `Artworks and funds exchanged` },
  ];

  const handleComplete = async () => {
    if (stage === 3) {
      await onComplete();
      setStage(4);
    } else if (stage < 4) {
      setStage((stage + 1) as Stage);
    }
  };

  return (
    <div className="space-y-4 px-5 pt-3 pb-6">
      <button onClick={onBack} className="text-xs text-muted-foreground">
        ← Back to offers
      </button>

      <div className="rounded-3xl bg-primary-grad p-4 text-white shadow-glow animate-pop">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-white/80">
          <span>Swap accepted</span>
          <span>{offer.id}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <img
            src={art.image}
            alt={art.name}
            className="h-14 w-14 rounded-xl object-cover ring-2 ring-white/30"
          />
          <ArrowDownUp className="h-4 w-4 text-white/80" />
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/15 text-lg font-semibold">
            {offer.buyer_initials || "B"}
          </div>
        </div>
        <div className="mt-3 font-display text-2xl font-semibold">{fmt(offer.cash)}</div>
        <div className="text-xs text-white/80">from buyer · escrow locked</div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="mb-3 text-xs font-semibold">Swap progress</div>
        <div className="space-y-3">
          {steps.map((s, i) => {
            const done = i < stage;
            const active = i === stage;
            const Icon = s.icon;
            return (
              <div key={s.t} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-full transition-all ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                        ? "bg-primary-grad text-white shadow-glow animate-pulse"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`w-px flex-1 ${done ? "bg-emerald-500" : "bg-border"}`}
                      style={{ minHeight: 18 }}
                    />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <div className={`text-xs font-semibold ${active ? "text-primary" : ""}`}>
                    {s.t}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{s.d}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {message && (
        <div className={`rounded-2xl p-3 text-xs font-semibold ${message.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
          {message}
        </div>
      )}

      {stage < 4 ? (
        <button
          onClick={handleComplete}
          disabled={isProcessing}
          className="w-full rounded-2xl bg-primary-grad py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
        >
          {isProcessing ? "Processing..." : stage === 0 && "Confirm swap →"}
          {!isProcessing && stage === 1 && "Mark artworks locked →"}
          {!isProcessing && stage === 2 && "Verify conditions →"}
          {!isProcessing && stage === 3 && "Complete swap →"}
        </button>
      ) : (
        <button
          onClick={onBack}
          className="w-full rounded-2xl border border-primary/30 bg-primary/5 py-3 text-sm font-semibold text-primary"
        >
          Back to offers
        </button>
      )}
    </div>
  );
}
