import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { PhoneShell } from "./PhoneShell";
import { BottomNav } from "./BottomNav";
import PillNav from "./PillNav";
import logo from "@/assets/collectible-logo.svg";
import { LogOut, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { BuyArtModalDesktop } from "./modals/BuyArtModalDesktop";
import { OfferModalDesktop } from "./modals/OfferModalDesktop";
import { SwapModalDesktop } from "./modals/SwapModalDesktop";
import { ListingModalDesktop } from "./modals/ListingModalDesktop";
import { TopUpModal } from "./modals/TopUpModal";
import { useAuth } from "@/contexts/AuthContext";

function DesktopTopNav() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Explore", href: "/explore" },
    { label: "Swap", href: "/swap" },
    { label: "Portfolio", href: "/explore?section=portfolio" },
  ];

  const rightSlot = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {user?.artistStatus === "approved" && (
        <button
          type="button"
          onClick={() => setListingModalOpen(true)}
          className="pill-nav-cta"
          style={{ background: "#1a43d4", color: "#fff", gap: 6, display: "inline-flex", alignItems: "center" }}
        >
          <Plus size={14} />
          List
        </button>
      )}
      {user ? (
        <>
          <Link
            to="/explore?section=settings"
            className="pill-nav-avatar"
            style={{ background: "#1a43d4", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
          >
            {user.avatar || (user.name ? user.name.slice(0, 2).toUpperCase() : "?")}
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="pill-nav-ghost"
            title="Sign out"
            style={{ color: "#64748b", padding: "0 10px" }}
          >
            <LogOut size={15} />
          </button>
        </>
      ) : (
        <Link
          to="/explore"
          className="pill-nav-cta"
          style={{ background: "#1a43d4", color: "#fff" }}
        >
          Sign In
        </Link>
      )}
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <PillNav
            logo={logo}
            logoAlt="COllectible"
            items={navItems}
            rightSlot={rightSlot}
            baseColor="#f1f5f9"
            pillColor="transparent"
            hoveredPillTextColor="#1a43d4"
            pillTextColor="#475569"
            activePillColor="#1a43d4"
            activePillTextColor="#ffffff"
            initialLoadAnimation={false}
          />
        </div>
      </header>

      {/* Modals */}
      <BuyArtModalDesktop open={buyModalOpen} onOpenChange={setBuyModalOpen} />
      <OfferModalDesktop open={offerModalOpen} onOpenChange={setOfferModalOpen} onTopUpClick={() => setTopUpModalOpen(true)} />
      <SwapModalDesktop open={swapModalOpen} onOpenChange={setSwapModalOpen} />
      <ListingModalDesktop open={listingModalOpen} onOpenChange={setListingModalOpen} />
      <TopUpModal open={topUpModalOpen} onOpenChange={setTopUpModalOpen} />
    </>
  );
}

export function AppFrame({
  children,
  label,
  desktop,
}: {
  children: ReactNode;
  label?: string;
  desktop?: ReactNode;
}) {
  const [isDesktopViewport, setIsDesktopViewport] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(min-width: 1024px)").matches
  );

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsDesktopViewport(query.matches);
    handleChange();
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  // When a custom desktop layout is provided (e.g. Explore / Home)
  if (desktop) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {!isDesktopViewport && (
          <PhoneShell label={label}>
            <div className="flex min-h-dvh flex-col">
              <main className="flex-1">{children}</main>
              <BottomNav />
            </div>
          </PhoneShell>
        )}
        {isDesktopViewport && <div className="min-h-screen">{desktop}</div>}
      </div>
    );
  }

  // Default layout: PillNav top bar + centred content on desktop
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile */}
      <div className="lg:hidden">
        <PhoneShell label={label}>
          <div className="flex min-h-dvh flex-col">
            <main className="flex-1">{children}</main>
            <BottomNav />
          </div>
        </PhoneShell>
      </div>

      {/* Desktop */}
      <div className="hidden min-h-screen flex-col lg:flex">
        <DesktopTopNav />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-5xl px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
