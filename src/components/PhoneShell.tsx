import type { ReactNode } from "react";

export function PhoneShell({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="mx-auto w-full max-w-[400px] lg:max-w-[380px]">
      {label && (
        <div className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </div>
      )}
      <div className="relative rounded-[44px] border border-white/40 bg-mesh p-[3px] shadow-glow">
        <div className="relative overflow-hidden rounded-[42px] bg-background">
          {/* notch */}
          <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-[hsl(var(--ink))]" />
          <div className="relative flex h-[720px] flex-col">
            <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-medium text-foreground/70">
              <span>9:41</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/30" />
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
