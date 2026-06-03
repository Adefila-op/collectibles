import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { SignOutModal } from "@/components/modals/SignOutModal";
import { LogOut } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface SignOutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  showText?: boolean;
}

export function SignOutButton({
  showText = true,
  className = "",
  ...props
}: SignOutButtonProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      // Clear session
      signOut();
      // Close modal
      setIsOpen(false);
      // Navigate to home
      navigate("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 ${className}`}
        {...props}
      >
        <LogOut className="h-4 w-4" />
        {showText && "Sign Out"}
      </Button>

      <SignOutModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleSignOut}
        isLoading={isLoading}
      />
    </>
  );
}
