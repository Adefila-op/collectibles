import type { ReactNode } from "react";
import { PhoneShell } from "./PhoneShell";
import { BottomNav } from "./BottomNav";
import heroChar from "@/assets/hero-character.png";
import { Sparkles, ShieldCheck, Link2 } from "lucide-react";

export function AppFrame({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-hero">
      {/* ambient blobs */}
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-accent/40 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(white 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_auto_1fr]">
        {/* Left marketing column (desktop) */}
        <aside className="hidden lg:block text-white animate-[fade-up_0.7s_cubic-bezier(.2,.8,.2,1)_both]">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur-md border border-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live on
            Base · Onchain provenance
          </div>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight">
            Buy real African art. <br />
            <span className="text-gradient">Proven onchain.</span>
          </h1>
          <p className="mt-4 max-w-md text-white/75">
            ArtChain stops reproductions and fakes. Every piece carries a signed onchain certificate
            from the original artist — buy, resell, or swap with proof.
          </p>
          <ul className="mt-7 space-y-3 text-sm">
            {[
              { icon: ShieldCheck, t: "Vault audit", d: "Physical inspection before funds release" },
              { icon: Link2, t: "Provenance chain", d: "Every owner and price, on-chain forever" },
              { icon: Sparkles, t: "Swap or sell", d: "Trade pieces or list to global collectors" },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex items-start gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 border border-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-medium">{t}</div>
                  <div className="text-white/60">{d}</div>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Phone */}
        <div className="relative flex flex-col items-center">
          <PhoneShell label={label}>
            <div className="flex h-full flex-col">
              <div className="flex-1">{children}</div>
              <BottomNav />
            </div>
          </PhoneShell>
        </div>

        {/* Right character column */}
        <aside className="relative hidden lg:flex items-center justify-center">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40 blur-3xl animate-glow" />
            <div
              className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 animate-spin-slow"
              style={{ borderStyle: "dashed" }}
            />
          </div>
          <img
            src={heroChar}
            alt="ArtChain mascot holding African artwork"
            width={520}
            height={520}
            className="relative w-[420px] animate-float drop-shadow-[0_30px_60px_rgba(0,90,255,0.45)]"
          />
          <div className="absolute -left-2 top-10 glass-dark rounded-2xl px-3 py-2 text-xs text-white/90 animate-[fade-up_1s_.4s_both]">
            ⛓ 0x4e3…a91f minted
          </div>
          <div className="absolute -right-2 bottom-16 glass-dark rounded-2xl px-3 py-2 text-xs text-white/90 animate-[fade-up_1s_.7s_both]">
            ✓ Vault audit passed
          </div>
        </aside>
      </div>
    </div>
  );
}
