import { AppFrame } from "@/components/AppFrame";
import { OFFERS, type Offer } from "@/lib/offers-data";
import { ARTWORKS, getAllArtworks, fmt, type Art } from "@/lib/art-data";
import { useAuth } from "@/contexts/AuthContext";
import { getHoldings } from "@/lib/db";
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
import { useMemo, useState } from "react";

type Stage = 0 | 1 | 2 | 3 | 4;

export default function SwapPage() {
  const { user } = useAuth();
  const allArtworks = getAllArtworks();
  const query = new URLSearchParams(window.location.search);
  const requestedArtId = query.get("artId");
  const requestedOfferId = query.get("offerId");
  const userHoldings = user ? getHoldings(user.id) : [];
  const ownedHolding =
    userHoldings.find((holding) => holding.status !== "swapped" && holding.artId === requestedArtId) ||
    userHoldings.find((holding) => holding.status !== "swapped") ||
    null;
  const myArt: Art = ownedHolding ? allArtworks.find((art) => art.id === ownedHolding.artId) || ARTWORKS[0] : ARTWORKS[0];
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
      // For now, use the offer data as-is since it's from OFFERS data
      // In a real system, this would get the actual offerer's ID and artwork
      // For demo purposes, we'll use placeholder values
      const buyerId = "placeholder-buyer-id";
      const buyerArtId = "placeholder-art-id";
      
      const result = await swapAPI.propose(
        user.id,
        buyerId,
        ownedHolding.artId,
        buyerArtId,
        offer.cash || 0
      );

      setTransactionId(result.transaction.id);
      setSelected(offer);
      setMessage("✓ Swap proposal created! Both artworks locked in escrow.");
    } catch (error: any) {
      setMessage(error.message || "Failed to create swap proposal.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function completeSwap() {
    if (!transactionId) {
      setMessage("Transaction ID not found.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await swapAPI.accept(transactionId);
      setMessage("✓ Swap completed! Artworks exchanged and funds released.");
      setStage(4);
    } catch (error: any) {
      setMessage(error.message || "Failed to complete swap.");
    } finally {
      setIsProcessing(false);
    }
  }

  const matching = useMemo(() => {
    const offers = [...OFFERS.filter((o) => o.category === myArt.category)].sort((a, b) => b.cash - a.cash);
    if (!requestedOfferId) return offers;
    return offers.sort((a, b) => {
      if (a.id === requestedOfferId) return -1;
      if (b.id === requestedOfferId) return 1;
      return 0;
    });
  }, [myArt.category, requestedOfferId]);
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
            Buyers post standing offers for collections. Match yours in one tap — no haggling.
          </p>
        </div>

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

            {top && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Top open offer
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
                  disabled={isProcessing}
                  className="w-full rounded-2xl bg-primary-grad py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
                >
                  {isProcessing ? "Creating swap..." : `Swap for ${fmt(top.cash)} →`}
                </button>
              </div>
            )}
          </div>
        </div>

        {matching.length > 1 && (
          <div>
            <div className="mb-2 text-xs font-semibold">All matching offers</div>
            <div className="space-y-2">
              {matching.slice(1).map((o) => (
                <button
                  key={o.id}
                  onClick={() => acceptStandingOffer(o)}
                  disabled={isProcessing}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card hover-lift disabled:opacity-50"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                    {o.buyerInitials}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-semibold">{o.buyer}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {o.buyerCity} · {o.placedAgo}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">{fmt(o.cash)}</div>
                    {o.offeredArt && <div className="text-[10px] text-muted-foreground">+ art</div>}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[11px] text-emerald-700">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> Funds and artworks locked in escrow the moment you
          accept. Exchanged when both parties confirm.
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
            {offer.buyerInitials}
          </div>
        </div>
        <div className="mt-3 font-display text-2xl font-semibold">{fmt(offer.cash)}</div>
        <div className="text-xs text-white/80">from {offer.buyer} · escrow locked</div>
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
