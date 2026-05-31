import { useMemo, useState } from "react";
import { AppFrame } from "@/components/AppFrame";
import { getUsers, updateArtistStatus, type User } from "@/lib/db";
import { Check, ExternalLink, ShieldCheck, X } from "lucide-react";

const ADMIN_CODE = "ARTCHAIN-ADMIN";

export default function Admin() {
  const [isUnlocked, setIsUnlocked] = useState(() => localStorage.getItem("artchain_admin") === "true");
  const [code, setCode] = useState("");
  const [users, setUsers] = useState<User[]>(() => getUsers());
  const [message, setMessage] = useState("");

  const pending = useMemo(() => users.filter((user) => user.artistStatus === "pending"), [users]);
  const approved = useMemo(() => users.filter((user) => user.artistStatus === "approved"), [users]);

  function unlock() {
    if (code.trim() !== ADMIN_CODE) {
      setMessage("Invalid admin code.");
      return;
    }
    localStorage.setItem("artchain_admin", "true");
    setIsUnlocked(true);
    setMessage("");
  }

  function decide(userId: string, status: "collector" | "approved") {
    const result = updateArtistStatus(userId, status);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setUsers(getUsers());
    setMessage(status === "approved" ? "Artist approved. Upload access is now unlocked." : "Application rejected. User remains a collector.");
  }

  if (!isUnlocked) {
    return (
      <AppFrame label="Admin">
        <div className="px-5 pt-6 pb-6">
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-center font-display text-xl font-semibold">Admin review</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Enter the admin code to review artist applications.
            </p>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Admin code"
              className="mt-5 w-full rounded-2xl bg-muted px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            {message && <div className="mt-3 text-center text-xs font-semibold text-primary">{message}</div>}
            <button
              onClick={unlock}
              className="mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white shadow-glow"
            >
              Unlock admin
            </button>
          </div>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame label="Admin">
      <div className="space-y-5 px-5 pt-4 pb-6">
        <div>
          <h1 className="font-display text-xl font-semibold">Artist approvals</h1>
          <p className="text-xs text-muted-foreground">Review pending artists before they can upload artwork.</p>
        </div>

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

        {message && <div className="rounded-2xl bg-primary/10 p-3 text-xs font-semibold text-primary">{message}</div>}

        <section className="space-y-3">
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
                    {user.artistType || "Artist"}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-foreground/80">{user.artistBio || "No bio provided."}</p>
                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <div>Location: {user.liveLocation || "Not provided"}</div>
                  {user.portfolioUrl && (
                    <a href={user.portfolioUrl} className="block font-semibold text-primary">
                      Portfolio <ExternalLink className="inline h-3 w-3" />
                    </a>
                  )}
                  {user.socialUrl && (
                    <a href={user.socialUrl} className="block font-semibold text-primary">
                      Social <ExternalLink className="inline h-3 w-3" />
                    </a>
                  )}
                  {user.callUrl && (
                    <a href={user.callUrl} className="block font-semibold text-primary">
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
      </div>
    </AppFrame>
  );
}
