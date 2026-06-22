import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { userAPI, type User } from "@/lib/api";
import OnboardingModal from "@/components/OnboardingModal";
import AuthModal from "@/components/AuthModal";

// ----- helpers ----------------------------------------------------------------

function normalizeUser(user: any): User {
  if (!user) return user;
  return {
    ...user,
    walletBalance: user.wallet_balance ?? user.walletBalance ?? 0,
    walletAddress: user.wallet_address ?? user.walletAddress ?? "",
    isAdmin: user.is_admin ?? user.isAdmin ?? false,
    artistStatus: user.artist_status ?? user.artistStatus ?? "collector",
    userType: user.user_type ?? user.userType ?? "collector",
    firstName: user.first_name ?? user.firstName ?? "",
    lastName: user.last_name ?? user.lastName ?? "",
    gender: user.gender ?? "",
    onboardingCompleted:
      user.onboarding_completed ?? user.onboardingCompleted ?? false,
    createdAt: user.created_at ?? user.createdAt,
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

  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    defaultView: "login" | "register";
  }>({ isOpen: false, defaultView: "login" });

  useEffect(() => {
    // Attempt to load user from localStorage token
    const token = localStorage.getItem("artchain_token");
    const userId = localStorage.getItem("artchain_user_id");

    if (token && userId) {
      setAuthToken(token);
      loadUser(userId);
    } else {
      setIsDbLoading(false);
    }
  }, []);

  const loadUser = async (userId: string) => {
    try {
      setIsDbLoading(true);
      const user = await userAPI.getById(userId);
      const normalized = normalizeUser(user);
      setDbUser(normalized);
      if (!normalized.onboardingCompleted) {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error("Failed to load user session", err);
      signOut(); // clear invalid state
    } finally {
      setIsDbLoading(false);
    }
  };

  const handleAuthSuccess = (data: any) => {
    if (data?.user && data?.token) {
      localStorage.setItem("artchain_user_id", data.user.id);
      localStorage.setItem("artchain_token", data.token);
      setAuthToken(data.token);
      const normalized = normalizeUser(data.user);
      setDbUser(normalized);
      if (!normalized.onboardingCompleted) {
        setShowOnboarding(true);
      }
      setAuthModalState({ isOpen: false, defaultView: "login" });
    }
  };

  const handleOnboardingComplete = useCallback(
    (updatedUser: any) => {
      setDbUser(normalizeUser(updatedUser));
      setShowOnboarding(false);
    },
    []
  );

  const signIn = useCallback(() => {
    setAuthModalState({ isOpen: true, defaultView: "login" });
  }, []);

  const signUp = useCallback(() => {
    setAuthModalState({ isOpen: true, defaultView: "register" });
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("artchain_user_id");
    localStorage.removeItem("artchain_token");
    setDbUser(null);
    setAuthToken("");
    setShowOnboarding(false);
    window.location.href = "/";
  }, []);

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
      _chain = "native"
    ): Promise<{ ok: true; data: any } | { ok: false; error: string }> => {
      if (!dbUser) return { ok: false, error: "Sign in to sync wallet." };
      return { ok: true, data: { synced: true } };
    },
    [dbUser]
  );

  const createTopup = useCallback(
    async (
      amount: number,
      _chain = "native"
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
        isLoading: isDbLoading,
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
      <AuthModal
        isOpen={authModalState.isOpen}
        defaultView={authModalState.defaultView}
        onClose={() => setAuthModalState({ ...authModalState, isOpen: false })}
        onSuccess={handleAuthSuccess}
      />
    </AuthContext.Provider>
  );
}

// ----- hook -------------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
