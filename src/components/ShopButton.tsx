import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingCart } from "lucide-react";

interface ShopButtonProps {
  variant?: "primary" | "secondary" | "nav";
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function ShopButton({
  variant = "primary",
  showIcon = false,
  children = "Shop art",
}: ShopButtonProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleShop = (e: React.MouseEvent) => {
    // If user is logged in, sign them out first to create a "new session"
    if (user) {
      e.preventDefault();
      signOut();
      // Navigate to explore after sign-out
      navigate("/explore");
    }
    // If not logged in, just navigate normally (Link will handle it)
  };

  const baseClasses = "inline-flex items-center gap-2 transition";

  const variantClasses = {
    primary:
      "rounded-full bg-white px-[22px] py-2.5 text-sm font-medium text-[#1a43d4] hover:bg-white/90",
    secondary:
      "rounded-full border border-white/25 px-[18px] py-2.5 text-[13px] text-white/65 hover:border-white/45 hover:text-white",
    nav: "rounded-full bg-white px-[18px] py-[7px] text-[13px] font-medium text-[#1a43d4]",
  };

  return (
    <Link
      to="/explore"
      onClick={handleShop}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {showIcon && <ShoppingCart className="h-4 w-4" />}
      {children}
    </Link>
  );
}
