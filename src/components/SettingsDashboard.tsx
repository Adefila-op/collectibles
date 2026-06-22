import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI } from "@/lib/api";
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine,
  User, Check, X, Pencil, BadgeCheck, Palette, Clock, ShoppingBag, Camera, Loader2
} from "lucide-react";
import { fmt } from "@/lib/art-data";

export function SettingsDashboard() {
  const { user } = useAuth();

  // Wallet states
  const [depositAmount, setDepositAmount] = useState("5000");
  const [withdrawAmount, setWithdrawAmount] = useState("1000");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [walletMsg, setWalletMsg] = useState("");

  // Username edit states
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameMsg, setUsernameMsg] = useState("");

  // Password edit states
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  // Avatar states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");

  if (!user) return null;

  const balance = (user.walletBalance ?? user.wallet_balance ?? 0);

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) { setWalletMsg("Enter a valid amount."); return; }
    setWalletMsg("Redirecting to Ramp...");
    setTimeout(() => setWalletMsg("Deposit flow coming soon — Ramp fiat integration will be connected here."), 1500);
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) { setWalletMsg("Enter a valid amount."); return; }
    if (!withdrawAccount) { setWalletMsg("Enter a destination bank account."); return; }
    setWalletMsg("Withdrawal initiated (integration pending).");
  };

  const handleSaveUsername = async () => {
    const trimmed = newUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    if (!trimmed || trimmed.length < 3) {
      setUsernameMsg("Username must be at least 3 characters (letters, numbers, _, .)");
      return;
    }
    try {
      await userAPI.update(user.id, { username: trimmed });
      setUsernameMsg("Username updated!");
      setEditingUsername(false);
      setTimeout(() => window.location.reload(), 800);
    } catch (err: any) {
      setUsernameMsg(err.message || "Failed to update username. Try again.");
      setEditingUsername(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword || newPassword.length < 6) {
      setPasswordMsg("Please enter current password and a new password (min 6 chars).");
      return;
    }
    try {
      await userAPI.updatePassword(user.id, currentPassword, newPassword);
      setPasswordMsg("Password updated successfully!");
      setEditingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordMsg(err.message || "Failed to update password. Try again.");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarMsg("Please upload a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg("Image size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;

      setIsUploadingAvatar(true);
      setAvatarMsg("");

      try {
        await userAPI.updateAvatar(user.id, base64);
        setAvatarMsg("Profile picture updated!");
        setTimeout(() => window.location.reload(), 1000);
      } catch (err: any) {
        setAvatarMsg(err.message || "Failed to upload image.");
      } finally {
        setIsUploadingAvatar(false);
      }
    };
    reader.onerror = () => setAvatarMsg("Error reading file.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold mb-6">Account Settings</h2>

        <div className="space-y-0 rounded-2xl border border-slate-100 overflow-hidden">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center p-6 border-b border-slate-100">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm group-hover:opacity-75 transition" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm group-hover:bg-slate-200 transition">
                  <User size={32} className="text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                {isUploadingAvatar ? (
                  <Loader2 className="text-white animate-spin" size={24} />
                ) : (
                  <Camera className="text-white" size={24} />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
              />
            </div>
            {avatarMsg && (
              <p className={`text-xs mt-3 ${avatarMsg.includes("Failed") || avatarMsg.includes("Please") || avatarMsg.includes("Error") ? "text-red-500" : "text-emerald-600"}`}>
                {avatarMsg}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-2">Click to change profile picture</p>
          </div>

          {/* Full Name */}
          <div className="flex items-start gap-4 p-5 border-b border-slate-100">
            <User className="text-slate-400 mt-0.5" size={18} />
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Full Name</p>
              <p className="text-sm font-medium text-slate-900">
                {(user.firstName || user.first_name) && (user.lastName || user.last_name)
                  ? `${user.firstName ?? user.first_name} ${user.lastName ?? user.last_name}`
                  : (user.name || "—")}
              </p>
            </div>
          </div>

          {/* Username — editable */}
          <div className="flex items-start gap-4 p-5 border-b border-slate-100">
            <span className="text-slate-400 font-medium text-lg mt-0.5">@</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Username</p>
              {editingUsername ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="your_username"
                    autoFocus
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary"
                  />
                  <button onClick={handleSaveUsername} className="bg-primary text-white rounded-lg p-1.5 hover:bg-primary/90">
                    <Check size={16} />
                  </button>
                  <button onClick={() => { setEditingUsername(false); setUsernameMsg(""); }} className="bg-slate-100 text-slate-500 rounded-lg p-1.5 hover:bg-slate-200">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">
                    {user.username ? `@${user.username}` : "Not set"}
                  </p>
                  <button
                    onClick={() => { setEditingUsername(true); setNewUsername(user.username || ""); setUsernameMsg(""); }}
                    className="text-primary hover:bg-primary/10 rounded p-1 transition"
                    title="Edit username"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              {usernameMsg && (
                <p className={`text-xs mt-1.5 ${usernameMsg.includes("must") ? "text-red-500" : "text-emerald-600"}`}>
                  {usernameMsg}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-4 p-5 border-b border-slate-100">
            <span className="text-slate-400 font-medium text-lg mt-0.5">✉</span>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</p>
              <p className="text-sm font-medium text-slate-900">{user.email || "—"}</p>
            </div>
          </div>

          {/* Password — editable */}
          <div className="flex items-start gap-4 p-5">
            <span className="text-slate-400 font-medium text-lg mt-0.5">🔒</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Password</p>
              {editingPassword ? (
                <div className="flex flex-col gap-2 mt-1">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="New Password"
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary"
                    />
                    <button onClick={handleSavePassword} className="bg-primary text-white rounded-lg p-1.5 hover:bg-primary/90">
                      <Check size={16} />
                    </button>
                    <button onClick={() => { setEditingPassword(false); setPasswordMsg(""); setCurrentPassword(""); setNewPassword(""); }} className="bg-slate-100 text-slate-500 rounded-lg p-1.5 hover:bg-slate-200">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">
                    ••••••••
                  </p>
                  <button
                    onClick={() => { setEditingPassword(true); setPasswordMsg(""); }}
                    className="text-primary hover:bg-primary/10 rounded p-1 transition"
                    title="Change password"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              {passwordMsg && (
                <p className={`text-xs mt-1.5 ${passwordMsg.includes("Failed") || passwordMsg.includes("Please") || passwordMsg.includes("Incorrect") ? "text-red-500" : "text-emerald-600"}`}>
                  {passwordMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Account type CTA */}
        {(() => {
          const userType = user.userType ?? user.user_type;
          const artistStatus = user.artistStatus ?? user.artist_status;
          if (userType === "creator") {
            const isApproved = artistStatus === "approved";
            const isPending = artistStatus === "pending";
            return (
              <div className="mt-8 flex items-center gap-4 bg-primary/5 border border-primary/10 rounded-2xl p-5">
                {isPending ? <Clock className="text-amber-500 shrink-0" size={28} /> : <BadgeCheck className="text-primary shrink-0" size={28} />}
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                    {isPending ? "Verification Pending" : "Creator Dashboard"}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {isPending
                      ? "Your creator account is under review. You'll get notified once approved."
                      : "Access your artworks, analytics and creator tools."}
                  </p>
                </div>
                {isApproved && (
                  <Link to="/creator" className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-primary/90 transition">
                    Dashboard
                  </Link>
                )}
              </div>
            );
          }
          // Collector — show become creator CTA
          if (artistStatus === "collector" || artistStatus === "pending") {
            return (
              <div className="mt-8 flex items-center gap-4 bg-primary/5 border border-primary/10 rounded-2xl p-5">
                <BadgeCheck className="text-primary shrink-0" size={28} />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 mb-0.5">Become a Creator</h4>
                  <p className="text-xs text-slate-600">
                    {artistStatus === "pending"
                      ? "Your creator application is under review."
                      : "Apply to list and sell your artworks on the platform."}
                  </p>
                </div>
                {artistStatus === "collector" && (
                  <Link to="/list" className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-primary/90 transition">
                    Apply
                  </Link>
                )}
              </div>
            );
          }
          return null;
        })()}

        {/* Admin Access CTA */}
        {user.isAdmin && (
          <Link to="/admin" className="block mt-6 flex items-center gap-4 bg-slate-900/5 border border-slate-900/10 rounded-2xl p-5 hover:bg-slate-900/10 transition group">
            <div className="bg-slate-900 text-white p-2 rounded-xl group-hover:scale-105 transition-transform">
              <span className="font-bold font-mono text-sm">ADMIN</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 mb-0.5">Admin Control Panel</h4>
              <p className="text-xs text-slate-600">Review creator applications and manage the platform.</p>
            </div>
            <div className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm group-hover:bg-slate-800 transition">
              Open Panel
            </div>
          </Link>
        )}
      </div>

      {/* Wallet Management Section */}
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold mb-6">Wallet Management</h2>

        <div className="bg-[linear-gradient(135deg,#1a43d4,#0b6fff)] rounded-2xl p-6 text-white mb-6">
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">Available Balance</p>
          <p className="text-3xl font-black mb-3">{fmt(balance)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Deposit */}
          <div className="border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <ArrowDownToLine size={18} className="text-emerald-500" />
              <h3 className="font-semibold text-sm">Deposit</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Amount</label>
                <input
                  type="number"
                  value={depositAmount}
                  min="1"
                  step="1"
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <button onClick={handleDeposit} className="w-full bg-slate-950 text-white font-semibold text-sm rounded-xl py-2 hover:bg-slate-800 transition">
                Fund Wallet
              </button>
            </div>
          </div>

          {/* Withdraw */}
          <div className="border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <ArrowUpFromLine size={18} className="text-amber-500" />
              <h3 className="font-semibold text-sm">Withdraw</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Amount</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  min="1"
                  step="1"
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="1000"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Bank Account Number</label>
                <input
                  type="text"
                  value={withdrawAccount}
                  onChange={e => setWithdrawAccount(e.target.value)}
                  placeholder="0123456789"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary font-mono text-xs"
                />
              </div>
              <button onClick={handleWithdraw} className="w-full bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl py-2 hover:bg-slate-50 transition">
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {walletMsg && (
          <div className="mt-4 p-3 bg-primary/5 border border-primary/10 text-primary text-xs font-medium rounded-xl">
            {walletMsg}
          </div>
        )}
      </div>
    </div>
  );
}
