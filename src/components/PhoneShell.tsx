import type { ReactNode } from "react";

export function PhoneShell({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-background lg:my-8 lg:min-h-[812px] lg:overflow-hidden lg:rounded-[34px] lg:shadow-[0_28px_80px_rgba(0,0,0,0.35)] lg:ring-1 lg:ring-white/15">
      {label && (
        <div className="sr-only">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
