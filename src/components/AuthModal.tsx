import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  defaultTab?: "signin" | "signup";
  onClose: () => void;
}

export function AuthModal({ open, defaultTab = "signin", onClose }: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const { signIn, signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setShowPw(false);
  };

  const switchTab = (t: "signin" | "signup") => {
    setTab(t);
    reset();
  };

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (tab === "signup" && !name) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const result =
      tab === "signin"
        ? await signIn(email, password)
        : await signUp(name, email, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset();
    onClose();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 px-4 py-[calc(1rem_+_env(safe-area-inset-top))] backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal card */}
      <div className="relative my-auto max-h-[calc(100dvh_-_2rem_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] w-full max-w-sm overflow-y-auto rounded-3xl bg-card shadow-2xl animate-[pop_0.3s_both]">
        {/* Gradient top strip */}
        <div className="h-1.5 bg-primary-grad" />

        <div className="p-6">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Logo / heading */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary-grad shadow-glow">
              <span className="text-lg font-bold text-white">⛓</span>
            </div>
            <h2 className="font-display text-xl font-semibold">
              {tab === "signin" ? "Welcome back" : "Join COllectible"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "signin"
                ? "Sign in to your collector account"
                : "Start collecting African art onchain"}
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-5 flex rounded-xl bg-muted p-1">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-card text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="space-y-3">
            {tab === "signup" && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Full name
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Adeola Okafor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="adeola@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete={tab === "signin" ? "current-password" : "new-password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-grad py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {tab === "signin" ? "Sign in" : "Create account"}
          </button>

          {/* Switch hint */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {tab === "signin" ? (
              <>
                No account?{" "}
                <button
                  onClick={() => switchTab("signup")}
                  className="font-medium text-primary hover:underline"
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have one?{" "}
                <button
                  onClick={() => switchTab("signin")}
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
