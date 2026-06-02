import { useState } from "react";
import { getArt, fmt } from "@/lib/art-data";
import { useAuth } from "@/contexts/AuthContext";
import { purchaseArt } from "@/lib/db";
import { Lock, ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CheckoutModalDesktopProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artId: string;
  onSuccess?: () => void;
}

export function CheckoutModalDesktop({
  open,
  onOpenChange,
  artId,
  onSuccess,
}: CheckoutModalDesktopProps) {
  const { user, updateWalletBalance } = useAuth();
  const art = getArt(artId);
  const fee = Math.round(art.price * 0.02);
  const [method, setMethod] = useState("Bank");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const handleCheckout = async () => {
    if (!user) {
      setMessage("Sign in to checkout");
      return;
    }

    setMessage("");
    setIsProcessing(true);
    try {
      const result = purchaseArt(user.id, art.id, art.price + fee);
      if (result.success) {
        updateWalletBalance(user.wallet_balance - (art.price + fee));
        setMessage("Purchase successful!");
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
          setMessage("");
        }, 1500);
      } else {
        setMessage(result.error);
      }
    } catch (error) {
      setMessage("Error processing payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] rounded-3xl border-0 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Checkout</DialogTitle>
          <DialogDescription>Complete your purchase</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Artwork Preview */}
          <div className="overflow-hidden rounded-2xl shadow-sm">
            <img
              src={art.image}
              alt={art.name}
              className="h-48 w-full object-cover"
            />
          </div>

          {/* Artwork Info */}
          <div className="space-y-2">
            <div className="text-sm font-semibold">{art.name}</div>
            <div className="text-xs text-muted-foreground">{art.artist} · {art.city}</div>
          </div>

          {/* Pricing Breakdown */}
          <div className="rounded-2xl bg-muted/60 p-4 text-sm space-y-2">
            {(
              [
                ["Artwork price", fmt(art.price)],
                ["Platform fee (2%)", fmt(fee)],
                ["Escrow hold", fmt(art.price)],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{fmt(art.price + fee)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <div className="mb-3 text-xs font-semibold">Payment method</div>
            <div className="grid grid-cols-3 gap-2">
              {["Bank", "Card", "Crypto"].map((p) => (
                <button
                  key={p}
                  onClick={() => setMethod(p)}
                  className={`rounded-xl border px-3 py-2 text-xs transition ${
                    method === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Escrow Info */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
            <Lock className="mr-1 inline h-3.5 w-3.5" /> Funds held in escrow until
            vault audit completes.
          </div>

          {/* Message */}
          {message && (
            <div className={`rounded-2xl p-3 text-xs font-semibold ${
              message.includes("successful")
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-primary/10 text-primary"
            }`}>
              {message}
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full rounded-2xl bg-primary-grad py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {isProcessing ? "Processing..." : `Confirm & pay ${fmt(art.price + fee)}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
