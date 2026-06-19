import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
  open: boolean;
  defaultTab?: "signin" | "signup";
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn } = useAuth();

  useEffect(() => {
    if (open) {
      signIn();
      onClose();
    }
  }, [open, signIn, onClose]);

  return null;
}
