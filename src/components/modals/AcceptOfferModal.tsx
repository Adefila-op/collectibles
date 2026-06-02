import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getArt, fmt, type Art } from "@/lib/art-data";
import { acceptOffer, getHoldings, logAdminEvent } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { Check, AlertCircle, Loader2 } from "lucide-react";

export function AcceptOfferModal({
  open,
  onOpenChange,
  offerId,
  artId,
  offerAmount,
  offerBuyerName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: string;
  artId: string;
  offerAmount: number;
  offerBuyerName: string;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>();
  const [art, setArt] = useState<Art | null>(null);

  useEffect(() => {
    if (open) {
      const artwork = getArt(artId);
      setArt(artwork);
      setSuccess(false);
      setError(undefined);
    }
  }, [open, artId]);

  const handleAcceptOffer = async () => {
    if (!user) {
      setError("You must be logged in to accept an offer.");
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      // Check if user owns the artwork
      const holdings = getHoldings(user.id);
      const ownership = holdings.find((h) => h.artId === artId && h.status === "owned");
      
      if (!ownership) {
        setError("You don't own this artwork or it's not in your collection.");
        setLoading(false);
        return;
      }

      // Accept the offer
      const result = acceptOffer(offerId, user.id, artId);
      
      if (result.success) {
        // Log admin event
        logAdminEvent("offer_accepted", user.id, {
          offerId,
          artId,
          amount: offerAmount,
          buyer: offerBuyerName,
        });
        
        setSuccess(true);
        
        // Close modal after success
        setTimeout(() => {
          onOpenChange(false);
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || "Failed to accept offer. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Accept Offer</DialogTitle>
          <DialogDescription>
            Confirm accepting this offer for your artwork
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold">Offer Accepted!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your artwork has been sold and the funds are in escrow. The buyer will receive the piece after verification.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {art && (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 flex gap-3">
                  <img
                    src={art.image}
                    alt={art.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{art.name}</h4>
                    <p className="text-xs text-muted-foreground">{art.artist}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Offer from:</span>
                <span className="font-semibold">{offerBuyerName}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">Offer amount:</span>
                <span className="font-semibold text-lg">{fmt(offerAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">Platform fee (10%):</span>
                <span>-{fmt(offerAmount * 0.1)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="font-semibold">You receive:</span>
                <span className="font-bold text-green-600">{fmt(offerAmount * 0.9)}</span>
              </div>
            </div>

            {error && (
              <div className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Once you accept, the funds will be held in secure escrow. The buyer will have 7 days to confirm receipt of the artwork.
            </p>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 font-semibold transition hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptOffer}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Accepting..." : "Accept Offer"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
