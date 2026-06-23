import { useState } from "react";
import "./OnboardingModal.css";

interface OnboardingModalProps {
  userId: string;
  token: string;
  onComplete: (user: any) => void;
}

const API_BASE = '/api';

export default function OnboardingModal({ userId, token, onComplete }: OnboardingModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameChange = (val: string) => {
    // Only allow lowercase alphanumeric + underscore
    setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ""));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/onboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), username: username.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      onComplete(data);
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-icon">🎨</div>
        <h1 className="onboarding-title">Welcome to C00lectiblles</h1>
        <p className="onboarding-subtitle">
          Let's set up your profile before you explore the marketplace.
        </p>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="onboarding-field">
            <label htmlFor="ob-name">Full Name</label>
            <input
              id="ob-name"
              type="text"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              maxLength={80}
              autoFocus
            />
          </div>

          <div className="onboarding-field">
            <label htmlFor="ob-username">
              Username
              <span className="onboarding-username-hint">lowercase, letters, numbers & _ only</span>
            </label>
            <div className="onboarding-username-wrapper">
              <span className="onboarding-at">@</span>
              <input
                id="ob-username"
                type="text"
                placeholder="your_handle"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                maxLength={30}
              />
            </div>
          </div>

          {error && <p className="onboarding-error">{error}</p>}

          <button
            type="submit"
            className="onboarding-btn"
            disabled={isLoading || !name.trim() || !username.trim()}
          >
            {isLoading ? (
              <span className="onboarding-spinner" />
            ) : (
              "Get Started →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
