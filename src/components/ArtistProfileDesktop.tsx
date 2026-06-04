import { Link, useParams } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import { fmt } from "@/lib/art-data";
import { artAPI, userAPI } from "@/lib/api";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Home as HomeIcon,
  MapPin,
  Search,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";
import type { Art } from "@/lib/api";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const STATIC_ARTISTS: Record<string, {
  name: string;
  type: string;
  bio: string;
  portfolioUrl: string;
  socialUrl: string;
  liveLocation: string;
  callUrl: string;
  rating: string;
}> = {
  [slugify("Emeka Osei")]: {
    name: "Emeka Osei",
    type: "Painter",
    bio: "Known for atmospheric paintings that trace memory, city dust, and West African light.",
    portfolioUrl: "https://artchain.example/emeka-osei",
    socialUrl: "https://instagram.com/emekaosei",
    liveLocation: "Lagos, Nigeria",
    callUrl: "https://cal.com/emeka-osei",
    rating: "4.9",
  },
  [slugify("Fatima Diallo")]: {
    name: "Fatima Diallo",
    type: "Textile artist",
    bio: "Builds textile works from hand-dyed fibers, archival patterns, and contemporary weaving.",
    portfolioUrl: "https://artchain.example/fatima-diallo",
    socialUrl: "https://instagram.com/fatimadiallo",
    liveLocation: "Dakar, Senegal",
    callUrl: "https://cal.com/fatima-diallo",
    rating: "4.8",
  },
  [slugify("Kwame Asante")]: {
    name: "Kwame Asante",
    type: "Sculptor",
    bio: "Creates bronze and clay forms inspired by Akan history, ritual objects, and modern architecture.",
    portfolioUrl: "https://artchain.example/kwame-asante",
    socialUrl: "https://instagram.com/kwameasante",
    liveLocation: "Accra, Ghana",
    callUrl: "https://cal.com/kwame-asante",
    rating: "4.7",
  },
  [slugify("Adunni Bello")]: {
    name: "Adunni Bello",
    type: "Beadwork artist",
    bio: "Uses beadwork and pattern to explore rhythm, inheritance, and contemporary Yoruba design.",
    portfolioUrl: "https://artchain.example/adunni-bello",
    socialUrl: "https://instagram.com/adunnibello",
    liveLocation: "Ibadan, Nigeria",
    callUrl: "https://cal.com/adunni-bello",
    rating: "4.8",
  },
};

function DesktopSidebar() {
  return (
    <aside className="sticky top-0 flex h-screen flex-col border-r border-slate-200/80 bg-white/90 px-6 py-8 backdrop-blur">
      <BrandLogo />
      <nav className="mt-10 space-y-1 text-sm">
        {[
          { label: "Home", icon: HomeIcon, to: "/" },
          { label: "Explore", icon: Search, to: "/explore" },
          { label: "My Portfolio", icon: Wallet, to: "/explore?section=portfolio" },
          { label: "Artists", icon: UserRound, to: "/explore?section=artists" },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function ArtistProfileDesktop({ slug }: { slug: string }) {
  const [portfolio, setPortfolio] = useState<Art[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await userAPI.getAll();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  const approvedUser = users.find(
    (user) => slugify(user.name) === slug && user.artistStatus === "approved"
  );
  const profile = approvedUser
    ? {
        name: approvedUser.name,
        type: approvedUser.artistType || "Artist",
        bio: approvedUser.artistBio || "Approved COllectible artist.",
        portfolioUrl: approvedUser.portfolioUrl || "",
        socialUrl: approvedUser.socialUrl || "",
        liveLocation: approvedUser.liveLocation || "Location shared on request",
        callUrl: approvedUser.callUrl || "",
        rating: "New",
      }
    : STATIC_ARTISTS[slug || ""] ?? STATIC_ARTISTS[slugify("Emeka Osei")];

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const allArtworks = await artAPI.getAll();
        setPortfolio(allArtworks.filter((art: Art) => art.artist === profile.name));
      } catch (err) {
        console.error("Failed to fetch portfolio:", err);
      }
    };
    fetchPortfolio();
  }, [profile.name]);

  const totalMarket = portfolio.reduce((sum, art) => sum + art.price, 0);

  return (
    <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)] bg-[#f6f8ff] text-slate-950">
      <DesktopSidebar />
      <div className="px-8 py-7 overflow-auto">
        <div className="mx-auto max-w-[1000px]">
          {/* Header */}
          <header className="mb-8">
            <Link
              to="/explore?section=artists"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Artists
            </Link>
          </header>

          {/* Artist Hero */}
          <section className="mb-8 rounded-[28px] bg-gradient-to-br from-[hsl(var(--ink))] to-slate-900 p-8 text-white shadow-sm">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                  {profile.type}
                </div>
                <h1 className="mt-4 font-display text-5xl font-black">{profile.name}</h1>
                <div className="mt-3 flex items-center gap-2 text-lg text-white/75">
                  <MapPin className="h-5 w-5" /> {profile.liveLocation}
                </div>
                <p className="mt-6 max-w-2xl text-lg leading-7 text-white/80">
                  {profile.bio}
                </p>
              </div>
              <div className="flex flex-col items-end gap-4">
                <div className="rounded-2xl bg-white/10 backdrop-blur px-6 py-4 text-right">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                    <span className="text-3xl font-bold">{profile.rating}</span>
                  </div>
                  <div className="text-sm text-white/50">market rating</div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-3 gap-5">
            <div className="rounded-[24px] bg-white p-6 shadow-sm">
              <div className="text-sm text-slate-500">Total artworks</div>
              <div className="mt-2 font-display text-4xl font-bold">
                {portfolio.length}
              </div>
            </div>
            <div className="rounded-[24px] bg-white p-6 shadow-sm">
              <div className="text-sm text-slate-500">Portfolio value</div>
              <div className="mt-2 font-display text-4xl font-bold">
                {fmt(totalMarket)}
              </div>
            </div>
            <div className="rounded-[24px] bg-white p-6 shadow-sm">
              <div className="text-sm text-slate-500">Average price</div>
              <div className="mt-2 font-display text-4xl font-bold">
                {fmt(portfolio.length > 0 ? totalMarket / portfolio.length : 0)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-8 flex gap-3">
            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                <ExternalLink className="h-4 w-4" />
                View Portfolio
              </a>
            )}
            {profile.callUrl && (
              <a
                href={profile.callUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-950 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50 transition"
              >
                <Calendar className="h-4 w-4" />
                Book Call
              </a>
            )}
          </div>

          {/* Portfolio Grid */}
          <section>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold">Portfolio</h2>
              <p className="mt-1 text-slate-600">
                {portfolio.length} work{portfolio.length !== 1 ? "s" : ""} on{" "}
                COllectible
              </p>
            </div>

            {portfolio.length > 0 ? (
              <div className="grid grid-cols-3 gap-6">
                {portfolio.map((art) => (
                  <Link
                    key={art.id}
                    to={`/art/${art.id}`}
                    className="group overflow-hidden rounded-[24px] bg-white shadow-sm hover:shadow-md transition duration-300"
                  >
                    <div className="relative h-64 overflow-hidden bg-slate-100">
                      <img
                        src={art.image}
                        alt={art.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                        <button className="w-full rounded-lg bg-white/90 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white transition">
                          View details
                        </button>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-slate-950">{art.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{art.category}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-slate-500">{art.year}</span>
                        <span className="font-display text-lg font-bold text-slate-950">
                          {fmt(art.price)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] bg-white p-12 text-center shadow-sm">
                <p className="text-slate-600">No artworks yet</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
