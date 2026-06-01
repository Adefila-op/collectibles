import type { ReactNode } from "react";

export function PhoneShell({ children, label }: { children: ReactNode; label?: string }) {
  // PhoneShell is only rendered on mobile (inside lg:hidden containers)
  // so lg: prefixes below would never apply - removed for clarity
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-background">
      {label && (
        <div className="sr-only">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
