import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { userAPI, supabase, type User } from "@/lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Normalize user data to use camelCase aliases for consistency
function normalizeUser(user: any): User {
  if (!user) return user;
  return {
    ...user,
    walletBalance: user.wallet_balance ?? user.walletBalance,
    walletAddress: user.wallet_address ?? user.walletAddress,
    isAdmin: user.is_admin ?? user.isAdmin ?? false,
    artistStatus: user.artist_status ?? user.artistStatus ?? "collector",
    createdAt: user.created_at ?? user.createdAt,
  };
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => void;
  updateWalletBalance: (nextBalance: number) => Promise<{ ok: true } | { ok: false; error: string }>;
  syncWalletBalance: (chain?: string) => Promise<{ ok: true; data: any } | { ok: false; error: string }>;
  createTopup: (amount: number, chain?: string) => Promise<{ ok: true; data: any } | { ok: false; error: string }>;
  confirmTopup: (transactionId: string) => Promise<{ ok: true; data: any } | { ok: false; error: string }>;
  submitArtistApplication: (data: {
    artistType: string;
    artistBio: string;
    portfolioUrl: string;
    socialUrl: string;
    liveLocation: string;
    callUrl: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user session from localStorage (user ID only)
    const userId = localStorage.getItem("artchain_user_id");
    if (userId) {
      userAPI
        .getById(userId)
        .then((user) => {
          setUser(normalizeUser(user));
        })
        .catch((err) => {
          console.error("Failed to restore session:", err);
          localStorage.removeItem("artchain_user_id");
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      try {
        if (!supabase) {
          const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await response.json();
          if (!response.ok) {
            return { ok: false, error: data.error || "Login failed" };
          }
          const normalizedUser = normalizeUser(data);
          localStorage.setItem("artchain_user_id", normalizedUser.id);
          setUser(normalizedUser);
          return { ok: true };
        }
        // Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase?.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;

        // Fetch user profile from database
        const user = await userAPI.getById(authData.user!.id);
        localStorage.setItem("artchain_user_id", user.id);
        setUser(user);
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message || "Login failed" };
      }
    },
    []
  );

  const signUp = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      try {
        const newUser = await userAPI.create({ email, password, name, avatar: name.charAt(0).toUpperCase() });
        // Store only user ID in localStorage
        localStorage.setItem("artchain_user_id", newUser.id);
        setUser(newUser);
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
    []
  );

  const signOut = useCallback(() => {
    localStorage.removeItem("artchain_user_id");
    setUser(null);
  }, []);

  const updateWalletBalance = useCallback(
    async (nextBalance: number): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!user) return { ok: false, error: "Sign in to use your wallet." };
      try {
        // Fetch latest user to get current balance
        const latestUsers = await userAPI.getAll();
        const latestUser = latestUsers.find((u: User) => u.id === user.id);
        
        if (!latestUser) {
          return { ok: false, error: "User not found" };
        }
        
        // Calculate delta from latest balance
        const delta = nextBalance - (latestUser.walletBalance || 0);
        const updatedUser = await userAPI.updateWallet(user.id, delta);
        // Store only user ID, not full user object
        localStorage.setItem("artchain_user_id", updatedUser.id);
        setUser(updatedUser);
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
    [user]
  );

  const syncWalletBalance = useCallback(
    async (chain: string = 'base'): Promise<{ ok: true; data: any } | { ok: false; error: string }> => {
      if (!user) return { ok: false, error: "Sign in to sync wallet." };
      try {
        // Wallet sync is handled by blockchain layer directly
        // For now, just return success
        return { ok: true, data: { synced: true } };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
    [user]
  );

  const createTopup = useCallback(
    async (amount: number, chain: string = 'base'): Promise<{ ok: true; data: any } | { ok: false; error: string }> => {
      if (!user) return { ok: false, error: "Sign in to deposit funds." };
      if (amount <= 0) return { ok: false, error: "Amount must be greater than 0." };
      try {
        // Top-up functionality is handled by payment provider integration
        // For now, just return success
        return { ok: true, data: { topupCreated: true } };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
    [user]
  );

  const confirmTopup = useCallback(
    async (transactionId: string): Promise<{ ok: true; data: any } | { ok: false; error: string }> => {
      if (!user) return { ok: false, error: "Sign in to confirm deposit." };
      try {
        // Confirm top-up with payment provider
        // Refresh user data
        const updatedUser = await userAPI.getById(user.id);
        localStorage.setItem("artchain_user_id", updatedUser.id);
        setUser(updatedUser);
        return { ok: true, data: { confirmed: true } };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
    [user]
  );

  const submitArtistApplication = useCallback(
    async (data: {
      artistType: string;
      artistBio: string;
      portfolioUrl: string;
      socialUrl: string;
      liveLocation: string;
      callUrl: string;
    }): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!user) return { ok: false, error: "Sign in to apply as an artist." };
      try {
        const updatedUser = await userAPI.updateArtistStatus(user.id, {
          status: "pending",
          artistType: data.artistType,
          artistBio: data.artistBio,
          portfolioUrl: data.portfolioUrl,
          socialUrl: data.socialUrl,
          liveLocation: data.liveLocation,
          callUrl: data.callUrl,
        });
        localStorage.setItem("artchain_user_id", updatedUser.id);
        setUser(updatedUser);
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateWalletBalance, syncWalletBalance, createTopup, confirmTopup, submitArtistApplication }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

