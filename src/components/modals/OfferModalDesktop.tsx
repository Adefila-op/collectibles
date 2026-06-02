import { useNavigate } from "react-router-dom";
import { getArt, fmt } from "@/lib/art-data";
import { useAuth } from "@/contexts/AuthContext";
import { createOffer } from "@/lib/db";
import { Send } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artId?: string;
  onTopUpClick?: () => void;
}

export function OfferModalDesktop({ open, onOpenChange, artId, onTopUpClick }: OfferModalProps) {
  const navigate = useNavigate();
  const { user, updateWalletBalance } = useAuth();
  const targetArt = artId ? getArt(artId) : null;
  const [offerAmount, setOfferAmount] = useState(targetArt ? String(targetArt.price) : "");
  const [message, setMessage] = useState("");
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[400px] rounded-3xl border-0">
          <DialogHeader>
            <DialogTitle>Make Offer</DialogTitle>
            <DialogDescription>Sign in to make offers on artwork</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center">Please sign in to make offers</p>
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
            type="button"
            onClick={() => {
              onOpenChange(false);
              navigate("/explore");
            }}
            className="mt-2 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Browse artworks
          </button>
        </DialogContent>
      </Dialog>
    );
  }

  async function handlePlaceOffer() {
    if (!user || !targetArt || !artId) return;

    const amount = parseInt(offerAmount.replace(/[^0-9]/g, ""));
    if (Number.isNaN(amount) || amount <= 0) {
      setMessage("Please enter a valid offer amount.");
      return;
    }

    if (amount > (user.walletBalance as number)) {
      setShowInsufficientBalance(true);
      return;
    }

    // Create the offer
    createOffer(artId, user.id, amount);
    
    // Deduct from wallet balance
    const remainingBalance = (user.walletBalance || 0) - amount;
    const result = await updateWalletBalance(remainingBalance);
    
    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setMessage(`Offer placed for ${fmt(amount)} on ${targetArt.name}.`);
    setTimeout(() => {
      onOpenChange(false);
      setMessage("");
      setOfferAmount(String(targetArt.price));
    }, 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] rounded-3xl border-0 max-h-[80vh] overflow-y-auto">
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
                  by {targetArt.artist} - {targetArt.city}
                </div>
                <div className="mt-1 text-xs font-semibold text-primary">{fmt(targetArt.price)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Offer amount</label>
            <div className="relative">
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => {
                  setOfferAmount(e.target.value);
                  setMessage("");
                }}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Amount in USDC"
              />
            </div>
          </div>

          {showInsufficientBalance ? (
            <div className="rounded-2xl bg-red-500/10 p-4 text-sm space-y-3">
              <div className="text-red-700 font-semibold">
                Insufficient Balance
              </div>
              <div className="text-red-600 text-xs">
                You need {fmt(parseInt(offerAmount.replace(/[^0-9]/g, "") || "0") - (user.walletBalance as number))} more to place this offer.
              </div>
              <button
                onClick={() => {
                  onTopUpClick?.();
                  setShowInsufficientBalance(false);
                }}
                className="w-full rounded-2xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary/90"
              >
                Top Up Wallet
              </button>
            </div>
          ) : message ? (
            <div
              className={`rounded-2xl p-3 text-sm ${
                message.includes("Offer placed")
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-red-500/10 text-red-700"
              }`}
            >
              {message}
            </div>
          ) : null}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handlePlaceOffer}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              <Send className="h-4 w-4" /> Place Offer
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
