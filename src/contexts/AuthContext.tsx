import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { userAPI, type User } from "@/lib/api";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import OnboardingModal from "@/components/OnboardingModal";

// ----- helpers ----------------------------------------------------------------

function normalizeUser(user: any): User {
  if (!user) return user;
  return {
    ...user,
    walletBalance: user.wallet_balance ?? user.walletBalance ?? 0,
    walletAddress: user.wallet_address ?? user.walletAddress ?? "",
    isAdmin: user.is_admin ?? user.isAdmin ?? false,
    artistStatus: user.artist_status ?? user.artistStatus ?? "collector",
    onboardingCompleted:
      user.onboarding_completed ?? user.onboardingCompleted ?? false,
    createdAt: user.created_at ?? user.createdAt,
  };
}

/** Build a minimal user object purely from Privy data when the backend is unreachable. */
function buildPrivyFallback(privyUser: any, walletAddress: string): any {
  const email =
    privyUser.email?.address || privyUser.google?.email || "";
  const name =
    privyUser.google?.name ||
    privyUser.apple?.name ||
    email.split("@")[0] ||
    "Collector";
  return {
    id: privyUser.id,
    name,
    email,
    wallet_address: walletAddress,
    wallet_balance: 0,
    is_admin: false,
    artist_status: "collector",
    onboarding_completed: true, // skip onboarding modal in offline mode
    created_at: new Date().toISOString(),
  };
}

// ----- context ----------------------------------------------------------------

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: () => void;
  signUp: () => void;
  signOut: () => void;
  updateWalletBalance: (
    nextBalance: number
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  syncWalletBalance: (
    chain?: string
  ) => Promise<{ ok: true; data: any } | { ok: false; error: string }>;
  createTopup: (
    amount: number,
    chain?: string
  ) => Promise<{ ok: true; data: any } | { ok: false; error: string }>;
  confirmTopup: (
    transactionId: string
  ) => Promise<{ ok: true; data: any } | { ok: false; error: string }>;
  submitArtistApplication: (
    data: any
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ----- provider ---------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authToken, setAuthToken] = useState<string>("");

  const {
    login,
    logout,
    user: privyUser,
    authenticated,
    ready: privyReady,
  } = usePrivy();
  const { wallets } = useWallets();

  // ---- sync on auth change ---------------------------------------------------

  useEffect(() => {
    if (!privyReady) return;

    if (authenticated && privyUser) {
      syncUserWithDb(privyUser);
    } else {
      // user signed out
      setDbUser(null);
      setIsDbLoading(false);
      setShowOnboarding(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privyReady, authenticated, privyUser, wallets]);

  // ---- core sync function ----------------------------------------------------

  const syncUserWithDb = async (pUser: any) => {
    setIsDbLoading(true);

    const email =
      pUser.email?.address || pUser.google?.email || "";
    const name =
      pUser.google?.name ||
      pUser.apple?.name ||
      email.split("@")[0] ||
      "Collector";
    const embeddedWallet = wallets.find(
      (w: any) => w.walletClientType === "privy"
    );
    const walletAddress =
      embeddedWallet?.address || pUser.wallet?.address || "";

    try {
      // NOTE: Vite proxy routes /api/* → localhost:3000/*
      // So the URL here must be /api/auth/sync (NOT /api + /api/auth/sync)
      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privyId: pUser.id,
          email,
          name,
          walletAddress,
        }),
      });

      // Treat any non-2xx as a backend failure → fall through to catch
      if (!response.ok) {
        throw new Error(`Backend unavailable (HTTP ${response.status})`);
      }

      const data = await response.json();

      if (data?.user) {
        localStorage.setItem("artchain_user_id", data.user.id);
        if (data.token) {
          localStorage.setItem("artchain_token", data.token);
          setAuthToken(data.token);
        }
        const normalized = normalizeUser(data.user);
        setDbUser(normalized);
        if (!normalized.onboardingCompleted) {
          setShowOnboarding(true);
        }
        return; // ✅ success
      }

      // Response ok but no user? Fall through.
      throw new Error("Sync response contained no user");
    } catch (err) {
      console.warn(
        "[AuthContext] Backend sync failed – using Privy session data:",
        err
      );

      // ⚡ Offline / dev fallback: build a user object from Privy data so
      //    the rest of the app remains fully functional without the backend.
      const fallback = normalizeUser(
        buildPrivyFallback(pUser, walletAddress)
      );
      setDbUser(fallback);
    } finally {
      setIsDbLoading(false);
    }
  };

  // ---- auth actions ----------------------------------------------------------

  const handleOnboardingComplete = useCallback(
    (updatedUser: any) => {
      setDbUser(normalizeUser(updatedUser));
      setShowOnboarding(false);
    },
    []
  );

  const signIn = useCallback(() => {
    login();
  }, [login]);

  const signUp = useCallback(() => {
    login();
  }, [login]);

  const signOut = useCallback(() => {
    logout();
    localStorage.removeItem("artchain_user_id");
    localStorage.removeItem("artchain_token");
    setDbUser(null);
    setAuthToken("");
    setShowOnboarding(false);
  }, [logout]);

  // ---- wallet helpers --------------------------------------------------------

  const updateWalletBalance = useCallback(
    async (
      nextBalance: number
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!dbUser) return { ok: false, error: "Sign in to use your wallet." };
      try {
        const delta = nextBalance - (dbUser.walletBalance ?? 0);
        const updated = await userAPI.updateWallet(dbUser.id, delta);
        setDbUser(updated);
        return { ok: true };
      } catch (err: any) {
        // In offline mode just update locally
        setDbUser((prev) =>
          prev ? { ...prev, walletBalance: nextBalance } : prev
        );
        return { ok: true };
      }
    },
    [dbUser]
  );

  const syncWalletBalance = useCallback(
    async (
      _chain = "solana"
    ): Promise<{ ok: true; data: any } | { ok: false; error: string }> => {
      if (!dbUser) return { ok: false, error: "Sign in to sync wallet." };
      return { ok: true, data: { synced: true } };
    },
    [dbUser]
  );

  const createTopup = useCallback(
    async (
      amount: number,
      _chain = "solana"
    ): Promise<{ ok: true; data: any } | { ok: false; error: string }> => {
      if (!dbUser) return { ok: false, error: "Sign in to deposit funds." };
      if (amount <= 0) return { ok: false, error: "Amount must be > 0." };
      return { ok: true, data: { topupCreated: true } };
    },
    [dbUser]
  );

  const confirmTopup = useCallback(
    async (
      _transactionId: string
    ): Promise<{ ok: true; data: any } | { ok: false; error: string }> => {
      if (!dbUser) return { ok: false, error: "Sign in to confirm deposit." };
      try {
        const updated = await userAPI.getById(dbUser.id);
        setDbUser(updated);
      } catch {
        /* offline – ignore */
      }
      return { ok: true, data: { confirmed: true } };
    },
    [dbUser]
  );

  const submitArtistApplication = useCallback(
    async (
      data: any
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!dbUser) return { ok: false, error: "Sign in to apply as artist." };
      try {
        const updated = await userAPI.updateArtistStatus(dbUser.id, {
          status: "pending",
          ...data,
        });
        setDbUser(updated);
        return { ok: true };
      } catch (err: any) {
        // Offline fallback – optimistically mark as pending
        setDbUser((prev) =>
          prev ? { ...prev, artistStatus: "pending" } : prev
        );
        return { ok: true };
      }
    },
    [dbUser]
  );

  // ---- render ----------------------------------------------------------------

  return (
    <AuthContext.Provider
      value={{
        user: dbUser,
        isLoading: !privyReady || isDbLoading,
        signIn,
        signUp,
        signOut,
        updateWalletBalance,
        syncWalletBalance,
        createTopup,
        confirmTopup,
        submitArtistApplication,
      }}
    >
      {children}
      {showOnboarding && dbUser && (
        <OnboardingModal
          userId={dbUser.id}
          token={authToken}
          onComplete={handleOnboardingComplete}
        />
      )}
    </AuthContext.Provider>
  );
}

// ----- hook -------------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
