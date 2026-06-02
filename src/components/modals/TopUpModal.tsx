import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fmt } from "@/lib/art-data";
import { CreditCard, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredAmount?: number;
}

export function TopUpModal({ open, onOpenChange, requiredAmount = 0 }: TopUpModalProps) {
  const { user, updateWalletBalance } = useAuth();
  const [topUpAmount, setTopUpAmount] = useState(requiredAmount > 0 ? String(requiredAmount) : "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const handleTopUp = async () => {
    if (!user) return;

    const amount = parseInt(topUpAmount.replace(/[^0-9]/g, ""));
    if (Number.isNaN(amount) || amount <= 0) {
      setMessage("Please enter a valid amount.");
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const newBalance = user.walletBalance + amount;
      const result = updateWalletBalance(newBalance);
      
      if (!result.ok) {
        setMessage(result.error);
        setIsProcessing(false);
        return;
      }

      setMessage("Top-up successful!");
      setTimeout(() => {
        onOpenChange(false);
        setMessage("");
        setTopUpAmount(requiredAmount > 0 ? String(requiredAmount) : "");
        setIsProcessing(false);
      }, 1200);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[450px] rounded-3xl border-0">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Funds</DialogTitle>
          <DialogDescription>Top up your wallet to continue</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {user && (
            <div className="space-y-3 rounded-2xl bg-muted/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Current balance</span>
                <span className="text-lg font-bold text-primary">{fmt(user.walletBalance)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold">Top-up amount</label>
            <div className="relative">
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => {
                  setTopUpAmount(e.target.value);
                  setMessage("");
                }}
                placeholder="Amount in USDC"
                disabled={isProcessing}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
            </div>
          </div>

          {message && (
            <div
              className={`rounded-2xl p-3 text-sm ${
                message.includes("successful")
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-red-500/10 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleTopUp}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" /> Add Funds
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
