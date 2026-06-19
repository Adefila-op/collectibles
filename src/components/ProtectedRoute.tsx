import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireCreator?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin, requireCreator }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/");
        return;
      }
      if (requireAdmin && !user.isAdmin) {
        navigate("/");
        return;
      }
      if (requireCreator && user.artistStatus !== "approved") {
        navigate("/profile");
        return;
      }
    }
  }, [user, isLoading, requireAdmin, requireCreator, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: "0 auto 1rem" }} />
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (requireAdmin && !user.isAdmin) return null;
  if (requireCreator && user.artistStatus !== "approved") return null;

  return <>{children}</>;
}
