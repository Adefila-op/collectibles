import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmt } from "@/lib/art-data";
import { artAPI, offersAPI, type Art } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface OfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artId?: string;
}

export function OfferModal({ open, onOpenChange, artId }: OfferModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [targetArt, setTargetArt] = useState<Art | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !artId) return;

    async function fetchArt() {
      try {
        const artwork = await artAPI.getById(artId as string);
        setTargetArt(artwork);
        setOfferAmount(String(artwork.price || ""));
      } catch (error) {
        console.error("Failed to fetch offer artwork:", error);
        setTargetArt(null);
      }
    }

    fetchArt();
  }, [artId, open]);

  async function handlePlaceOffer() {
    if (!user || !targetArt) return;
    if (isSubmitting) return;

    const amount = parseInt(offerAmount.replace(/[^0-9]/g, ""));
    if (Number.isNaN(amount) || amount <= 0) {
      setMessage("Please enter a valid offer amount.");
      return;
    }

    if (amount > (user.walletBalance || 0)) {
      setMessage("Insufficient balance. Deposit more funds to place this offer.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    try {
      await offersAPI.create(user.id, targetArt.id, amount);
      setMessage(`Offer placed for ${fmt(amount)}. Funds are held in escrow.`);
      setTimeout(() => {
        onOpenChange(false);
        setMessage("");
      }, 1400);
    } catch (error: any) {
      setMessage(error.message || "Failed to place offer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[400px] rounded-3xl border-0">
          <DialogHeader>
            <DialogTitle>Make Offer</DialogTitle>
            <DialogDescription>Sign in to make offers on artwork</DialogDescription>
          </DialogHeader>
          <p className="text-center text-sm text-muted-foreground">Please sign in to make offers</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!targetArt || !artId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[400px] rounded-3xl border-0">
          <DialogHeader>
            <DialogTitle>Make Offer</DialogTitle>
            <DialogDescription>Select an artwork to make an offer</DialogDescription>
          </DialogHeader>
          <button
            onClick={() => {
              onOpenChange(false);
              navigate("/explore");
            }}
            className="mt-2 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white"
          >
            Browse artworks
          </button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-[500px] overflow-y-auto rounded-3xl border-0">
        <DialogHeader>
          <DialogTitle>Make an Offer</DialogTitle>
          <DialogDescription>Offer amount for {targetArt.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
            <div className="text-xs font-semibold text-muted-foreground">Offering for</div>
            <div className="flex gap-3">
              <img src={targetArt.image} alt={targetArt.name} className="h-20 w-20 rounded-xl object-cover" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{targetArt.name}</div>
                <div className="text-xs text-muted-foreground">
                  by {targetArt.artist} · {targetArt.city}
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
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Amount"
            />
          </div>

          {message && (
            <div
              className={`rounded-2xl p-3 text-sm ${
                message.includes("placed") ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handlePlaceOffer}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {isSubmitting ? "Placing..." : "Place Offer"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
