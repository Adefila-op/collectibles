import { AppFrame } from "@/components/AppFrame";
import { ProfileModalDesktop } from "@/components/modals/ProfileModalDesktop";
import { SwapModalDesktop } from "@/components/modals/SwapModalDesktop";
import { fmt } from "@/lib/art-data";
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, BadgeCheck, Calendar, LogIn, Palette, Repeat2, Plus, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { holdingsAPI, artAPI } from "@/lib/api";
import type { Art } from "@/lib/art-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const NAIRA_PER_USDC = 1500;
const NETWORKS = ["Base", "Ethereum", "Polygon"] as const;

function walletAddressForUser(userId: string) {
  let hash = "";
  for (let i = 0; i < 40; i++) {
    const code = userId.charCodeAt(i % userId.length) + i * 17;
    hash += (code % 16).toString(16);
  }
  return `0x${hash}`;
}

export default function Profile() {
  const { user, signOut, updateWalletBalance, submitArtistApplication } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [walletMode, setWalletMode] = useState<"deposit" | "withdraw" | null>(null);
  const [artistOpen, setArtistOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("100");
  const [withdrawAmount, setWithdrawAmount] = useState("50");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [network, setNetwork] = useState<(typeof NETWORKS)[number]>("Base");
  const [walletMessage, setWalletMessage] = useState("");
  const [artistForm, setArtistForm] = useState({
    artistType: "Painter",
    artistBio: "",
    portfolioUrl: "",
    socialUrl: "",
    liveLocation: "Lagos, Nigeria",
    callUrl: "",
  });
  const [artistMessage, setArtistMessage] = useState("");
  const [userHoldings, setUserHoldings] = useState<any[]>([]);
  const [allArtworks, setAllArtworks] = useState<Art[]>([]);

  // Fetch holdings from API
  useEffect(() => {
    if (!user) {
      setUserHoldings([]);
      return;
    }

    async function fetchHoldings() {
      try {
        const holdings = await holdingsAPI.getByUserId((user as any).id as string);
        setUserHoldings(holdings || []);
      } catch (err) {
        console.error("Failed to fetch holdings:", err);
        setUserHoldings([]);
      }
    }

    fetchHoldings();
  }, [user]);

  // Fetch all artworks
  useEffect(() => {
    async function fetchArtworks() {
      try {
        const artworks = await artAPI.getAll();
        setAllArtworks(artworks || []);
      } catch (err) {
        console.error("Failed to fetch artworks:", err);
        setAllArtworks([]);
      }
    }

    fetchArtworks();
  }, []);

  const balance = user?.walletBalance ?? 0;
  const walletAddress = user ? walletAddressForUser(user.id) : "";
  
  // Calculate holding counts from API data
  const ownedCount = userHoldings.filter((h) => h.status === "owned").length;
  const listedCount = userHoldings.filter((h) => h.status === "listed").length;
  const swappedCount = userHoldings.filter((h) => h.status === "swapped").length;
  
  // Calculate portfolio balance (total value of owned artworks)
  const uniqueOwnedIds = new Set<string>();
  const portfolioBalance = userHoldings
    .filter((holding) => holding.status === "owned")
    .reduce((total, holding) => {
      const artId = holding.art_id || holding.artId;
      if (uniqueOwnedIds.has(artId)) return total;
      uniqueOwnedIds.add(artId);
      const art = allArtworks.find((a) => a.id === artId);
      return total + (art?.price ?? 0);
    }, 0);
  const totalPortfolioBalance = balance + portfolioBalance;

  // Get artworks for display (deduplicated by artId)
  const uniqueArtIds = new Set<string>();
  const userArts = userHoldings
    .slice(0, 3)
    .filter((holding) => {
      const artId = holding.art_id || holding.artId;
      if (uniqueArtIds.has(artId)) return false;
      uniqueArtIds.add(artId);
      return true;
    })
    .map((holding) => {
      // The API returns the art data joined with the holding
      const art: Art | undefined = holding.id && holding.name ? {
        id: holding.id,
        name: holding.name,
        artist: holding.artist,
        category: holding.category,
        city: holding.city,
        year: holding.year,
        price: holding.price,
        image: holding.image,
        token: holding.token,
        uniqueId: holding.unique_id || holding.uniqueId,
      } : undefined;
      return { art, holding };
    })
    .filter((item) => item.art);

  const depositNaira = Math.max(0, Math.round((Number(depositAmount) || 0) * NAIRA_PER_USDC));
  const withdrawNaira = Math.max(0, Math.round((Number(withdrawAmount) || 0) * NAIRA_PER_USDC));

  function handleDeposit() {
    if (!user || depositNaira <= 0) {
      setWalletMessage("Enter a deposit amount first.");
      return;
    }
    updateWalletBalance(balance + depositNaira);
    setWalletMessage(`${depositAmount} USDC received on ${network}. Spending balance updated.`);
  }

  async function handleWithdraw() {
    if (!user || withdrawNaira <= 0) {
      setWalletMessage("Enter a withdrawal amount first.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(withdrawAddress.trim())) {
      setWalletMessage("Enter a valid Ethereum wallet address (0x followed by 40 hex characters).");
      return;
    }
    if (withdrawNaira > balance) {
      setWalletMessage("Insufficient spending balance for this withdrawal.");
      return;
    }

    try {
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: withdrawNaira,
          recipientAddress: withdrawAddress.trim(),
          artId: null, // Can add art withdrawal later
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setWalletMessage(`Withdrawal failed: ${error.error}`);
        return;
      }

      const data = await response.json();
      
      // Update local balance to reflect withdrawal
      updateWalletBalance(balance - withdrawNaira);
      setWalletMessage(`✓ Withdrawal processed! ${withdrawAmount} USDC sent to ${withdrawAddress.slice(0, 6)}...${withdrawAddress.slice(-4)}. You'll receive it in 2-5 minutes.`);
      
      // Reset form
      setWithdrawAmount("50");
      setWithdrawAddress("");
      
      // Close modal after 2 seconds
      setTimeout(() => setWalletMode(null), 2000);
    } catch (error: any) {
      setWalletMessage(`Error: ${error.message}`);
    }
  }

  async function handleArtistApply() {
    if (!artistForm.artistType || !artistForm.artistBio || !artistForm.portfolioUrl) {
      setArtistMessage("Artist type, bio, and portfolio are required.");
      return;
    }
    const result = await submitArtistApplication(artistForm);
    setArtistMessage(result.ok ? "Application submitted. Your account stays collector-only until approval." : result.error);
  }

  return (
    <>
      <AppFrame
        label="Profile · Wallet"
        desktop={
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <ProfileModalDesktop open={true} onOpenChange={() => {}} />
          </div>
        }
      >
        <div className="px-5 pt-3 pb-6">
        <div className="mb-4 flex items-center gap-3">
          <Link to="/explore" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-sm font-semibold">Back to dashboard</div>
        </div>

        <div className="flex items-end gap-3 px-1">
          <button
            onClick={() => {
              if (user) {
                signOut();
              } else {
                setAuthOpen(true);
              }
            }}
            className="grid h-16 w-16 place-items-center rounded-2xl bg-card text-lg font-bold text-primary ring-4 ring-card shadow-glow hover:opacity-80 transition-opacity cursor-pointer"
          >
            {user ? user.avatar : "?"}
          </button>
          <div className="pb-1">
            {user ? (
              <>
                <div className="flex items-center gap-1.5 font-display text-lg font-semibold">
                  {user.name} <BadgeCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Lagos · Collector since{" "}
                  {new Date(user.created_at).toLocaleDateString("en", {
                    year: "numeric",
                    month: "long",
                  })}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>Click avatar to sign out</span>
                  <Link to="/admin" className="font-semibold text-primary">
                    Admin
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="font-display text-lg font-semibold text-muted-foreground">
                  Guest
                </div>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="mt-1 flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  <LogIn className="h-3.5 w-3.5" /> Sign in to your account
                </button>
              </>
            )}
          </div>
        </div>

        {user ? (
          <>
            <section className="relative mt-4 overflow-hidden rounded-[28px] bg-[hsl(var(--ink))] p-5 text-white shadow-glow animate-fade-up">
              <div className="absolute right-0 top-0 flex h-32 translate-x-8 gap-1.5 pt-2">
                <span className="h-full w-7 rounded-l-2xl bg-yellow-300" />
                <span className="h-full w-7 rounded-l-2xl bg-emerald-300" />
                <span className="h-full w-7 rounded-l-2xl bg-sky-400" />
              </div>

              <div className="relative">
                <div className="text-xs font-medium text-white/45">Total portfolio balance</div>
                <div className="mt-1 flex items-baseline gap-1 font-display">
                  <span className="text-3xl font-semibold leading-none">{fmt(totalPortfolioBalance)}</span>
                  <span className="text-sm font-semibold text-white/45">.00</span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setWalletMode("deposit");
                      setWalletMessage("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[hsl(var(--ink))]"
                  >
                    <ArrowDownToLine className="h-3.5 w-3.5" /> Deposit
                  </button>
                  <button
                    onClick={() => {
                      setWalletMode("withdraw");
                      setWalletMessage("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <ArrowUpFromLine className="h-3.5 w-3.5" /> Withdraw
                  </button>
                </div>

                <div className="mt-8 w-[62%] rounded-2xl bg-white/10 p-3 backdrop-blur">
                  <div className="text-xs font-medium text-white/45">Spending balance</div>
                  <div className="mt-0.5 font-display text-base font-semibold">{fmt(balance)}</div>
                </div>

                {user.wallet_address && (
                  <div className="mt-4 w-full rounded-2xl bg-white/5 p-3 backdrop-blur">
                    <div className="text-xs font-medium text-white/45">On-chain wallet</div>
                    <div className="mt-1 flex items-center justify-between gap-2 break-all text-[10px] font-mono text-white/70">
                      <span>{user.wallet_address}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(user.wallet_address || '');
                          alert('Wallet address copied!');
                        }}
                        className="flex-shrink-0 text-white/40 hover:text-white transition text-xs px-2 py-1"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setArtistOpen(true);
                    setArtistMessage("");
                  }}
                  className="absolute bottom-1 right-0 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-semibold text-[hsl(var(--ink))] shadow-soft"
                >
                  <Palette className="h-3.5 w-3.5 text-primary" />
                  {user.artistStatus === "approved"
                    ? "Artist approved"
                    : user.artistStatus === "pending"
                    ? "Artist pending"
                    : "Apply as artist"}
                </button>
              </div>
            </section>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {(
                [
                  [ownedCount.toString(), "Owned"],
                  [listedCount.toString(), "Listed"],
                  [swappedCount.toString(), "Swaps"],
                ] as [string, string][]
              ).map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-muted/60 p-3 text-center">
                  <div className="font-display text-lg font-semibold">{v}</div>
                  <div className="text-[10px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 text-sm font-semibold">My collection</div>
            {userArts.length > 0 ? (
              <div className="mt-2 space-y-3">
                {userArts.map(({ art, holding }, i) => (
                  <div
                    key={holding.id}
                    className="rounded-2xl border border-border bg-card p-3 shadow-card animate-fade-up hover:border-primary/40 hover:bg-card/80 transition"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <Link to={`/art/${art!.id}`} className="flex items-start gap-3">
                      <img src={art!.image} alt={art!.name} className="h-16 w-16 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold">{art!.name}</div>
                        <div className="text-[10px] text-muted-foreground">{art!.artist}</div>
                        <div className="mt-1 text-xs text-primary font-semibold">{fmt(art!.price)}</div>
                        <div className={`text-[9px] mt-0.5 ${holding.status === 'listed' ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ● {holding.status}
                        </div>
                      </div>
                    </Link>
                    
                    {holding.status === 'owned' && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link
                          to={`/list/${art!.id}`}
                          className="rounded-lg bg-primary/10 hover:bg-primary/20 py-2 text-center text-[10px] font-semibold text-primary transition flex items-center justify-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> {user.artistStatus === "approved" ? "List" : "Resell"}
                        </Link>
                        <button
                          onClick={() => setSwapModalOpen(true)}
                          className="rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 py-2 text-center text-[10px] font-semibold text-emerald-600 transition flex items-center justify-center gap-1"
                        >
                          <Repeat2 className="h-3 w-3" /> Swap
                        </button>
                      </div>
                    )}

                    {holding.status === 'listed' && (
                      <div className="mt-3">
                        <button type="button" className="w-full rounded-lg bg-amber-500/10 hover:bg-amber-500/20 py-2 text-center text-[10px] font-semibold text-amber-600 transition flex items-center justify-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Listed for sale
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-2xl border border-border bg-muted/30 p-4 text-center">
                <div className="text-xs text-muted-foreground">No artworks in collection</div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center">
            <div className="text-4xl mb-3">🎨</div>
            <div className="font-display text-base font-semibold">Start your collection</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign in to track your artworks, wallet, and trades.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="mt-4 rounded-2xl bg-primary-grad px-6 py-2.5 text-sm font-semibold text-white shadow-glow"
            >
              Sign in / Sign up
            </button>
          </div>
        )}
      </div>

      <Dialog open={walletMode !== null} onOpenChange={(open) => !open && setWalletMode(null)}>
        <DialogContent className="max-w-[390px] rounded-3xl border-0 p-0 overflow-hidden">
          <div className="bg-[hsl(var(--ink))] p-5 text-white">
            <DialogHeader>
              <DialogTitle className="text-left text-xl">
                {walletMode === "deposit" ? "Deposit crypto" : "Withdraw crypto"}
              </DialogTitle>
              <DialogDescription className="text-left text-white/55">
                {walletMode === "deposit"
                  ? "Send USDC to your built-in COllectible wallet."
                  : "Send funds out from your spending balance."}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 rounded-2xl bg-white/10 p-3">
              <div className="text-[11px] text-white/45">Built-in wallet</div>
              <div className="mt-1 break-all font-mono text-xs">{walletAddress}</div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">Network</div>
              <div className="grid grid-cols-3 gap-2">
                {NETWORKS.map((item) => (
                  <button
                    key={item}
                    onClick={() => setNetwork(item)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      network === item ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {walletMode === "deposit" ? (
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Amount to credit</label>
                <div className="mt-2 flex items-center rounded-2xl bg-muted px-3 py-2.5">
                  <input
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    inputMode="decimal"
                    className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">USDC</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Credits {fmt(depositNaira)}</div>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Recipient wallet</label>
                  <input
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="0x..."
                    className="mt-2 w-full rounded-2xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Amount to send</label>
                  <div className="mt-2 flex items-center rounded-2xl bg-muted px-3 py-2.5">
                    <input
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      inputMode="decimal"
                      className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">USDC</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Sends {fmt(withdrawNaira)} from {fmt(balance)} available
                  </div>
                </div>
              </>
            )}

            {walletMessage && (
              <div className="rounded-2xl bg-primary/10 p-3 text-xs font-medium text-primary">
                {walletMessage}
              </div>
            )}

            <button
              onClick={walletMode === "deposit" ? handleDeposit : handleWithdraw}
              className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white shadow-glow"
            >
              {walletMode === "deposit" ? "Confirm deposit" : "Send withdrawal"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={artistOpen} onOpenChange={setArtistOpen}>
        <DialogContent className="max-w-[390px] rounded-3xl border-0 p-0 overflow-hidden">
          <div className="bg-primary-grad p-5 text-white">
            <DialogHeader>
              <DialogTitle className="text-left text-xl">Apply as artist</DialogTitle>
              <DialogDescription className="text-left text-white/75">
                Share enough detail for approval. Your account remains collector-only until approved.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 rounded-2xl bg-white/10 p-3 text-xs">
              Current status: {user?.artistStatus === "approved" ? "Approved artist" : user?.artistStatus === "pending" ? "Pending review" : "Collector"}
            </div>
          </div>

          <div className="max-h-[68vh] space-y-3 overflow-y-auto p-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Type of artist</label>
              <select
                value={artistForm.artistType}
                onChange={(e) => setArtistForm((prev) => ({ ...prev, artistType: e.target.value }))}
                className="mt-2 w-full rounded-2xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                {["Painter", "Sculptor", "Textile artist", "Photographer", "Mixed media", "Digital artist"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Artist bio</label>
              <textarea
                value={artistForm.artistBio}
                onChange={(e) => setArtistForm((prev) => ({ ...prev, artistBio: e.target.value }))}
                placeholder="Tell collectors about your practice, materials, and exhibitions."
                className="mt-2 min-h-24 w-full rounded-2xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {[
              ["Portfolio link", "portfolioUrl", "https://your-portfolio.com"],
              ["Social link", "socialUrl", "https://instagram.com/..."],
              ["Live location", "liveLocation", "City, Country"],
              ["Book a live call", "callUrl", "https://cal.com/..."],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className="text-xs font-semibold text-muted-foreground">{label}</label>
                <input
                  value={artistForm[key as keyof typeof artistForm]}
                  onChange={(e) => setArtistForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="mt-2 w-full rounded-2xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}

            {artistMessage && (
              <div className="rounded-2xl bg-primary/10 p-3 text-xs font-medium text-primary">
                {artistMessage}
              </div>
            )}

            <button
              onClick={handleArtistApply}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-white shadow-glow"
            >
              <Calendar className="h-4 w-4" /> Submit for approval
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <SwapModalDesktop open={swapModalOpen} onOpenChange={setSwapModalOpen} />
      </AppFrame>
    </>
  );
}
