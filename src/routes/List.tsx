import { Link, useNavigate, useParams } from "react-router-dom";
import { AppFrame } from "@/components/AppFrame";
import { Camera, Sparkles, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { topOfferForCategory } from "@/lib/offers-data";
import { fmt, getArt } from "@/lib/art-data";
import { useAuth } from "@/contexts/AuthContext";
import { artAPI } from "@/lib/api";
import { holdingsAPI } from "@/lib/api-transactions";

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

export default function ListArt() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { artId } = useParams<{ artId: string }>();
  
  // IMPORTANT: All hooks must be called unconditionally, before any early returns
  // Initialize all state hooks first to maintain consistent hook order
  const [step, setStep] = useState(0);
  const [imageData, setImageData] = useState<string>("");
  const [listPrice, setListPrice] = useState<string>("");
  const [acceptSwaps, setAcceptSwaps] = useState(true);
  const [proof, setProof] = useState(true);
  const [form, setForm] = useState<ListingForm>({
    title: "Harmattan Haze",
    category: "Painting",
    collectionType: "1 of 1 (exclusive)",
    supply: "",
    year: "2023",
    dimensions: "60 × 80",
    price: "480,000",
    location: "Lagos, Nigeria",
    acceptSwaps: true,
  });
  
  // Check if this is a reselling flow (artId provided) or new creation
  const isReselling = !!artId;
  const resellArt = artId ? getArt(artId) : null;
  const userHoldings = user ? getHoldings(user.id) : [];
  const ownedArtwork = resellArt && userHoldings.find(h => h.artId === resellArt.id && h.status === "owned");
  
  // Update form with resell artwork data if applicable
  useEffect(() => {
    if (resellArt) {
      setForm(prev => ({
        ...prev,
        title: resellArt.name,
        category: resellArt.category,
        year: resellArt.year.toString(),
        price: resellArt.price.toString(),
        location: resellArt.city + ", Nigeria",
      }));
      setListPrice(resellArt.price.toString());
    }
  }, [resellArt]);
  
  // Only require artist status for creating NEW artworks
  // Allow collectors to resell verified artworks without artist status
  if (!user) {
    return (
      <AppFrame label="Please sign in">
        <div className="px-5 pt-6 pb-6">
          <div className="rounded-3xl bg-card p-5 text-center shadow-card">
            <div className="text-4xl mb-3">🔐</div>
            <h2 className="font-display text-lg font-semibold">Sign in required</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your account to {isReselling ? "resell" : "list"} artwork.
            </p>
            <Link
              to="/profile"
              className="mt-5 inline-flex rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </AppFrame>
    );
  }

  // If reselling, must own the artwork
  if (isReselling && !ownedArtwork) {
    return (
      <AppFrame label="Artwork not found">
        <div className="px-5 pt-6 pb-6">
          <div className="rounded-3xl bg-card p-5 text-center shadow-card">
            <div className="text-4xl mb-3">❌</div>
            <h2 className="font-display text-lg font-semibold">Can't resell this artwork</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You don't own this verified artwork.
            </p>
            <Link
              to="/profile"
              className="mt-5 inline-flex rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Back to collection
            </Link>
          </div>
        </div>
      </AppFrame>
    );
  }

  // Only require artist status for creating NEW artworks
  if (!isReselling && user.artist_status !== "approved") {
    return (
      <AppFrame label="Artist approval required">
        <div className="px-5 pt-6 pb-6">
          <div className="rounded-3xl bg-card p-5 text-center shadow-card">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold">Artist approval required</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              To create new original artwork, you need artist approval. Your account starts as a collector. Apply from your profile to unlock artwork creation.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              💡 You can resell verified artworks from your collection without needing artist approval.
            </p>
            <Link
              to="/profile"
              className="mt-5 inline-flex rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go to profile
            </Link>
          </div>
        </div>
      </AppFrame>
    );
  }
  
  const topOffer = topOfferForCategory(form.category);

  const handleInputChange = (field: keyof ListingForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImageData(e.target.result as string);
            alert("Image uploaded successfully!");
          }
        };
        reader.readAsDataURL(files[0]);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image. Please try again.");
      }
    }
  };

  const handlePublish = async () => {
    if (!user) {
      alert("Please sign in to list artwork");
      navigate("/profile");
      return;
    }

    try {
      // Parse price from form (handles formatted numbers like "480,000")
      const priceNum = parseInt(form.price.replace(/[^0-9]/g, ""));
      if (isNaN(priceNum) || priceNum <= 0) {
        alert("Please enter a valid price");
        return;
      }
      
      // Handle reselling existing artwork
      if (isReselling && resellArt && ownedArtwork) {
        // For reselling, just update the price and mark as listed
        updateHoldingStatus(ownedArtwork.id, "listed", priceNum);
        alert("Artwork listed for resale successfully!");
        navigate("/profile");
        return;
      }
      
      // For creating new artwork - require image and additional fields
      if (!imageData) {
        alert("Please upload an image for your artwork");
        return;
      }
      
      // Extract year from form
      const yearNum = parseInt(form.year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
        alert("Please enter a valid year");
        return;
      }
      
      // Extract city from location (e.g., "Lagos, Nigeria" -> "Lagos")
      const city = form.location.split(",")[0].trim();
      if (!city) {
        alert("Please enter a valid location");
        return;
      }

      if (form.collectionType === "Larger collection") {
        const supplyNum = parseInt(form.supply.replace(/[^0-9]/g, ""));
        if (isNaN(supplyNum) || supplyNum < 2) {
          alert("Please enter a supply of 2 or more for a larger collection");
          return;
        }
      }
      
      // Call API to create artwork + holding
      const response = await artAPI.create({
        userId: user.id,
        name: form.title,
        artist: user.name,
        category: form.category,
        city: city,
        year: yearNum,
        price: priceNum,
        image: imageData,
        description: form.collectionType === "Larger collection" ? `${form.supply} supply` : "1",
        collectionType: form.collectionType,
        supplyName: form.collectionType === "Larger collection" ? form.supply : "1",
        listImmediately: true,
      });
      
      // Show success message
      alert("Artwork published successfully!");
      navigate("/profile");
    } catch (error: any) {
      console.error("Error publishing artwork:", error);
      alert(error.message || "Error publishing artwork. Please try again.");
    }
  };

  return (
    <AppFrame label="List · 3 steps">
      <div className="space-y-4 px-5 pt-3 pb-6">
        <div>
          <h2 className="font-display text-xl font-semibold">List your artwork</h2>
          <p className="text-xs text-muted-foreground">Mint onchain · buyer pays into escrow.</p>
        </div>

        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-8 bg-primary-grad" : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3 animate-fade-up">
            <button 
              onClick={() => document.getElementById("file-upload")?.click()}
              className="flex w-full flex-col items-center gap-1 rounded-2xl border border-dashed border-primary/40 bg-primary/5 py-6 hover:bg-primary/10 transition"
            >
              <Camera className="h-6 w-6 text-primary" />
              <div className="text-sm font-medium">Upload artwork photos</div>
              <div className="text-[10px] text-muted-foreground">Front, back &amp; detail shots</div>
            </button>
            <input 
              id="file-upload" 
              type="file" 
              multiple 
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {imageData && (
              <div className="rounded-2xl bg-green-50 border border-green-200 p-3">
                <div className="text-sm font-semibold text-green-700">✓ Image uploaded</div>
                <div className="text-xs text-green-600">Your artwork image is ready</div>
              </div>
            )}
            {[
              ["Title", "title", form.title],
              ["Category", "category", form.category],
              ["Year", "year", form.year],
              ["Dimensions (cm)", "dimensions", form.dimensions],
            ].map(([l, key, value]) => (
              <div key={l}>
                <div className="mb-1 text-[11px] text-muted-foreground">{l}</div>
                <input
                  value={value}
                  onChange={(e) => handleInputChange(key as keyof ListingForm, e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
            <div>
              <div className="mb-1 text-[11px] text-muted-foreground">Collection type</div>
              <select
                value={form.collectionType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    collectionType: e.target.value as ListingForm["collectionType"],
                    supply: e.target.value === "1 of 1 (exclusive)" ? "" : prev.supply,
                  }))
                }
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option>1 of 1 (exclusive)</option>
                <option>Larger collection</option>
              </select>
            </div>
            {form.collectionType === "Larger collection" && (
              <div>
                <div className="mb-1 text-[11px] text-muted-foreground">Number of supply</div>
                <input
                  value={form.supply}
                  onChange={(e) => handleInputChange("supply", e.target.value)}
                  inputMode="numeric"
                  placeholder="e.g. 50"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3 animate-fade-up">
            {topOffer && (
              <Link
                to="/swap"
                className="block rounded-2xl bg-primary-grad p-[1px] shadow-glow animate-pop"
              >
                <div className="rounded-[calc(1rem-1px)] bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      <Zap className="h-3 w-3" /> Top open offer in {form.category}
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
                      Swap with offer →
                    </span>
                  </div>
                </div>
              </Link>
            )}
            <div>
              <div className="mb-1 text-[11px] text-muted-foreground">Or set your own price (₦)</div>
              <input
                value={form.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                className="w-full rounded-xl border-2 border-primary bg-primary/5 px-3 py-2.5 text-sm font-semibold text-primary outline-none"
              />
            </div>
            <button
              onClick={() => handleInputChange("acceptSwaps", !form.acceptSwaps)}
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-3 text-left"
            >
              <div>
                <div className="text-xs font-semibold">Accept swap offers</div>
                <div className="text-[10px] text-muted-foreground">Users can propose artworks</div>
              </div>
              <div
                className={`relative h-6 w-11 rounded-full transition ${
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
            <div>
              <div className="mb-1 text-[11px] text-muted-foreground">Shipping from</div>
              <input
                value={form.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 animate-fade-up">
            <div className="rounded-2xl bg-primary-grad p-4 text-white shadow-glow">
              <Sparkles className="h-5 w-5" />
              <div className="mt-2 font-display text-lg font-semibold">Ready to mint</div>
              <div className="text-xs text-white/80">
                Your piece will be signed onchain and listed immediately.
              </div>
            </div>
            {[
              ["Title", form.title],
              ["Collection", form.collectionType],
              ...(form.collectionType === "Larger collection"
                ? [["Supply", form.supply || "Not set"]]
                : []),
              ["Category", `${form.category} · ${form.dimensions}`],
              ["Price", `₦${form.price}`],
              ["Swap offers", form.acceptSwaps ? "Accepted" : "Not accepted"],
              ["Ships from", form.location],
              ["Token", `0x${Math.random().toString(16).slice(2, 8)}…${Math.random().toString(16).slice(2, 6)}`],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between border-b border-border/60 py-1.5 text-xs"
              >
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            if (step === 2) {
              handlePublish();
            } else {
              setStep((s) => Math.min(2, s + 1));
            }
          }}
          className="w-full rounded-2xl bg-primary-grad py-3 text-sm font-semibold text-white shadow-glow"
        >
          {step === 2 ? "⛓ Publish onchain" : "Continue →"}
        </button>
      </div>
    </AppFrame>
  );
}
