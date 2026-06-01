import { Link, useParams, useNavigate } from "react-router-dom";
import { AppFrame } from "@/components/AppFrame";
import { getArt, fmt } from "@/lib/art-data";
import { ArrowLeft, Lock } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { purchaseArt } from "@/lib/db";

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateWalletBalance } = useAuth();
  const a = getArt(id!);
  const fee = Math.round(a.price * 0.02);
  const [method, setMethod] = useState("Bank");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const handleCheckout = async () => {
    if (!user) {
      navigate("/profile");
      return;
    }

    setMessage("");
    setIsProcessing(true);
    try {
      const result = purchaseArt(user.id, a.id, a.price + fee);
      if (result.success) {
        updateWalletBalance(user.walletBalance - (a.price + fee));
        setMessage("Purchase successful. Artwork added to your collection.");
        navigate("/profile");
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
    <AppFrame label="Checkout · Escrow">
      <div className="space-y-4 px-5 pt-3 pb-6">
        <div className="flex items-center gap-3">
          <Link
            to={`/art/${id}`}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-sm font-semibold">Checkout</div>
        </div>

        <div className="overflow-hidden rounded-2xl shadow-card">
          <img src={a.image} alt={a.name} width={600} height={200} className="h-32 w-full object-cover" />
        </div>

        <div className="rounded-2xl bg-muted/60 p-3 text-sm">
          {(
            [
              ["Artwork price", fmt(a.price)],
              ["Platform fee (2%)", fmt(fee)],
              ["Escrow hold", fmt(a.price)],
            ] as [string, string][]
          ).map(([k, v]) => (
            <div key={k} className="flex justify-between py-1 text-xs">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span className="text-primary">{fmt(a.price + fee)}</span>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold">Payment method</div>
          <div className="grid grid-cols-3 gap-2">
            {["Bank", "Card", "Crypto"].map((p) => (
              <button
                key={p}
                onClick={() => setMethod(p)}
                className={`rounded-xl border px-2 py-2 text-xs transition ${
                  method === p
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
          <Lock className="mr-1 inline h-3.5 w-3.5" /> Funds held in escrow until vault audit
          completes.
        </div>

        {message && (
          <div className="rounded-2xl bg-primary/10 p-3 text-xs font-semibold text-primary">
            {message}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={isProcessing}
          className="w-full rounded-2xl bg-primary-grad py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
        >
          {isProcessing ? "Processing..." : `Confirm & pay ${fmt(a.price + fee)}`}
        </button>
      </div>
    </AppFrame>
  );
}
