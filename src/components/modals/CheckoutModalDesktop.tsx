import { useEffect, useState } from "react";
import { Lock, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmt } from "@/lib/art-data";
import { artAPI, purchaseAPI, type Art } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface CheckoutModalDesktopProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artId: string;
  onSuccess?: () => void;
}

export function CheckoutModalDesktop({ open, onOpenChange, artId, onSuccess }: CheckoutModalDesktopProps) {
  const { user } = useAuth();
  const [art, setArt] = useState<Art | null>(null);
  const [method, setMethod] = useState("Bank");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open || !artId) return;

    async function fetchArtwork() {
      try {
        setArt(await artAPI.getById(artId));
      } catch (error) {
        console.error("Failed to fetch checkout artwork:", error);
        setArt(null);
      }
    }

    fetchArtwork();
  }, [artId, open]);

  const fee = Math.round((art?.price || 0) * 0.02);
  const sellerId = art?.currentOwnerId || art?.current_owner_id;

  async function handleCheckout() {
    if (!user) {
      setMessage("Sign in to checkout.");
      return;
    }
    if (!art || !sellerId || sellerId === user.id) {
      setMessage("Artwork is not available for purchase.");
      return;
    }

    setMessage("");
    setIsProcessing(true);
    try {
      await purchaseAPI.buy(user.id, art.id, art.price + fee, sellerId);
      setMessage("Purchase successful. Provenance receipt transferred.");
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
        setMessage("");
      }, 1400);
    } catch (error: any) {
      setMessage(error.message || "Error processing payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-[500px] overflow-y-auto rounded-3xl border-0">
        <DialogHeader>
          <DialogTitle className="text-xl">Checkout</DialogTitle>
          <DialogDescription>Complete your purchase</DialogDescription>
        </DialogHeader>

        {!art ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading artwork...</div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl shadow-sm">
              <img src={art.image} alt={art.name} className="h-48 w-full object-cover" />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">{art.name}</div>
              <div className="text-xs text-muted-foreground">
                {art.artist} · {art.city}
              </div>
            </div>

            <div className="space-y-2 rounded-2xl bg-muted/60 p-4 text-sm">
              {[
                ["Artwork price", fmt(art.price)],
                ["Platform fee (2%)", fmt(fee)],
                ["Escrow hold", fmt(art.price)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span className="text-primary">{fmt(art.price + fee)}</span>
              </div>
            </div>

            <div>
              <div className="mb-3 text-xs font-semibold">Payment method</div>
              <div className="grid grid-cols-3 gap-2">
                {["Bank", "Card", "Crypto"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setMethod(item)}
                    className={`rounded-xl border px-3 py-2 text-xs transition ${
                      method === item
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
              <Lock className="mr-1 inline h-3.5 w-3.5" /> Provenance transfers instantly. Physical artwork is sent to the collector.
            </div>

            {message && (
              <div
                className={`rounded-2xl p-3 text-xs font-semibold ${
                  message.includes("successful") ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                }`}
              >
                {message}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-grad py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
            >
              <ShoppingCart className="h-4 w-4" />
              {isProcessing ? "Processing..." : `Confirm & pay ${fmt(art.price + fee)}`}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
