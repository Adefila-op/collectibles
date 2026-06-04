import { useParams } from "react-router-dom";
import { AppFrame } from "@/components/AppFrame";
import { ArtistProfileDesktop } from "@/components/ArtistProfileDesktop";
import { getAllArtworks, fmt } from "@/lib/art-data";
import { userAPI } from "@/lib/api";
import { ArrowLeft, Calendar, ExternalLink, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";

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

export default function ArtistProfile() {
  const { slug } = useParams<{ slug: string }>();
  const users = getUsers();
  const approvedUser = users.find((user) => slugify(user.name) === slug && user.artistStatus === "approved");
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

  const portfolio = getAllArtworks().filter((art) => art.artist === profile.name);
  const totalMarket = portfolio.reduce((sum, art) => sum + art.price, 0);

  return (
    <AppFrame
      label="Artist profile"
      desktop={<ArtistProfileDesktop slug={slug || ""} />}
    >
      <div className="space-y-4 px-5 pt-3 pb-6">
        <div className="flex items-center gap-3">
          <Link to="/explore" className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-sm font-semibold">Artist profile</div>
        </div>

        <section className="rounded-3xl bg-[hsl(var(--ink))] p-5 text-white shadow-glow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-white/45">{profile.type}</div>
              <h1 className="mt-1 font-display text-2xl font-semibold">{profile.name}</h1>
              <div className="mt-2 flex items-center gap-1 text-xs text-white/65">
                <MapPin className="h-3.5 w-3.5" /> {profile.liveLocation}
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
              <div className="flex items-center gap-1 text-sm font-semibold">
                <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" /> {profile.rating}
              </div>
              <div className="text-[10px] text-white/45">market rating</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/70">{profile.bio}</p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-3 shadow-card">
            <div className="text-[10px] text-muted-foreground">Portfolio value</div>
            <div className="mt-1 font-display text-lg font-semibold">{fmt(totalMarket)}</div>
          </div>
          <div className="rounded-2xl bg-card p-3 shadow-card">
            <div className="text-[10px] text-muted-foreground">Works listed</div>
            <div className="mt-1 font-display text-lg font-semibold">{portfolio.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {profile.portfolioUrl && (
            <a href={profile.portfolioUrl} className="rounded-2xl bg-primary px-3 py-2.5 text-center text-xs font-semibold text-white">
              Portfolio <ExternalLink className="ml-1 inline h-3 w-3" />
            </a>
          )}
          {profile.callUrl && (
            <a href={profile.callUrl} className="rounded-2xl bg-muted px-3 py-2.5 text-center text-xs font-semibold text-foreground">
              Book live call <Calendar className="ml-1 inline h-3 w-3" />
            </a>
          )}
        </div>

        <div className="text-sm font-semibold">Portfolio</div>
        <div className="grid grid-cols-2 gap-3">
          {portfolio.map((art) => (
            <Link key={art.id} to={`/art/${art.id}`} className="overflow-hidden rounded-2xl bg-card shadow-card">
              <img src={art.image} alt={art.name} className="h-28 w-full object-cover" />
              <div className="p-2">
                <div className="truncate text-xs font-semibold">{art.name}</div>
                <div className="text-[10px] font-semibold text-primary">{fmt(art.price)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppFrame>
  );
}

export { slugify };
