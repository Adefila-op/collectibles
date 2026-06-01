import type { ReactNode } from "react";
import { PhoneShell } from "./PhoneShell";
import { BottomNav } from "./BottomNav";
import heroCharacter from "@/assets/hero-character.png";
import { Instagram, Menu, ShieldCheck, Twitter } from "lucide-react";

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
      <div className="min-h-screen bg-background text-foreground lg:bg-[#0759e8]">
        {/* Mobile view */}
        <div className="lg:hidden">
          <PhoneShell label={label}>
            <div className="flex min-h-dvh flex-col">
              <main className="flex-1">{children}</main>
              <BottomNav />
            </div>
          </PhoneShell>
        </div>
        {/* Desktop view - custom layout */}
        <div className="hidden min-h-screen lg:block">{desktop}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:bg-[#0759e8]">
      {/* Mobile view */}
      <div className="lg:hidden">
        <PhoneShell label={label}>
          <div className="flex min-h-dvh flex-col">
            <main className="flex-1">{children}</main>
            <BottomNav />
          </div>
        </PhoneShell>
      </div>

      {/* Desktop view - default sidebar layout */}
      <div className="hidden min-h-screen grid-cols-[320px_minmax(0,1fr)] lg:grid">
        <aside className="relative min-h-screen overflow-hidden bg-[#0b6fff] p-8 text-white shadow-[0_30px_90px_rgba(0,24,95,0.35)]">
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

          <div className="relative z-10 mt-28">
            <div>
              <h1 className="font-display text-5xl font-black leading-[0.95] text-white">
                Collect Art
                <span className="block text-cyan-200">with proof.</span>
              </h1>
              <div className="mt-16 text-center font-display text-lg font-black leading-tight text-white">
                <div>Say "5/10000"</div>
                <div>Proofed</div>
              </div>
            </div>

            <div className="relative mt-12">
              <div className="absolute -inset-6 rounded-full bg-cyan-200/25 blur-3xl" />
              <img
                src={heroCharacter}
                alt="ArtChain character holding African artwork"
                loading="eager"
                decoding="async"
                className="relative z-10 mx-auto w-64 animate-float drop-shadow-[0_34px_40px_rgba(0,25,96,0.38)]"
              />
              <div className="absolute bottom-5 left-1/2 h-6 w-44 -translate-x-1/2 rounded-full bg-[#03245f]/50 blur-md" />
            </div>
          </div>
        </aside>

        <main className="min-h-screen overflow-y-auto bg-background">
          <div className="mx-auto w-full max-w-5xl px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
