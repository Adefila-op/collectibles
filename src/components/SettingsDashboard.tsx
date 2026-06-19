import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePrivy, useWallets, useExportWallet, useSetWalletRecovery } from "@privy-io/react-auth";
import { userAPI } from "@/lib/api";
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, Copy, ExternalLink,
  User, Key, Lock, Check, X, Pencil, BadgeCheck
} from "lucide-react";
import { fmt } from "@/lib/art-data";

export function SettingsDashboard() {
  const { user } = useAuth();
  const { exportWallet } = useExportWallet();
  const { setWalletRecovery } = useSetWalletRecovery();

  // Wallet states
  const [depositAmount, setDepositAmount] = useState("0.5");
  const [withdrawAmount, setWithdrawAmount] = useState("0.1");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [walletMsg, setWalletMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Username edit states
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameMsg, setUsernameMsg] = useState("");

  // Password reset state
  const [resetMsg, setResetMsg] = useState("");

  if (!user) return null;

  const balance = (user.walletBalance ?? user.wallet_balance ?? 0);
  const walletAddr = user.walletAddress ?? user.wallet_address ?? "";

  const copyAddress = () => {
    if (walletAddr) {
      navigator.clipboard.writeText(walletAddr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) { setWalletMsg("Enter a valid amount."); return; }
    setWalletMsg("Redirecting to Privy on-ramp...");
    setTimeout(() => setWalletMsg("Deposit flow coming soon — Privy fiat on-ramp will be connected here."), 1500);
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) { setWalletMsg("Enter a valid amount."); return; }
    if (!withdrawAddress) { setWalletMsg("Enter a destination wallet address."); return; }
    setWalletMsg("Withdrawal initiated (integration pending Solana web3.js).");
  };

  const handleExportWallet = async () => {
    try {
      setWalletMsg("");
      await exportWallet();
    } catch (err: any) {
      console.warn("Export wallet error:", err);
      setWalletMsg(err.message || "Failed to export wallet. You may not have an embedded wallet yet.");
    }
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

  const handlePasswordReset = async () => {
    try {
      setResetMsg("");
      await setWalletRecovery();
    } catch (e: any) {
      console.warn("Recovery setup error:", e);
      setResetMsg(e.message || "Failed to configure recovery. You may not have an embedded wallet yet.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold mb-6">Account Settings</h2>

        <div className="space-y-0 rounded-2xl border border-slate-100 overflow-hidden">
          {/* Full Name */}
          <div className="flex items-start gap-4 p-5 border-b border-slate-100">
            <User className="text-slate-400 mt-0.5" size={18} />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Full Name</p>
              <p className="text-sm font-medium text-slate-900">{user.name || "—"}</p>
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

          {/* Wallet */}
          <div className="flex items-start gap-4 p-5">
            <Wallet className="text-slate-400 mt-0.5" size={18} />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Solana Wallet</p>
              <p className="text-xs font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded inline-block">
                {walletAddr || "No embedded wallet yet"}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={handleExportWallet} className="flex items-center gap-2 text-sm font-semibold border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition">
            <Key size={16} className="text-slate-500" /> Export Wallet
          </button>
          <button onClick={handlePasswordReset} className="flex items-center gap-2 text-sm font-semibold border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition">
            <Lock size={16} className="text-slate-500" /> Password & Recovery
          </button>
        </div>

        {resetMsg && (
          <div className="mt-3 text-xs font-medium text-primary bg-primary/10 rounded-lg px-4 py-2">
            {resetMsg}
          </div>
        )}

        {/* Become a Creator CTA */}
        {(user.artistStatus === "collector" || user.artistStatus === "pending") && (
          <div className="mt-8 flex items-center gap-4 bg-primary/5 border border-primary/10 rounded-2xl p-5">
            <BadgeCheck className="text-primary shrink-0" size={28} />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 mb-0.5">Become a Creator</h4>
              <p className="text-xs text-slate-600">
                {user.artistStatus === "pending"
                  ? "Your creator application is under review."
                  : "Apply to list and sell your artworks on the platform."}
              </p>
            </div>
            {user.artistStatus === "collector" && (
              <Link to="/list" className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-primary/90 transition">
                Apply
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Wallet Management Section */}
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold mb-6">Wallet Management</h2>

        <div className="bg-[linear-gradient(135deg,#1a43d4,#0b6fff)] rounded-2xl p-6 text-white mb-6">
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">Available Balance</p>
          <p className="text-3xl font-black mb-3">{fmt(balance)}</p>
          {walletAddr && (
            <div className="flex items-center gap-2 font-mono text-xs text-white/80 bg-white/10 w-fit px-3 py-1.5 rounded-lg">
              <span>{walletAddr.slice(0, 8)}...{walletAddr.slice(-6)}</span>
              <button onClick={copyAddress} title="Copy address" className="hover:text-white transition">
                {copied ? "✓" : <Copy size={14} />}
              </button>
              <a href={`https://solscan.io/account/${walletAddr}`} target="_blank" rel="noreferrer" className="hover:text-white transition">
                <ExternalLink size={14} />
              </a>
            </div>
          )}
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
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Amount (SOL)</label>
                <input
                  type="number"
                  value={depositAmount}
                  min="0.01"
                  step="0.1"
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="0.5"
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
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Amount (SOL)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  min="0.01"
                  step="0.1"
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="0.1"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Destination Address</label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={e => setWithdrawAddress(e.target.value)}
                  placeholder="Solana wallet address"
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
