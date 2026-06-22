import { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Palette,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  AtSign,
  ChevronDown,
  BadgeCheck,
  Eye,
  EyeOff,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: "login" | "register";
  onSuccess: (data: any) => void;
}

type View = "login" | "type-select" | "register";
type UserType = "creator" | "collector";

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

export default function AuthModal({
  isOpen,
  onClose,
  defaultView = "login",
  onSuccess,
}: AuthModalProps) {
  const [view, setView] = useState<View>(
    defaultView === "register" ? "type-select" : "login"
  );
  const [userType, setUserType] = useState<UserType>("collector");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [genderOpen, setGenderOpen] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setView(defaultView === "register" ? "type-select" : "login");
      setError("");
    }
  }, [isOpen, defaultView]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (regPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (regPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          firstName,
          lastName,
          username: username.toLowerCase().replace(/[^a-z0-9_.]/g, ""),
          gender: gender || null,
          userType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      onSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="auth-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="auth-modal-card">
        {/* Close button */}
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {/* ── LOGIN VIEW ── */}
        {view === "login" && (
          <div className="auth-modal-inner">
            <div className="auth-modal-logo">
              <div className="auth-modal-logo-mark">C</div>
            </div>
            <h2 className="auth-modal-title">Welcome back</h2>
            <p className="auth-modal-subtitle">Sign in to your COllectible account</p>

            <form onSubmit={handleLogin} className="auth-modal-form">
              {error && <div className="auth-error">{error}</div>}

              <div className="auth-field">
                <label>Email</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="auth-submit-btn">
                {isLoading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div className="auth-modal-footer">
              Don't have an account?{" "}
              <button
                onClick={() => { setView("type-select"); setError(""); }}
                className="auth-link"
              >
                Sign up
              </button>
            </div>
          </div>
        )}

        {/* ── TYPE SELECTOR VIEW ── */}
        {view === "type-select" && (
          <div className="auth-modal-inner">
            <div className="auth-modal-logo">
              <div className="auth-modal-logo-mark">C</div>
            </div>
            <h2 className="auth-modal-title">Join COllectible</h2>
            <p className="auth-modal-subtitle">I want to join as a…</p>

            <div className="auth-type-grid">
              {/* Collector card */}
              <button
                type="button"
                className={`auth-type-card ${userType === "collector" ? "selected" : ""}`}
                onClick={() => setUserType("collector")}
              >
                <div className="auth-type-icon collector">
                  <ShoppingBag size={28} />
                </div>
                <h3>Collector</h3>
                <p>Discover, buy, and own verified artworks. Trade and build your collection.</p>
                {userType === "collector" && (
                  <div className="auth-type-check"><BadgeCheck size={16} /> Selected</div>
                )}
              </button>

              {/* Creator card */}
              <button
                type="button"
                className={`auth-type-card ${userType === "creator" ? "selected" : ""}`}
                onClick={() => setUserType("creator")}
              >
                <div className="auth-type-icon creator">
                  <Palette size={28} />
                </div>
                <h3>Creator</h3>
                <p>List and sell your artworks. Earn royalties. Requires admin verification.</p>
                {userType === "creator" && (
                  <div className="auth-type-check"><BadgeCheck size={16} /> Selected</div>
                )}
              </button>
            </div>

            {userType === "creator" && (
              <div className="auth-creator-note">
                <BadgeCheck size={14} className="shrink-0 mt-0.5" />
                <span>Creator accounts require admin review before publishing artworks. You'll have full collector access immediately.</span>
              </div>
            )}

            <button
              type="button"
              className="auth-submit-btn"
              onClick={() => setView("register")}
            >
              Continue as {userType === "creator" ? "Creator" : "Collector"} <ArrowRight size={16} />
            </button>

            <div className="auth-modal-footer">
              Already have an account?{" "}
              <button onClick={() => { setView("login"); setError(""); }} className="auth-link">
                Sign in
              </button>
            </div>
          </div>
        )}

        {/* ── REGISTER VIEW ── */}
        {view === "register" && (
          <div className="auth-modal-inner">
            <button
              type="button"
              className="auth-back-btn"
              onClick={() => { setView("type-select"); setError(""); }}
            >
              <ArrowLeft size={15} /> Back
            </button>

            <div className="auth-type-badge">
              {userType === "creator" ? (
                <><Palette size={13} /> Creator account</>
              ) : (
                <><ShoppingBag size={13} /> Collector account</>
              )}
            </div>

            <h2 className="auth-modal-title">Create your account</h2>
            <p className="auth-modal-subtitle">Tell us a bit about yourself</p>

            <form onSubmit={handleRegister} className="auth-modal-form">
              {error && <div className="auth-error">{error}</div>}

              {/* Name row */}
              <div className="auth-field-row">
                <div className="auth-field">
                  <label>First Name</label>
                  <div className="auth-input-wrap">
                    <UserIcon size={16} className="auth-input-icon" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Adaeze"
                      required
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label>Last Name</label>
                  <div className="auth-input-wrap">
                    <UserIcon size={16} className="auth-input-icon" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Okafor"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Username */}
              <div className="auth-field">
                <label>Username <span className="auth-label-hint">— shown on platform</span></label>
                <div className="auth-input-wrap">
                  <AtSign size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))
                    }
                    placeholder="adaeze.art"
                    required
                    minLength={3}
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="auth-field">
                <label>Gender <span className="auth-label-hint">— optional</span></label>
                <div className="auth-select-wrap" onClick={() => setGenderOpen((v) => !v)}>
                  <span className={gender ? "auth-select-val" : "auth-select-placeholder"}>
                    {gender || "Select gender"}
                  </span>
                  <ChevronDown size={15} className={`auth-select-chevron ${genderOpen ? "open" : ""}`} />
                  {genderOpen && (
                    <div className="auth-select-dropdown">
                      {GENDERS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`auth-select-option ${gender === g ? "selected" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setGender(g);
                            setGenderOpen(false);
                          }}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="auth-field">
                <label>Email</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password row */}
              <div className="auth-field-row">
                <div className="auth-field">
                  <label>Password</label>
                  <div className="auth-input-wrap">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 8 chars"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowRegPassword((v) => !v)}
                    >
                      {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="auth-field">
                  <label>Confirm</label>
                  <div className="auth-input-wrap">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="auth-submit-btn">
                {isLoading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>Create Account <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div className="auth-modal-footer">
              Already have an account?{" "}
              <button onClick={() => { setView("login"); setError(""); }} className="auth-link">
                Sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
