import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { AppFrame } from "@/components/AppFrame";
import { CheckoutModalDesktop } from "@/components/modals/CheckoutModalDesktop";
import { fmt } from "@/lib/art-data";
import { useAuth } from "@/contexts/AuthContext";
import { artAPI, purchaseAPI, type Art } from "@/lib/api";

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [art, setArt] = useState<Art | null>(null);
  const [method, setMethod] = useState("Bank");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    async function fetchArtwork() {
      try {
        setIsLoading(true);
        setArt(await artAPI.getById(id as string));
      } catch (error) {
        console.error("Failed to fetch checkout artwork:", error);
        setArt(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchArtwork();
  }, [id]);

  const fee = Math.round((art?.price || 0) * 0.02);
  const sellerId = art?.currentOwnerId || art?.current_owner_id || null;
  const isOwnArtwork = Boolean(user && sellerId === user.id);

  async function handleCheckout() {
    if (!user) {
      navigate("/profile");
      return;
    }
    if (!art || !sellerId || isOwnArtwork) {
      setMessage("Artwork is not available for purchase.");
      return;
    }

    setMessage("");
    setIsProcessing(true);
    try {
      await purchaseAPI.buy(user.id, art.id, art.price + fee, sellerId);
      setMessage("Purchase successful. Provenance receipt transferred to your collection.");
      setTimeout(() => navigate("/profile"), 1600);
    } catch (error: any) {
      setMessage(error.message || "Error processing payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) {
    return (
      <AppFrame label="Checkout">
        <div className="px-5 pt-8 pb-6 text-center text-sm text-muted-foreground">
          Loading checkout...
        </div>
      </AppFrame>
    );
  }

  if (!art || !sellerId || isOwnArtwork) {
    return (
      <AppFrame label="Checkout">
        <div className="space-y-4 px-5 pt-3 pb-6 text-center">
          <p className="text-sm text-muted-foreground">Artwork not available for purchase</p>
          <Link
            to="/buy"
            className="mt-4 inline-block rounded-2xl bg-primary-grad px-4 py-3 text-sm font-semibold text-white shadow-glow"
          >
            Back to Shop
          </Link>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      label="Checkout · Escrow"
      desktop={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
          <CheckoutModalDesktop
            open={true}
            onOpenChange={(open) => {
              if (!open) navigate("/explore");
            }}
            artId={art.id}
            onSuccess={() => navigate("/profile")}
          />
        </div>
      }
    >
      <div className="space-y-4 px-5 pt-3 pb-6">
        <div className="flex items-center gap-3">
          <Link
            to={`/art/${art.id}`}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-sm font-semibold">Checkout</div>
        </div>

        <div className="overflow-hidden rounded-2xl shadow-card">
          <img src={art.image} alt={art.name} width={600} height={200} className="h-32 w-full object-cover" />
        </div>

        <div className="rounded-2xl bg-muted/60 p-3 text-sm">
          {[
            ["Artwork price", fmt(art.price)],
            ["Platform fee (2%)", fmt(fee)],
            ["Escrow hold", fmt(art.price)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-1 text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span className="text-primary">{fmt(art.price + fee)}</span>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold">Payment method</div>
          <div className="grid grid-cols-3 gap-2">
            {["Bank", "Card", "Crypto"].map((item) => (
              <button
                key={item}
                onClick={() => setMethod(item)}
                className={`rounded-xl border px-2 py-2 text-xs transition ${
                  method === item
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
          <Lock className="mr-1 inline h-3.5 w-3.5" /> Provenance transfers instantly. Physical artwork is marked for shipping.
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
          className="w-full rounded-2xl bg-primary-grad py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
        >
          {isProcessing ? "Processing..." : `Confirm & pay ${fmt(art.price + fee)}`}
        </button>
      </div>
    </AppFrame>
  );
}
