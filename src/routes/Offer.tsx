import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppFrame } from "@/components/AppFrame";
import { getArt, fmt } from "@/lib/art-data";
import { useAuth } from "@/contexts/AuthContext";
import { createOffer } from "@/lib/db";
import { ArrowLeft, Send } from "lucide-react";
import { useState } from "react";

export default function OfferPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetArtId = searchParams.get("artId");
  const targetArt = targetArtId ? getArt(targetArtId) : null;
  const [offerAmount, setOfferAmount] = useState(targetArt ? String(targetArt.price) : "");
  const [message, setMessage] = useState("");

  if (!user) {
    return (
      <AppFrame label="Make Offer">
        <div className="space-y-4 px-5 pt-3 pb-6 text-center">
          <p className="text-sm text-muted-foreground">Please sign in to make offers</p>
          <button
            onClick={() => navigate("/profile")}
            className="mt-4 rounded-2xl bg-primary-grad px-5 py-3 text-sm font-semibold text-white shadow-glow"
          >
            Sign In
          </button>
        </div>
      </AppFrame>
    );
  }

  if (!targetArt || !targetArtId) {
    return (
      <AppFrame label="Make Offer">
        <div className="space-y-4 px-5 pt-3 pb-6 text-center">
          <p className="text-sm text-muted-foreground">Artwork not found</p>
          <Link
            to="/explore"
            className="mt-4 inline-block rounded-2xl bg-primary-grad px-4 py-3 text-sm font-semibold text-white shadow-glow"
          >
            Back to Explore
          </Link>
        </div>
      </AppFrame>
    );
  }

  function handlePlaceOffer() {
    if (!user || !targetArt || !targetArtId) return;

    const amount = parseInt(offerAmount.replace(/[^0-9]/g, ""));
    if (Number.isNaN(amount) || amount <= 0) {
      setMessage("Please enter a valid offer amount.");
      return;
    }

    if (amount > (user.walletBalance as number)) {
      setMessage("Deposit more funds before placing an offer this large.");
      return;
    }

    createOffer(targetArtId, user.id, amount);
    setMessage(`Offer placed for ${fmt(amount)} on ${targetArt.name}.`);
    navigate("/explore");
  }

  return (
    <AppFrame label="Make Offer">
      <div className="space-y-4 px-5 pt-3 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card transition hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-semibold">Make an Offer</div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
          <div className="text-xs font-semibold text-muted-foreground">Offering for</div>
          <div className="flex gap-3">
            <img src={targetArt.image} alt={targetArt.name} className="h-20 w-20 rounded-xl object-cover" />
            <div className="flex-1">
              <div className="text-sm font-semibold">{targetArt.name}</div>
              <div className="text-xs text-muted-foreground">
                by {targetArt.artist} - {targetArt.city}
              </div>
              <div className="mt-1 text-xs font-semibold text-primary">{fmt(targetArt.price)}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Offer amount</label>
          <input
            type="number"
            value={offerAmount}
            onChange={(event) => {
              setOfferAmount(event.target.value);
              setMessage("");
            }}
            placeholder="Enter amount"
            className="w-full rounded-2xl border border-border bg-muted/60 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
          <div className="text-xs text-muted-foreground">Available balance: {fmt(user.walletBalance as number)}</div>
        </div>

        {message && (
          <div className="rounded-2xl bg-primary/10 p-3 text-xs font-semibold text-primary">
            {message}
          </div>
        )}

        <button
          onClick={handlePlaceOffer}
          disabled={!offerAmount}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-grad py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> Place Offer
        </button>
      </div>
    </AppFrame>
  );
}
