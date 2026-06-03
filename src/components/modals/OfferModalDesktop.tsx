import { useEffect, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fmt } from "@/lib/art-data";
import { artAPI, offersAPI, type Art } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface OfferModalDesktopProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artId?: string;
  onTopUpClick?: () => void;
}

export function OfferModalDesktop({ open, onOpenChange, artId, onTopUpClick }: OfferModalDesktopProps) {
  const { user } = useAuth();
  const [targetArt, setTargetArt] = useState<Art | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !artId) return;

    async function fetchArt() {
      try {
        setIsLoading(true);
        const artwork = await artAPI.getById(artId as string);
        setTargetArt(artwork);
        setOfferAmount(String(artwork.price || ""));
      } catch (error) {
        console.error("Failed to fetch offer artwork:", error);
        setTargetArt(null);
      } finally {
        setIsLoading(false);
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
      if (onTopUpClick) onTopUpClick();
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
        setOfferAmount("");
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
        <DialogContent className="max-w-[500px] rounded-3xl border-0">
          <DialogHeader>
            <DialogTitle className="text-xl">Make Offer</DialogTitle>
            <DialogDescription>Sign in to make offers on artwork</DialogDescription>
          </DialogHeader>
          <p className="text-center text-sm text-muted-foreground mt-4">Please sign in to make offers</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[500px] rounded-3xl border-0">
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading artwork details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!targetArt || !artId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[500px] rounded-3xl border-0">
          <DialogHeader>
            <DialogTitle className="text-xl">Make Offer</DialogTitle>
            <DialogDescription>Select an artwork to make an offer</DialogDescription>
          </DialogHeader>
          <p className="text-center text-sm text-muted-foreground mt-4">Select an artwork to make an offer</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] rounded-3xl border-0">
        <DialogHeader>
          <DialogTitle className="text-xl">Make Offer</DialogTitle>
          <DialogDescription>Place your bid on this artwork</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Artwork Info */}
          <div className="flex gap-3 rounded-2xl bg-muted/60 p-3">
            <img
              src={targetArt.image}
              alt={targetArt.name}
              className="h-20 w-20 rounded-xl object-cover"
            />
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-semibold truncate">{targetArt.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {targetArt.artist} · {targetArt.city}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Listed price:</div>
              <div className="text-sm font-semibold text-primary">{fmt(targetArt.price)}</div>
            </div>
          </div>

          {/* Offer Amount */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Your offer amount</label>
            <div className="relative">
              <input
                type="text"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Enter amount in Naira"
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                ₦
              </span>
            </div>
          </div>

          {/* Balance Info */}
          <div className="text-xs text-muted-foreground rounded-lg bg-muted/40 p-3">
            Your balance: <span className="font-semibold text-foreground">{fmt(user.walletBalance || 0)}</span>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-2xl px-3 py-2 text-sm ${
                message.includes("Offer placed")
                  ? "bg-green-500/10 text-green-700"
                  : message.includes("Insufficient")
                  ? "bg-red-500/10 text-red-700"
                  : "bg-amber-500/10 text-amber-700"
              }`}
            >
              {message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePlaceOffer}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Placing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Place Offer
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
