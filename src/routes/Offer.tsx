import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { AppFrame } from "@/components/AppFrame";
import { getAllArtworks, getArt, fmt } from "@/lib/art-data";
import { useAuth } from "@/contexts/AuthContext";
import { getHoldings, createOffer } from "@/lib/db";
import { ArrowLeft, Send } from "lucide-react";
import { useState } from "react";

export default function OfferPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetArtId = searchParams.get("artId");
  const targetArt = targetArtId ? getArt(targetArtId) : null;
  const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState("");

  const userHoldings = user ? getHoldings(user.id) : [];
  
  // Deduplicate artworks by artId
  const uniqueArtIds = new Set<string>();
  const allArtworks = getAllArtworks();
  const userArts = userHoldings
    .filter((h) => h.status === "owned")
    .filter((holding) => {
      if (uniqueArtIds.has(holding.artId)) return false;
      uniqueArtIds.add(holding.artId);
      return true;
    })
    .map((h) => ({
      ...h,
      artData: allArtworks.find((a) => a.id === h.artId),
    }))
    .filter((item) => item.artData);

  if (!user) {
    return (
      <AppFrame label="Make Offer">
        <div className="space-y-4 px-5 pt-3 pb-6 text-center">
          <p className="text-sm text-muted-foreground">Please sign in to make offers</p>
          <button
            onClick={() => navigate("/profile")}
            className="mt-4 rounded-2xl bg-primary-grad py-3 text-sm font-semibold text-white shadow-glow"
          >
            Sign In
          </button>
        </div>
      </AppFrame>
    );
  }

  if (!targetArt) {
    return (
      <AppFrame label="Make Offer">
        <div className="space-y-4 px-5 pt-3 pb-6 text-center">
          <p className="text-sm text-muted-foreground">Artwork not found</p>
          <Link
            to="/explore"
            className="mt-4 inline-block rounded-2xl bg-primary-grad py-3 px-4 text-sm font-semibold text-white shadow-glow"
          >
            Back to Explore
          </Link>
        </div>
      </AppFrame>
    );
  }

  const handlePlaceOffer = () => {
    if (!selectedHoldingId || !offerAmount || !targetArtId) {
      alert("Please select an artwork and enter an offer amount");
      return;
    }
    
    try {
      const amount = parseInt(offerAmount);
      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid offer amount");
        return;
      }
      
      // Create the offer in the database
      const offer = createOffer(targetArtId, user!.id, amount);
      
      alert(`Offer placed successfully! Offering ₦${amount.toLocaleString()} for ${targetArt.name}`);
      navigate("/explore");
    } catch (error) {
      console.error("Error placing offer:", error);
      alert("Error placing offer. Please try again.");
    }
  };

  return (
    <AppFrame label="Make Offer">
      <div className="space-y-4 px-5 pt-3 pb-6">
        {/* Back button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card hover:bg-muted transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-semibold">Make an Offer</div>
        </div>

        {/* Target artwork */}
        <div className="rounded-2xl border border-border bg-card p-3 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground">Offering for</div>
          <div className="flex gap-3">
            <img
              src={targetArt.image}
              alt={targetArt.name}
              className="h-20 w-20 rounded-xl object-cover"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold">{targetArt.name}</div>
              <div className="text-xs text-muted-foreground">
                by {targetArt.artist} · {targetArt.city}
              </div>
              <div className="text-xs text-primary font-semibold mt-1">{fmt(targetArt.price)}</div>
            </div>
          </div>
        </div>

        {/* Your collection */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Select from your collection</div>

          {userArts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/60 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                You don't have any art in your collection yet
              </p>
              <Link
                to="/explore"
                className="mt-3 inline-block text-xs text-primary font-semibold hover:underline"
              >
                Start collecting
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {userArts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedHoldingId(item.id)}
                  className={`flex gap-3 rounded-2xl border-2 p-3 cursor-pointer transition ${
                    selectedHoldingId === item.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <img
                    src={item.artData!.image}
                    alt={item.artData!.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{item.artData!.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.artData!.artist} · {item.artData!.city}
                    </div>
                    <div className="text-xs text-primary font-semibold mt-1">
                      {fmt(item.artData!.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Offer amount */}
        {userArts.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-semibold">Offer amount (₦)</label>
            <input
              type="number"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full rounded-2xl border border-border bg-muted/60 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
        )}

        {/* Action buttons */}
        {userArts.length > 0 && (
          <button
            onClick={handlePlaceOffer}
            disabled={!selectedHoldingId || !offerAmount}
            className="w-full rounded-2xl bg-primary-grad py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" /> Place Offer
          </button>
        )}
      </div>
    </AppFrame>
  );
}
