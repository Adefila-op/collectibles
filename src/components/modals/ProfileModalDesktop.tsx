import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fmt } from "@/lib/art-data";
import { holdingsAPI } from "@/lib/api-transactions";
import { artAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeCheck,
  LogOut,
  Palette,
  Plus,
  Repeat2,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ProfileModalDesktopProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function ProfileModalDesktop({
  open,
  onOpenChange,
}: ProfileModalDesktopProps) {
  const { user, signOut, updateWalletBalance, submitArtistApplication } =
    useAuth();
  const [walletMode, setWalletMode] = useState<"deposit" | "withdraw" | null>(
    null
  );
  const [userHoldings, setUserHoldings] = useState<any>({ owned: 0, listed: 0, swapped: 0, arts: [] });
  const [allArtworks, setAllArtworks] = useState<any[]>([]);
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

  // Fetch user holdings and artworks from API
  useEffect(() => {
    const fetchData = async () => {
      if (user?.id && open) {
        try {
          const [holdings, artworks] = await Promise.all([
            holdingsAPI.getByUser(user.id),
            artAPI.getAll()
          ]);
          const stats = {
            owned: holdings.filter((h: any) => h.status === "owned").length,
            listed: holdings.filter((h: any) => h.status === "listed").length,
            swapped: holdings.filter((h: any) => h.status === "swapped").length,
            arts: holdings,
          };
          setUserHoldings(stats);
          setAllArtworks(artworks || []);
        } catch (error) {
          console.error("Error fetching holdings:", error);
        }
      }
    };
    fetchData();
  }, [user?.id, open]);

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[400px] rounded-3xl border-0">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>Sign in to view profile</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center">
            Sign in to access your profile and wallet
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  // Get user balance
  const balance = user?.walletBalance ?? 0;
  const walletAddress = walletAddressForUser(user.id);

  // Calculate portfolio balance
  const uniqueOwnedIds = new Set<string>();
  const portfolioBalance = userHoldings.arts
    .filter((holding: any) => holding.status === "owned")
    .reduce((total: number, holding: any) => {
      if (uniqueOwnedIds.has(holding.artId)) return total;
      uniqueOwnedIds.add(holding.artId);
      const art = allArtworks.find((a) => a.id === holding.artId);
      return total + (art?.price ?? 0);
    }, 0);
  const totalPortfolioBalance = balance + portfolioBalance;

  // Get artworks for display
  const uniqueArtIds = new Set<string>();
  const userArts = userHoldings.arts
    .slice(0, 2)
    .filter((holding: any) => {
      if (uniqueArtIds.has(holding.artId)) return false;
      uniqueArtIds.add(holding.artId);
      return true;
    })
    .map((holding: any) => {
      const art = allArtworks.find((a) => a.id === holding.artId);
      return { art, holding };
    })
    .filter((item: any) => item.art);

  const depositNaira = Math.max(
    0,
    Math.round((Number(depositAmount) || 0) * NAIRA_PER_USDC)
  );
  const withdrawNaira = Math.max(
    0,
    Math.round((Number(withdrawAmount) || 0) * NAIRA_PER_USDC)
  );

  function handleDeposit() {
    if (depositNaira <= 0) {
      setWalletMessage("Enter a deposit amount first.");
      return;
    }
    updateWalletBalance(balance + depositNaira);
    setWalletMessage(
      `${depositAmount} USDC received on ${network}. Spending balance updated.`
    );
    setWalletMode(null);
  }

  function handleWithdraw() {
    if (withdrawNaira <= 0) {
      setWalletMessage("Enter a withdrawal amount first.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{20,}$/.test(withdrawAddress.trim())) {
      setWalletMessage("Enter a valid crypto wallet address.");
      return;
    }
    if (withdrawNaira > balance) {
      setWalletMessage("Insufficient spending balance for this withdrawal.");
      return;
    }
    updateWalletBalance(balance - withdrawNaira);
    setWalletMessage(
      `${withdrawAmount} USDC sent on ${network}. Spending balance updated.`
    );
    setWalletMode(null);
  }

  async function handleArtistApply() {
    if (
      !artistForm.artistType ||
      !artistForm.artistBio ||
      !artistForm.portfolioUrl
    ) {
      setArtistMessage(
        "Artist type, bio, and portfolio are required."
      );
      return;
    }
    const result = await submitArtistApplication(artistForm);
    setArtistMessage(
      result.ok
        ? "Application submitted. Your account stays collector-only until approval."
        : result.error
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[600px] rounded-3xl border-0 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Profile & Wallet
            </DialogTitle>
            <DialogDescription>Manage your account and portfolio</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* User Info */}
            <div className="flex items-start gap-4 pb-4 border-b border-border">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                {user.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{user.name}</div>
                  <BadgeCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="text-xs text-muted-foreground">
                  Collector since{" "}
                  {new Date(user.created_at).toLocaleDateString("en", {
                    year: "numeric",
                    month: "short",
                  })}
                </div>
              </div>
              <button
                onClick={() => {
                  signOut();
                  onOpenChange(false);
                }}
                className="p-2 hover:bg-muted rounded-lg transition"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Portfolio Balance */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 p-4 border border-primary/20">
              <div className="text-xs font-medium text-muted-foreground">
                Total portfolio balance
              </div>
              <div className="mt-2 font-display text-3xl font-semibold">
                {fmt(totalPortfolioBalance)}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(
                  [
                    [userHoldings.owned.toString(), "Owned"],
                    [userHoldings.listed.toString(), "Listed"],
                    [userHoldings.swapped.toString(), "Swaps"],
                  ] as [string, string][]
                ).map(([v, l]) => (
                  <div key={l} className="rounded-lg bg-white/50 p-2 text-center text-xs">
                    <div className="font-semibold">{v}</div>
                    <div className="text-muted-foreground">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spending Balance */}
            <div className="rounded-2xl bg-muted/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Spending balance
                  </div>
                  <div className="mt-1 font-display text-2xl font-semibold">
                    {fmt(balance)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setWalletMode("deposit");
                      setWalletMessage("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                  >
                    <ArrowDownToLine className="h-3.5 w-3.5" /> Deposit
                  </button>
                  <button
                    onClick={() => {
                      setWalletMode("withdraw");
                      setWalletMessage("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                  >
                    <ArrowUpFromLine className="h-3.5 w-3.5" /> Withdraw
                  </button>
                </div>
              </div>

              {walletMode && (
                <div className="mt-4 space-y-3 rounded-lg bg-background p-3">
                  {walletMode === "deposit" ? (
                    <>
                      <div>
                        <label className="text-xs font-semibold">
                          Amount (USDC)
                        </label>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                          placeholder="100"
                        />
                        <div className="mt-1 text-xs text-muted-foreground">
                          ≈ ₦{depositNaira.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold">Network</label>
                        <select
                          value={network}
                          onChange={(e) =>
                            setNetwork(
                              e.target.value as (typeof NETWORKS)[number]
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                        >
                          {NETWORKS.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={handleDeposit}
                        className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white hover:bg-primary/90"
                      >
                        Confirm Deposit
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-semibold">
                          Amount (USDC)
                        </label>
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                          placeholder="50"
                        />
                        <div className="mt-1 text-xs text-muted-foreground">
                          ≈ ₦{withdrawNaira.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold">
                          Wallet address
                        </label>
                        <input
                          type="text"
                          value={withdrawAddress}
                          onChange={(e) => setWithdrawAddress(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono outline-none focus:border-primary"
                          placeholder="0x..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold">Network</label>
                        <select
                          value={network}
                          onChange={(e) =>
                            setNetwork(
                              e.target.value as (typeof NETWORKS)[number]
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                        >
                          {NETWORKS.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={handleWithdraw}
                        className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white hover:bg-primary/90"
                      >
                        Confirm Withdrawal
                      </button>
                    </>
                  )}
                  {walletMessage && (
                    <div className="rounded-lg bg-primary/10 p-2 text-xs font-semibold text-primary">
                      {walletMessage}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Artist Application */}
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">Artist Status</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {user.artistStatus === "approved"
                      ? "✓ You're an approved artist"
                      : user.artistStatus === "pending"
                      ? "⏳ Application pending"
                      : "Apply to list your own artworks"}
                  </div>
                </div>
                {user.artistStatus !== "approved" && (
                  <button
                    onClick={() => {
                      setArtistOpen(true);
                      setArtistMessage("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                  >
                    <Palette className="h-3.5 w-3.5" /> Apply
                  </button>
                )}
              </div>
            </div>

            {/* My Collection Preview */}
            {userArts.length > 0 && (
              <div>
                <div className="text-sm font-semibold mb-3">My collection</div>
                <div className="space-y-2">
                  {userArts.map(({ art, holding }: any) => (
                    <div
                      key={holding.id}
                      className="flex items-start gap-3 rounded-lg border border-border p-2 hover:border-primary/40 hover:bg-muted/30 transition"
                    >
                      <Link
                        to={`/art/${art!.id}`}
                        className="flex items-start gap-3 flex-1 min-w-0"
                      >
                        <img
                          src={art!.image}
                          alt={art!.name}
                          className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">
                            {art!.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {art!.artist}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[10px]">
                            <span className="text-primary font-semibold">
                              {fmt(art!.price)}
                            </span>
                            <span
                              className={`${
                                holding.status === "listed"
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              ● {holding.status}
                            </span>
                          </div>
                        </div>
                      </Link>
                      {holding.status === "owned" && (
                        <Link
                          to={`/list/${art!.id}`}
                          className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/20 whitespace-nowrap flex-shrink-0"
                        >
                          <Plus className="h-3 w-3 inline mr-1" /> {user.artistStatus === "approved" ? "List" : "Resell"}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Artist Application Modal */}
      <Dialog open={artistOpen} onOpenChange={setArtistOpen}>
        <DialogContent className="max-w-[400px] rounded-3xl border-0">
          <DialogHeader>
            <DialogTitle>Apply as Artist</DialogTitle>
            <DialogDescription>
              Fill in your details to apply as an artist
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold">Artist type</label>
              <select
                value={artistForm.artistType}
                onChange={(e) =>
                  setArtistForm({ ...artistForm, artistType: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                {["Painter", "Sculptor", "Photographer", "Textile artist", "Beadwork artist", "Other"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold">Bio</label>
              <textarea
                value={artistForm.artistBio}
                onChange={(e) =>
                  setArtistForm({ ...artistForm, artistBio: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm min-h-24 outline-none focus:border-primary"
                placeholder="Tell us about your artistic practice..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Portfolio URL</label>
              <input
                type="url"
                value={artistForm.portfolioUrl}
                onChange={(e) =>
                  setArtistForm({
                    ...artistForm,
                    portfolioUrl: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Social URL</label>
              <input
                type="url"
                value={artistForm.socialUrl}
                onChange={(e) =>
                  setArtistForm({ ...artistForm, socialUrl: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Location</label>
              <input
                type="text"
                value={artistForm.liveLocation}
                onChange={(e) =>
                  setArtistForm({
                    ...artistForm,
                    liveLocation: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            {artistMessage && (
              <div className="rounded-lg bg-primary/10 p-3 text-xs font-semibold text-primary">
                {artistMessage}
              </div>
            )}

            <button
              onClick={handleArtistApply}
              className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Submit Application
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
