import { useState } from "react";
import { AlertCircle, Check, Loader2, Wallet } from "lucide-react";
import { fmt } from "@/lib/art-data";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artName: string;
  price: number;
  onConfirm?: () => void;
  onTopUpClick?: () => void;
}

type TransactionStep = "payment" | "processing" | "success" | "error";

export function TransactionModal({
  open,
  onOpenChange,
  artName,
  price,
  onConfirm,
  onTopUpClick,
}: TransactionModalProps) {
  const { user, updateWalletBalance } = useAuth();
  const [step, setStep] = useState<TransactionStep>("payment");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const walletBalance = user?.walletBalance ?? 0;
  const remainingBalance = walletBalance - price;

  const resetAndClose = () => {
    setStep("payment");
    setMessage("");
    setIsProcessing(false);
    onOpenChange(false);
  };

  const handlePayment = async () => {
    if (!user) {
      setMessage("Sign in to use your in-wallet balance.");
      setStep("error");
      return;
    }

    if (walletBalance < price) {
      setMessage(`Top up your wallet with at least ${fmt(price - walletBalance)} more to complete this purchase.`);
      setStep("error");
      return;
    }

    setIsProcessing(true);
    setStep("processing");

    setTimeout(() => {
      const result = updateWalletBalance(remainingBalance);
      setIsProcessing(false);

      if (!result.ok) {
        setMessage(result.error);
        setStep("error");
        return;
      }

      setStep("success");
      setTimeout(() => {
        resetAndClose();
        onConfirm?.();
      }, 1200);
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : resetAndClose())}>
      <DialogContent className="max-w-[450px] rounded-3xl border-0">
        {step === "payment" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Complete Purchase</DialogTitle>
              <DialogDescription>Pay from your COllectible in-wallet balance.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="space-y-3 rounded-2xl bg-muted/60 p-4">
                <div>
                  <div className="text-sm text-muted-foreground">Artwork</div>
                  <div className="text-lg font-semibold text-foreground">{artName}</div>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total price</span>
                    <span className="text-lg font-bold text-primary">{fmt(price)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Wallet balance</span>
                    <span className="text-sm font-bold">{fmt(walletBalance)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">After purchase</span>
                    <span className={`text-sm font-bold ${remainingBalance < 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {remainingBalance < 0 ? `-${fmt(Math.abs(remainingBalance))}` : fmt(remainingBalance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" onClick={resetAndClose} className="h-10 rounded-lg">
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-white hover:bg-primary/90"
                >
                  <Wallet className="h-4 w-4" />
                  Pay Wallet
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div>
              <h3 className="text-center text-lg font-semibold text-foreground">Processing Wallet Payment</h3>
              <p className="mt-1 text-center text-sm text-muted-foreground">Please wait while we settle your purchase.</p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-center text-lg font-semibold text-foreground">Purchase Successful</h3>
              <p className="mt-1 text-center text-sm text-muted-foreground">Your in-wallet balance has been updated.</p>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-center text-lg font-semibold text-foreground">
                {message.includes("Top up") ? "Insufficient Balance" : "Payment Needs Attention"}
              </h3>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                {message || "Please check your wallet balance and try again."}
              </p>
            </div>
            <div className="flex gap-2 mt-4 w-full">
              {message.includes("Top up") ? (
                <>
                  <Button onClick={() => setStep("payment")} className="flex-1 h-10 rounded-lg bg-card border border-border text-foreground hover:bg-muted">
                    Back
                  </Button>
                  <Button 
                    onClick={() => {
                      onTopUpClick?.();
                      resetAndClose();
                    }} 
                    className="flex-1 h-10 rounded-lg bg-primary text-white hover:bg-primary/90"
                  >
                    Top Up
                  </Button>
                </>
              ) : (
                <Button onClick={() => setStep("payment")} className="w-full h-10 rounded-lg bg-primary text-white hover:bg-primary/90">
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
