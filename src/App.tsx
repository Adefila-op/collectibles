import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/routes/Home";
import ArtDetail from "@/routes/ArtDetail";
import Checkout from "@/routes/Checkout";
import Explore from "@/routes/Explore";
import List from "@/routes/List";
import Profile from "@/routes/Profile";
import Swap from "@/routes/Swap";
import Offer from "@/routes/Offer";
import BuyArt from "@/routes/BuyArt";
import ArtistProfile from "@/routes/ArtistProfile";
import Admin from "@/routes/Admin";
import AdminDashboard from "@/routes/AdminDashboard";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/art/:id" element={<ArtDetail />} />
          <Route path="/artist/:slug" element={<ArtistProfile />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/list" element={<List />} />
          <Route path="/list/:artId" element={<List />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="/offer" element={<Offer />} />
          <Route path="/buy" element={<BuyArt />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/dipo" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
