import { useState } from "react";
import { getAllArtworks, fmt } from "@/lib/art-data";
import { useAuth } from "@/contexts/AuthContext";
import { getHoldings } from "@/lib/db";
import { ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionModal } from "./TransactionModal";

interface BuyArtModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuyArtModalDesktop({ open, onOpenChange }: BuyArtModalProps) {
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [selectedArt, setSelectedArt] = useState<{ id: string; name: string; price: number } | null>(null);
  const { user } = useAuth();

  const allArtworks = getAllArtworks();
  const allHoldings = getHoldings();
  const userHeldArtIds = new Set(
    user ? allHoldings.filter((h) => h.userId === user.id && h.status !== "swapped").map((h) => h.artId) : []
  );

  const availableForPurchase = allArtworks.filter((art) => {
    if (userHeldArtIds.has(art.id)) return false;
    const activeHolding = allHoldings.find((h) => h.artId === art.id && h.status !== "swapped");
    return !activeHolding || activeHolding.status === "listed";
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] rounded-3xl border-0 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Buy Art</DialogTitle>
          <DialogDescription>
            {availableForPurchase.length} artwork{availableForPurchase.length !== 1 ? "s" : ""} available for
            purchase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {availableForPurchase.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/60 p-6 text-center space-y-3">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">No art listed for sale</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  All available artworks have been purchased or listed
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {availableForPurchase.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelectedArt({ id: a.id, name: a.name, price: a.price });
                    setTransactionOpen(true);
                  }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card hover-lift text-left"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={a.image}
                      alt={a.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-2.5">
                    <div className="truncate text-xs font-semibold">{a.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {a.artist} · {a.city}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-primary">{fmt(a.price)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedArt && (
          <TransactionModal
            open={transactionOpen}
            onOpenChange={setTransactionOpen}
            artName={selectedArt.name}
            price={selectedArt.price}
            onConfirm={() => {
              setSelectedArt(null);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
