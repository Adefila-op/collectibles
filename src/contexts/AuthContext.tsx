import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { userAPI, walletAPI, type User } from "@/lib/api";

// Normalize user data to use camelCase aliases for consistency
function normalizeUser(user: any): User {
  if (!user) return user;
  return {
    ...user,
    walletBalance: user.wallet_balance ?? user.walletBalance,
    walletAddress: user.wallet_address ?? user.walletAddress,
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
    const sessionStr = localStorage.getItem("artchain_session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setUser(normalizeUser(session.user));
      } catch (err) {
        console.error("Failed to load session:", err);
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      try {
        // Use server-side login endpoint for secure password verification
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          return { ok: false, error: error.error || 'Login failed' };
        }
        
        const user = normalizeUser(await response.json());
        localStorage.setItem("artchain_session", JSON.stringify({ user }));
        setUser(user);
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message };
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
        localStorage.setItem("artchain_session", JSON.stringify({ user: newUser }));
        setUser(newUser);
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
    []
  );

  const signOut = useCallback(() => {
    localStorage.removeItem("artchain_session");
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
        localStorage.setItem("artchain_session", JSON.stringify({ user: updatedUser }));
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
        const syncData = await walletAPI.syncBalance(user.id, chain);
        return { ok: true, data: syncData };
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
        const topupData = await walletAPI.createTopup(user.id, amount, chain, 'stripe');
        return { ok: true, data: topupData };
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
        const confirmData = await walletAPI.confirmTopup(transactionId);
        // Refresh user data
        const updatedUser = await userAPI.getById(user.id);
        localStorage.setItem("artchain_session", JSON.stringify({ user: updatedUser }));
        setUser(updatedUser);
        return { ok: true, data: confirmData };
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
        localStorage.setItem("artchain_session", JSON.stringify({ user: updatedUser }));
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
