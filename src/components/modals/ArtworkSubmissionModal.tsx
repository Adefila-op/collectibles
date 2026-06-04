import { useCallback, useState } from "react";
import { X, Upload, CheckCircle } from "lucide-react";
import { submissionAPI } from "@/lib/api";

interface ArtworkSubmissionModalProps {
  isOpen: boolean;
  artworkId: string;
  artworkName: string;
  artistId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ArtworkSubmissionModal({
  isOpen,
  artworkId,
  artworkName,
  artistId,
  onClose,
  onSuccess,
}: ArtworkSubmissionModalProps) {
  const [step, setStep] = useState(0);
  const [description, setDescription] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [proofDocumentUrl, setProofDocumentUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = useCallback(async () => {
    if (!description.trim()) {
      setMessage("Please describe the artwork");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      await submissionAPI.submit(
        artistId,
        artworkId,
        proofImageUrl,
        proofDocumentUrl,
        description
      );

      setMessage("Artwork submitted for verification! Admin will review within 24-48 hours.");
      setStep(2);

      // Reset form
      setTimeout(() => {
        setDescription("");
        setProofImageUrl("");
        setProofDocumentUrl("");
        setStep(0);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error: any) {
      setMessage(error.message || "Error submitting artwork");
    } finally {
      setIsSubmitting(false);
    }
  }, [artworkId, artistId, description, proofImageUrl, proofDocumentUrl, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/20 backdrop-blur-sm">
      <div className="w-full animate-slide-up rounded-t-3xl bg-background p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Verify "{artworkName}"</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 0 && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Submit proof of authenticity for your artwork. The admin will review and issue an on-chain certificate.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold">Artwork Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the artwork, materials, creation date, and any unique details..."
                className="w-full rounded-2xl bg-muted px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold">Proof Image URL</label>
              <input
                type="url"
                value={proofImageUrl}
                onChange={(e) => setProofImageUrl(e.target.value)}
                placeholder="IPFS or image URL with proof"
                className="w-full rounded-2xl bg-muted px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[10px] text-muted-foreground">
                Photo of artwork with artist signature or proof of creation
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold">Document URL (optional)</label>
              <input
                type="url"
                value={proofDocumentUrl}
                onChange={(e) => setProofDocumentUrl(e.target.value)}
                placeholder="IPFS or document URL"
                className="w-full rounded-2xl bg-muted px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[10px] text-muted-foreground">
                Certificate of authenticity, receipt, or other documentation
              </p>
            </div>

            {message && (
              <div className="rounded-2xl bg-yellow-500/10 p-3 text-xs font-semibold text-yellow-700">
                {message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onClose}
                className="rounded-2xl bg-muted py-3 text-sm font-semibold text-foreground hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(1)}
                className="rounded-2xl bg-primary py-3 text-sm font-semibold text-white"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-primary/10 p-4 space-y-2">
              <div className="text-xs font-semibold">Review submission</div>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <div>
                  <span className="font-semibold">Description:</span> {description.slice(0, 100)}...
                </div>
                {proofImageUrl && (
                  <div>
                    <span className="font-semibold">Proof image:</span> Included
                  </div>
                )}
                {proofDocumentUrl && (
                  <div>
                    <span className="font-semibold">Document:</span> Included
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Once submitted, an admin will review your artwork and issue an on-chain certificate NFT if verified. This typically takes 24-48 hours.
            </p>

            {message && (
              <div className="rounded-2xl bg-red-500/10 p-3 text-xs font-semibold text-red-700">
                {message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStep(0)}
                className="rounded-2xl bg-muted py-3 text-sm font-semibold text-foreground hover:bg-muted/80"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-2xl bg-green-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit for Verification"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-5 space-y-4 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-500/20 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold">Submitted!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your artwork is now pending admin review. You'll receive a notification when the certificate NFT is ready.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
