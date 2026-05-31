import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  getSession,
  createSession,
  clearSession,
  createUser,
  verifyCredentials,
  updateUserWalletBalance,
  applyAsArtist,
  type User,
} from "@/lib/db";

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
  updateWalletBalance: (nextBalance: number) => { ok: true } | { ok: false; error: string };
  submitArtistApplication: (data: {
    artistType: string;
    artistBio: string;
    portfolioUrl: string;
    socialUrl: string;
    liveLocation: string;
    callUrl: string;
  }) => { ok: true } | { ok: false; error: string };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const result = getSession();
    setUser(result?.user ?? null);
    setIsLoading(false);
  }, []);

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const result = verifyCredentials(email, password);
      if (!result.ok) return result;
      createSession(result.user);
      setUser(result.user);
      return { ok: true };
    },
    []
  );

  const signUp = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const result = createUser(name, email, password);
      if (!result.ok) return result;
      createSession(result.user);
      setUser(result.user);
      return { ok: true };
    },
    []
  );

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const updateWalletBalance = useCallback(
    (nextBalance: number): { ok: true } | { ok: false; error: string } => {
      if (!user) return { ok: false, error: "Sign in to use your wallet." };
      const result = updateUserWalletBalance(user.id, nextBalance);
      if (!result.ok) return result;
      setUser(result.user);
      return { ok: true };
    },
    [user]
  );

  const submitArtistApplication = useCallback(
    (data: {
      artistType: string;
      artistBio: string;
      portfolioUrl: string;
      socialUrl: string;
      liveLocation: string;
      callUrl: string;
    }): { ok: true } | { ok: false; error: string } => {
      if (!user) return { ok: false, error: "Sign in to apply as an artist." };
      const result = applyAsArtist(user.id, data);
      if (!result.ok) return result;
      setUser(result.user);
      return { ok: true };
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateWalletBalance, submitArtistApplication }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
