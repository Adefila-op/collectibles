import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppFrame } from "@/components/AppFrame";
import { userAPI, submissionAPI } from "@/lib/api";
import { Check, ExternalLink, ShieldCheck, X } from "lucide-react";
import type { User, ArtworkSubmission } from "@/lib/api";

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<ArtworkSubmission[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"artists" | "artworks">("artists");

  // Check if user is admin
  const isAdmin = user?.is_admin || user?.isAdmin || false;

  // Fetch data on component mount if user is admin
  useEffect(() => {
    const fetchData = async () => {
      if (isAdmin) {
        try {
          setIsLoading(true);
          const [fetchedUsers, fetchedSubmissions] = await Promise.all([
            userAPI.getAll(),
            submissionAPI.getAll().catch(() => [])
          ]);
          setUsers(fetchedUsers);
          setSubmissions(fetchedSubmissions);
        } catch (error) {
          console.error("Error fetching data:", error);
          setMessage("Error loading data");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const pending = useMemo(() => users.filter((user) => user.artistStatus === "pending"), [users]);
  const approved = useMemo(() => users.filter((user) => user.artistStatus === "approved"), [users]);
  const pendingSubmissions = useMemo(() => submissions.filter((s) => s.submission_status === "submitted"), [submissions]);

  async function decide(userId: string, status: "collector" | "approved") {
    try {
      await userAPI.updateArtistStatus(userId, status === "approved" ? "approved" : "collector");
      const updatedUsers = await userAPI.getAll();
      setUsers(updatedUsers);
      setMessage(status === "approved" ? "Artist approved. Upload access is now unlocked." : "Application rejected. User remains a collector.");
    } catch (error: any) {
      setMessage(error.message || "Error updating artist status");
    }
  }

  async function approveArtwork(submissionId: string) {
    try {
      await submissionAPI.approve(submissionId);
      const updatedSubmissions = await submissionAPI.getAll();
      setSubmissions(updatedSubmissions);
      setMessage("Artwork approved! Certificate NFT minted on Base testnet.");
    } catch (error: any) {
      setMessage(error.message || "Error approving artwork");
    }
  }

  async function rejectArtwork(submissionId: string) {
    try {
      await submissionAPI.reject(submissionId);
      const updatedSubmissions = await submissionAPI.getAll();
      setSubmissions(updatedSubmissions);
      setMessage("Artwork submission rejected.");
    } catch (error: any) {
      setMessage(error.message || "Error rejecting artwork");
    }
  }

  if (!isAdmin) {
    return (
      <AppFrame label="Admin">
        <div className="px-5 pt-6 pb-6">
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-center font-display text-xl font-semibold">Access Denied</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              You do not have administrator permissions. Only admins can access this panel.
            </p>
            {message && <div className="mt-3 text-center text-xs font-semibold text-destructive">{message}</div>}
          </div>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame label="Admin">
      <div className="space-y-5 px-5 pt-4 pb-6">
        <div>
          <h1 className="font-display text-xl font-semibold">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">Manage artist approvals and artwork verification.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("artists")}
            className={`flex-1 rounded-2xl px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === "artists"
                ? "bg-primary text-white"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            Artists ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab("artworks")}
            className={`flex-1 rounded-2xl px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === "artworks"
                ? "bg-primary text-white"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            Artworks ({pendingSubmissions.length})
          </button>
        </div>

        {message && <div className="rounded-2xl bg-primary/10 p-3 text-xs font-semibold text-primary">{message}</div>}

        {/* Artists Tab */}
        {activeTab === "artists" && (
          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-card p-3 shadow-card">
                <div className="text-[10px] text-muted-foreground">Pending</div>
                <div className="font-display text-xl font-semibold">{pending.length}</div>
              </div>
              <div className="rounded-2xl bg-card p-3 shadow-card">
                <div className="text-[10px] text-muted-foreground">Approved</div>
                <div className="font-display text-xl font-semibold">{approved.length}</div>
              </div>
            </div>

            <div className="text-sm font-semibold">Pending applications</div>
            {pending.length === 0 ? (
              <div className="rounded-2xl bg-muted/50 p-4 text-center text-xs text-muted-foreground">
                No pending applications.
              </div>
            ) : (
              pending.map((user) => (
                <article key={user.id} className="rounded-3xl bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-base font-semibold">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                      {user.artist_type || "Artist"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-foreground/80">{user.artist_bio || "No bio provided."}</p>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div>Location: {user.live_location || "Not provided"}</div>
                    {user.portfolio_url && (
                      <a href={user.portfolio_url} className="block font-semibold text-primary">
                        Portfolio <ExternalLink className="inline h-3 w-3" />
                      </a>
                    )}
                    {user.social_url && (
                      <a href={user.social_url} className="block font-semibold text-primary">
                        Social <ExternalLink className="inline h-3 w-3" />
                      </a>
                    )}
                    {user.call_url && (
                      <a href={user.call_url} className="block font-semibold text-primary">
                        Live call <ExternalLink className="inline h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => decide(user.id, "collector")}
                      className="flex items-center justify-center gap-1 rounded-2xl bg-muted py-2.5 text-xs font-semibold text-foreground"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => decide(user.id, "approved")}
                      className="flex items-center justify-center gap-1 rounded-2xl bg-primary py-2.5 text-xs font-semibold text-white"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {/* Artworks Tab */}
        {activeTab === "artworks" && (
          <section className="space-y-3">
            <div className="text-sm font-semibold">Artwork verification submissions</div>
            {pendingSubmissions.length === 0 ? (
              <div className="rounded-2xl bg-muted/50 p-4 text-center text-xs text-muted-foreground">
                No pending artwork submissions.
              </div>
            ) : (
              pendingSubmissions.map((submission) => (
                <article key={submission.id} className="rounded-3xl bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-base font-semibold">{submission.artwork_name}</div>
                      <div className="text-xs text-muted-foreground">by {submission.artist_name}</div>
                    </div>
                    <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-[10px] font-semibold text-yellow-700">
                      {submission.submission_status}
                    </span>
                  </div>

                  {submission.artwork_image && (
                    <img
                      src={submission.artwork_image}
                      alt={submission.artwork_name}
                      className="mt-3 h-32 w-full rounded-2xl object-cover"
                    />
                  )}

                  <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {submission.description && <p className="text-foreground">{submission.description}</p>}
                    {submission.proof_image_url && (
                      <a href={submission.proof_image_url} className="block font-semibold text-primary">
                        View proof image <ExternalLink className="inline h-3 w-3" />
                      </a>
                    )}
                    {submission.proof_document_url && (
                      <a href={submission.proof_document_url} className="block font-semibold text-primary">
                        View document <ExternalLink className="inline h-3 w-3" />
                      </a>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Submitted: {new Date(submission.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => rejectArtwork(submission.id)}
                      className="flex items-center justify-center gap-1 rounded-2xl bg-muted py-2.5 text-xs font-semibold text-foreground"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => approveArtwork(submission.id)}
                      className="flex items-center justify-center gap-1 rounded-2xl bg-green-600 py-2.5 text-xs font-semibold text-white"
                    >
                      <Check className="h-3.5 w-3.5" /> Verify & Mint NFT
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}
      </div>
    </AppFrame>
  );
}
