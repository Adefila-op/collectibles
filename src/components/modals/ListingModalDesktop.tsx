import { Camera, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { topOfferForCategory } from "@/lib/offers-data";
import { fmt } from "@/lib/art-data";
import { useAuth } from "@/contexts/AuthContext";
import { addHolding, updateHoldingStatus, addArtwork, fileToBase64 } from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ListingForm {
  title: string;
  category: string;
  collectionType: "1 of 1 (exclusive)" | "Larger collection";
  supply: string;
  year: string;
  dimensions: string;
  price: string;
  location: string;
  acceptSwaps: boolean;
}

interface ListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListingModalDesktop({ open, onOpenChange }: ListingModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [imageData, setImageData] = useState<string>("");
  const [form, setForm] = useState<ListingForm>({
    title: "",
    category: "Painting",
    collectionType: "1 of 1 (exclusive)",
    supply: "",
    year: new Date().getFullYear().toString(),
    dimensions: "",
    price: "",
    location: "Lagos, Nigeria",
    acceptSwaps: true,
  });
  const [message, setMessage] = useState("");
  const topOffer = topOfferForCategory("Painting");

  if (!user || user.artistStatus !== "approved") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[400px] rounded-3xl border-0">
          <DialogHeader>
            <DialogTitle>Artist approval required</DialogTitle>
            <DialogDescription>
              Every account starts as a collector. Apply from your profile to unlock artwork uploads.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                navigate("/profile");
              }}
              className="w-full rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go to profile
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleInputChange = (field: keyof ListingForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const base64 = await fileToBase64(files[0]);
        setImageData(base64);
        setMessage("Image uploaded successfully!");
        setTimeout(() => setMessage(""), 2000);
      } catch (error) {
        console.error("Error uploading image:", error);
        setMessage("Error uploading image. Please try again.");
      }
    }
  };

  const handlePublish = async () => {
    if (!user) {
      setMessage("Please sign in to list artwork");
      return;
    }

    try {
      if (!form.title.trim()) {
        setMessage("Please enter a title");
        return;
      }

      const priceNum = parseInt(form.price.replace(/[^0-9]/g, ""));
      if (isNaN(priceNum) || priceNum <= 0) {
        setMessage("Please enter a valid price");
        return;
      }

      const yearNum = parseInt(form.year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
        setMessage("Please enter a valid year");
        return;
      }

      const city = form.location.split(",")[0].trim();
      if (!city) {
        setMessage("Please enter a valid location");
        return;
      }

      if (form.collectionType === "Larger collection") {
        const supplyNum = parseInt(form.supply.replace(/[^0-9]/g, ""));
        if (isNaN(supplyNum) || supplyNum < 2) {
          setMessage("Please enter a supply of 2 or more");
          return;
        }
      }

      const artwork = addArtwork(
        form.title,
        user.name,
        city,
        yearNum,
        form.category,
        priceNum,
        imageData || "",
        user.id,
        form.collectionType,
        form.collectionType === "Larger collection" ? `${form.supply} supply` : "1"
      );

      const holding = addHolding(user.id, artwork.id, "listed");
      updateHoldingStatus(holding.id, "listed", priceNum);

      setMessage("Artwork published successfully!");
      setTimeout(() => {
        onOpenChange(false);
        setStep(0);
        setForm({
          title: "",
          category: "Painting",
          collectionType: "1 of 1 (exclusive)",
          supply: "",
          year: new Date().getFullYear().toString(),
          dimensions: "",
          price: "",
          location: "Lagos, Nigeria",
          acceptSwaps: true,
        });
        setImageData("");
      }, 1500);
    } catch (error) {
      console.error("Error publishing artwork:", error);
      setMessage("Error publishing artwork. Please try again.");
    }
  };

  const canGoNext = step === 0 ? form.title && form.category && imageData : form.price && parseInt(form.price.replace(/[^0-9]/g, "")) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] rounded-3xl border-0 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List your artwork</DialogTitle>
          <DialogDescription>
            {step === 0 ? "Upload photos and details" : "Set your price"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1.5 mb-6">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-8 bg-primary-grad" : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="space-y-3">
          {step === 0 && (
            <>
              <button
                onClick={() => document.getElementById("file-upload")?.click()}
                className="flex w-full flex-col items-center gap-1 rounded-2xl border border-dashed border-primary/40 bg-primary/5 py-6 hover:bg-primary/10 transition"
              >
                <Camera className="h-6 w-6 text-primary" />
                <div className="text-sm font-medium">Upload artwork photo</div>
                <div className="text-[10px] text-muted-foreground">PNG, JPG up to 10MB</div>
              </button>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {imageData && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
                  <div className="text-sm font-semibold text-emerald-700">✓ Image uploaded</div>
                </div>
              )}

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Artwork title"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {["Painting", "Sculpture", "Textile", "Beadwork", "Photo"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Year</label>
                  <input
                    value={form.year}
                    onChange={(e) => handleInputChange("year", e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Dimensions</label>
                  <input
                    value={form.dimensions}
                    onChange={(e) => handleInputChange("dimensions", e.target.value)}
                    placeholder="e.g. 60 × 80"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              {topOffer && (
                <button
                  className="block w-full rounded-2xl bg-primary-grad p-[1px] shadow-glow hover:shadow-glow/80 transition text-left"
                >
                  <div className="rounded-[calc(1rem-1px)] bg-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        <Zap className="h-3 w-3" /> Top offer
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] text-primary">
                        {topOffer.id}
                      </span>
                    </div>
                    <div className="mt-1 flex items-end justify-between">
                      <div>
                        <div className="font-display text-2xl font-semibold text-gradient">
                          {fmt(topOffer.cash)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {topOffer.buyer} · {topOffer.placedAgo}
                        </div>
                      </div>
                      <span className="rounded-xl bg-primary-grad px-3 py-1.5 text-[11px] font-semibold text-white">
                        Recommended
                      </span>
                    </div>
                  </div>
                </button>
              )}

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Set your price (₦)</label>
                <input
                  value={form.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  inputMode="numeric"
                  placeholder="e.g. 480,000"
                  className="w-full rounded-xl border-2 border-primary bg-primary/5 px-3 py-2.5 text-sm font-semibold text-primary outline-none"
                />
              </div>

              <div className="rounded-2xl border border-border bg-card p-3 text-left">
                <button
                  onClick={() => handleInputChange("acceptSwaps", !form.acceptSwaps)}
                  className="flex w-full items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold">Accept swap offers</div>
                    <div className="text-[10px] text-muted-foreground">Users can propose artworks</div>
                  </div>
                  <div
                    className={`relative h-6 w-11 rounded-full transition flex-shrink-0 ${
                      form.acceptSwaps ? "bg-primary-grad" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        form.acceptSwaps ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </div>
                </button>
              </div>
            </>
          )}

          {message && (
            <div
              className={`rounded-2xl p-3 text-xs font-semibold ${
                message.includes("successfully") || message.includes("uploaded")
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-red-500/10 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {step === 1 && (
              <button
                onClick={() => setStep(0)}
                className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-muted"
              >
                Back
              </button>
            )}

            {step === 0 ? (
              <button
                onClick={() => setStep(1)}
                disabled={!canGoNext}
                className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!canGoNext}
                  className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Publish
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
