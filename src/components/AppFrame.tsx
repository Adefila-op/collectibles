import type { ReactNode } from "react";
import { PhoneShell } from "./PhoneShell";
import { BottomNav } from "./BottomNav";
import heroCharacter from "@/assets/hero-character.png";
import { Instagram, Menu, ShieldCheck, Twitter, Wallet } from "lucide-react";

export function AppFrame({
  children,
  label,
  desktop,
}: {
  children: ReactNode;
  label?: string;
  desktop?: ReactNode;
}) {
  if (desktop) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="lg:hidden">
          <PhoneShell label={label}>
            <div className="flex min-h-dvh flex-col">
              <main className="flex-1">{children}</main>
              <BottomNav />
            </div>
          </PhoneShell>
        </div>
        <div className="hidden min-h-screen lg:block">{desktop}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:bg-[#0759e8]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:gap-10 lg:px-8">
        <aside className="relative hidden min-h-[640px] overflow-hidden rounded-[36px] bg-[#0b6fff] p-8 text-white shadow-[0_30px_90px_rgba(0,24,95,0.35)] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.26),transparent_15%),radial-gradient(circle_at_78%_24%,rgba(110,193,255,0.35),transparent_20%),linear-gradient(135deg,#0f7cff,#064fd1)]" />
          <div className="absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute left-8 top-24 grid h-14 w-14 place-items-center rounded-full bg-white/15 shadow-soft">
            <ShieldCheck className="h-7 w-7 text-cyan-100" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="font-display text-xl font-black">ARTCHAIN</div>
            <div className="flex items-center gap-4 text-white/85">
              <Instagram className="h-4 w-4" />
              <Twitter className="h-4 w-4" />
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/explore"
                className="rounded-full border border-white/70 px-5 py-2 text-xs font-bold text-white transition hover:bg-white hover:text-primary"
              >
                Shop Art
              </a>
              <Menu className="h-6 w-6" />
            </div>
          </div>

          <div className="relative z-10 mt-28 grid grid-cols-[minmax(0,1fr)_320px] items-center gap-8">
            <div>
              <h1 className="font-display text-6xl font-black leading-[0.95] text-white">
                Collect Art
                <span className="block text-cyan-200">with proof.</span>
              </h1>
              <a
                href="/profile"
                className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-white bg-white px-5 py-2.5 text-xs font-black text-primary shadow-soft transition hover:bg-cyan-100"
              >
                <Wallet className="h-4 w-4" /> Connect Wallet
              </a>

              <div className="mt-16 text-center font-display text-lg font-black leading-tight text-white">
                <div>Say "5/10000"</div>
                <div>Proofed</div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-cyan-200/25 blur-3xl" />
              <img
                src={heroCharacter}
                alt="ArtChain character holding African artwork"
                className="relative z-10 w-full animate-float drop-shadow-[0_34px_40px_rgba(0,25,96,0.38)]"
              />
              <div className="absolute bottom-5 left-1/2 h-6 w-44 -translate-x-1/2 rounded-full bg-[#03245f]/50 blur-md" />
            </div>
          </div>
        </aside>

        <PhoneShell label={label}>
          <div className="flex min-h-dvh flex-col lg:min-h-[812px]">
            <main className="flex-1">{children}</main>
            <BottomNav />
          </div>
        </PhoneShell>
      </div>
    </div>
  );
}
