import { Link, useParams } from "react-router-dom";
import type { ReactNode } from "react";
import { AppFrame } from "@/components/AppFrame";
import { BrandLogo } from "@/components/BrandLogo";
import { getAllArtworks, getArt, fmt, type Art } from "@/lib/art-data";
import { OFFERS } from "@/lib/offers-data";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Clock,
  FileBadge,
  History,
  Home as HomeIcon,
  Landmark,
  Link2,
  Repeat2,
  Search,
  Send,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  UserRound,
  Wallet,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getHoldings, getArtworkOwner } from "@/lib/db";
import { slugify } from "@/routes/ArtistProfile";

function makeUniqueId(id: string) {
  return `ART-${id.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`;
}

function shortDate(value?: string) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function HistorySection({
  icon,
  title,
  empty,
  children,
}: {
  icon: ReactNode;
  title: string;
  empty?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
      </div>
      {children || <div className="text-xs text-muted-foreground">{empty}</div>}
    </div>
  );
}

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

function DesktopArtworkDetail({
  art,
  isOwned,
  currentOwnerName,
  uniqueId,
  suggestedCollection,
  collectionOffers,
}: {
  art: Art;
  isOwned: boolean;
  currentOwnerName?: string;
  uniqueId: string;
  suggestedCollection: Art[];
  collectionOffers: typeof OFFERS;
}) {
  const artistWorks = getAllArtworks().filter((item) => item.artist === art.artist);
  const artistValue = artistWorks.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)] bg-[#f6f8ff] text-slate-950">
      <DesktopSidebar />
      <div className="px-8 py-7">
      <div className="mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1fr)_360px] gap-7">
        <main className="space-y-6">
          <header className="flex items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <Link to="/explore" className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-700 shadow-sm">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Artwork detail</div>
                <h1 className="font-display text-3xl font-black">{art.name}</h1>
              </div>
            </div>
            <div className="flex h-12 w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
              <Link2 className="h-4 w-4 text-slate-400" />
              <span className="truncate text-sm text-slate-500">{uniqueId}</span>
            </div>
          </header>

          <section className="grid grid-cols-[minmax(320px,0.9fr)_minmax(0,1fr)] items-start gap-6">
            <div className="overflow-hidden rounded-[28px] bg-white p-4 shadow-sm">
              <div className="relative">
                <img src={art.image} alt={art.name} className="h-[430px] w-full rounded-[22px] object-cover" />
                <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/82 px-5 py-4 text-center shadow-sm backdrop-blur">
                  <div className="flex items-center justify-center gap-2 font-display text-xl font-black">
                    <Clock className="h-5 w-5 text-primary" /> Verified collection item
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Vault audit before funds release</div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> verified
                  </div>
                  <h2 className="mt-5 font-display text-4xl font-black leading-tight">{art.name}</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                    A documented {art.category.toLowerCase()} from {art.city}, connected to artist records,
                    ownership history, and market offers in COllectible.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Current price</div>
                  <div className="mt-1 text-xl font-bold">{fmt(art.price)}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Artist", art.artist],
                  ["Category", art.category],
                  ["City", art.city],
                  ["Year", art.year.toString()],
                  ["Current owner", currentOwnerName || "Open market"],
                  ["Token", art.token],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="mt-1 truncate font-semibold">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-xs text-slate-500">Main action</div>
                    <div className="mt-1 text-lg font-bold">{isOwned ? "Swap this owned artwork" : "Buy or make an offer"}</div>
                  </div>
                  {isOwned ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to={`/list?artId=${art.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                      >
                        <Wallet className="h-4 w-4" /> List
                      </Link>
                      <Link
                        to={`/swap?artId=${art.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                      >
                        <Repeat2 className="h-4 w-4" /> Swap
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to={`/checkout/${art.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm"
                      >
                        <ShoppingCart className="h-4 w-4" /> Buy
                      </Link>
                      <Link
                        to={`/offer?artId=${art.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-glow"
                      >
                        <Send className="h-4 w-4" /> Offer
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold">Suggested Collection</h2>
                <div className="text-sm text-slate-500">Related works from the same market lane</div>
              </div>
              <Link to="/explore" className="text-sm font-semibold text-primary">View all</Link>
            </div>
            <div className="grid grid-cols-3 gap-5">
              {suggestedCollection.map((item) => (
                <Link key={item.id} to={`/art/${item.id}`} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="relative h-56 overflow-hidden">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-primary">
                      Place offer
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="truncate text-sm font-semibold">{item.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.artist}</div>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{item.category}</span>
                      <span className="font-semibold">{fmt(item.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="overflow-hidden rounded-[28px] bg-white shadow-sm">
            <div className="h-36 bg-[linear-gradient(135deg,#19c6ff,#2f5bff_58%,#8b5cf6)]" />
            <div className="px-6 pb-6">
              <div className="-mt-10 grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-slate-950 text-xl font-black text-white shadow-sm">
                {art.artist.split(" ").map((part) => part[0]).join("").slice(0, 2)}
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold">{art.artist}</h2>
                  <div className="text-xs text-slate-500">Artist</div>
                </div>
                <Link to={`/artist/${slugify(art.artist)}`} className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white">
                  Profile
                </Link>
              </div>
              <div className="mt-5">
                <h3 className="text-sm font-semibold">Artist biography</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {art.artist} creates collectible {art.category.toLowerCase()} works shaped by {art.city}'s
                  visual culture, studio practice, and documented provenance. This artist has {artistWorks.length}{" "}
                  verified work{artistWorks.length === 1 ? "" : "s"} on COllectible.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[10px] text-slate-500">Works</div>
                  <div className="mt-1 text-lg font-bold">{artistWorks.length}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[10px] text-slate-500">Market</div>
                  <div className="mt-1 text-lg font-bold">{fmt(artistValue)}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">Offers on the collection</h2>
                <div className="text-xs text-slate-500">{art.category} collector demand</div>
              </div>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              {collectionOffers.map((offer, index) => (
                <div key={offer.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="w-4 text-xs font-semibold text-slate-400">{index + 1}</div>
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-xs font-bold text-primary shadow-sm">
                    {offer.buyerInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{offer.buyer}</div>
                    <div className="text-xs text-slate-500">{offer.buyerCity} - {offer.placedAgo}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{fmt(offer.cash)}</div>
                    <Link
                      to={isOwned ? `/swap?artId=${art.id}&offerId=${offer.id}` : `/offer?artId=${art.id}`}
                      className="text-xs font-semibold text-primary"
                    >
                      {isOwned ? "Swap" : "Accept"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
      </div>
    </div>
  );
}

export default function ArtDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const a = getArt(id!);
  
  const userHoldings = user ? getHoldings(user.id) : [];
  const isOwned = userHoldings.some((h) => h.artId === a.id);
  const currentOwner = getArtworkOwner(a.id);
  const allArtworks = getAllArtworks();
  const suggestedCollection = allArtworks
    .filter((art) => art.id !== a.id)
    .filter((art) => art.category === a.category || art.artist === a.artist)
    .slice(0, 3);
  const collectionOffers = OFFERS.filter((offer) => offer.category === a.category).slice(0, 4);
  const uniqueId = a.uniqueId || makeUniqueId(a.id);
  const certificate = a.certificate || {
    id: `CERT-${uniqueId.replace(/^ART-/, "")}`,
    issuer: "COllectible Vault",
    issuedAt: a.createdAt || `${a.year}`,
    status: "verified" as const,
  };
  const ownershipHistory =
    a.ownershipHistory && a.ownershipHistory.length > 0
      ? a.ownershipHistory
      : [
          {
            title: a.artist,
            date: `${a.year}`,
            detail: "Original artist record created for this artwork.",
            reference: a.token,
            value: a.price,
          },
          ...(currentOwner
            ? [
                {
                  title: currentOwner.userName,
                  date: "Current",
                  detail: "Current collector of record on COllectible.",
                  reference: "Active holding",
                },
              ]
            : []),
        ];
  const exhibitionHistory =
    a.exhibitionHistory && a.exhibitionHistory.length > 0
      ? a.exhibitionHistory
      : [
          {
            title: `${a.city} Studio Showing`,
            date: `${a.year}`,
            detail: `Documented public presentation in ${a.city}.`,
            reference: "Artist supplied record",
          },
        ];
  const restorationHistory = a.restorationHistory || [];
  const valuationHistory =
    a.valuationHistory && a.valuationHistory.length > 0
      ? a.valuationHistory
      : [
          {
            date: "Current",
            amount: a.price,
            source: "Current COllectible listing",
            reference: a.token,
          },
        ];

  return (
    <AppFrame
      label="Artwork · Provenance"
      desktop={
        <DesktopArtworkDetail
          art={a}
          isOwned={isOwned}
          currentOwnerName={currentOwner?.userName}
          uniqueId={uniqueId}
          suggestedCollection={
            suggestedCollection.length
              ? suggestedCollection
              : allArtworks.filter((art) => art.id !== a.id).slice(0, 3)
          }
          collectionOffers={collectionOffers.length ? collectionOffers : OFFERS.slice(0, 4)}
        />
      }
    >
      <div className="space-y-4 px-5 pt-3 pb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-sm font-semibold">Artwork detail</div>
        </div>

        <div className="relative overflow-hidden rounded-3xl shadow-glow animate-pop">
          <img src={a.image} alt={a.name} width={800} height={500} className="h-56 w-full object-cover" />
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ink))]/80 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
            <ShieldCheck className="h-3 w-3 text-emerald-400" /> verified
          </div>
          <div className="absolute bottom-3 left-3 right-3 glass-dark rounded-2xl px-3 py-2">
            <div className="font-display text-base font-semibold text-white">{a.name}</div>
            <div className="text-[11px] text-white/70">
              by {a.artist} · {a.city}, {a.year}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3 text-sm shadow-card">
          <div className="flex items-center justify-between border-b border-border/60 py-2">
            <span className="text-xs text-muted-foreground">Artist</span>
            <Link
              to={`/artist/${slugify(a.artist)}`}
              className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              {a.artist}
            </Link>
          </div>
          {(
            [
              ["Art Type", a.category, ""],
              ["Unique ID", uniqueId, "font-mono text-xs"],
              ["Collection", a.collectionName || "—", ""],
              ["Supply", a.supplyName || "—", ""],
              ...(currentOwner ? [["Current Collector", currentOwner.userName, "text-primary font-semibold"]] : []),
              ["Price", fmt(a.price), "text-primary font-semibold"],
              ["Token ID", a.token, "font-mono text-xs"],
              ...(a.artistSignature ? [["Artist Signature", a.artistSignature, "font-semibold"]] : []),
            ] as [string, string, string][]
          ).map(([k, v, cls]) => (
            <div
              key={k}
              className="flex items-center justify-between border-b border-border/60 py-2 last:border-0"
            >
              <span className="text-xs text-muted-foreground">{k}</span>
              <span className={`text-xs ${cls}`}>{v}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {isOwned ? (
            <>
              <Link
                to={`/list?artId=${a.id}`}
                className="rounded-2xl bg-slate-950 py-3 text-center text-sm font-semibold text-white shadow-glow flex items-center justify-center gap-1 transition hover:bg-slate-800"
              >
                <Wallet className="h-4 w-4" /> List
              </Link>
              <Link
                to={`/swap?artId=${a.id}`}
                className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 py-3 text-center text-sm font-semibold text-white shadow-glow flex items-center justify-center gap-1 transition"
              >
                <Repeat2 className="h-4 w-4" /> Swap
              </Link>
            </>
          ) : (
            <>
              <Link
                to={`/checkout/${a.id}`}
                className="rounded-2xl bg-primary py-3 text-center text-sm font-semibold text-white shadow-glow flex items-center justify-center gap-1 transition hover:bg-primary/90"
              >
                <ShoppingCart className="h-4 w-4" /> Buy
              </Link>
              <Link
                to={`/offer?artId=${a.id}`}
                className="rounded-2xl bg-primary hover:bg-primary/90 py-3 text-center text-sm font-semibold text-white shadow-glow flex items-center justify-center gap-1 transition"
              >
                <Send className="h-4 w-4" /> Offer
              </Link>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> Art ships to vault for audit before
          funds release.
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-sm font-semibold">Artwork history report</div>
            <div className="text-[11px] text-muted-foreground">
              Identity, certification, ownership, exhibitions, restoration, and valuation.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                <BadgeCheck className="h-4 w-4 text-primary" /> Unique ID
              </div>
              <div className="font-mono text-[11px] font-semibold">{uniqueId}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">Permanent artwork record</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                <FileBadge className="h-4 w-4 text-primary" /> Certificate
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold capitalize text-emerald-600">
                <Award className="h-3.5 w-3.5" /> {certificate.status}
              </div>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground">{certificate.id}</div>
            </div>
          </div>

          <HistorySection icon={<History className="h-4 w-4" />} title="Ownership history">
            <div className="space-y-2">
              {ownershipHistory.map((event, index) => (
                <div key={`${event.title}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    {index < ownershipHistory.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold">{event.title}</div>
                      <div className="shrink-0 text-[10px] text-muted-foreground">{shortDate(event.date)}</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{event.detail}</div>
                    <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground/80">
                      <span className="font-mono">{event.reference}</span>
                      {event.value ? <span>{fmt(event.value)}</span> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </HistorySection>

          <HistorySection icon={<Landmark className="h-4 w-4" />} title="Exhibition history">
            <div className="space-y-2">
              {exhibitionHistory.map((event, index) => (
                <div key={`${event.title}-${index}`} className="rounded-xl bg-muted/40 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-semibold">{event.title}</div>
                    <div className="shrink-0 text-[10px] text-muted-foreground">{shortDate(event.date)}</div>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{event.detail}</div>
                  {event.reference && (
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground/80">
                      {event.reference}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </HistorySection>

          <HistorySection
            icon={<Wrench className="h-4 w-4" />}
            title="Restoration history"
            empty="No restoration events reported."
          >
            {restorationHistory.length > 0 ? (
              <div className="space-y-2">
                {restorationHistory.map((event, index) => (
                  <div key={`${event.title}-${index}`} className="rounded-xl bg-muted/40 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold">{event.title}</div>
                      <div className="shrink-0 text-[10px] text-muted-foreground">{shortDate(event.date)}</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{event.detail}</div>
                  </div>
                ))}
              </div>
            ) : undefined}
          </HistorySection>

          <HistorySection icon={<TrendingUp className="h-4 w-4" />} title="Valuation history">
            <div className="space-y-2">
              {valuationHistory.map((event, index) => (
                <div
                  key={`${event.source}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-2"
                >
                  <div>
                    <div className="text-xs font-semibold">{fmt(event.amount)}</div>
                    <div className="text-[11px] text-muted-foreground">{event.source}</div>
                    {event.reference && (
                      <div className="font-mono text-[10px] text-muted-foreground/80">{event.reference}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-[10px] text-muted-foreground">{shortDate(event.date)}</div>
                </div>
              ))}
            </div>
          </HistorySection>
        </div>

        {/* Provenance chain */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Link2 className="h-4 w-4 text-primary" /> Provenance chain
          </div>
          <div className="space-y-2">
            {[
              {
                who: "Emeka Osei",
                tag: "Artist",
                action: "Minted onchain · original work",
                hash: "0x4e3f…a91f",
                time: "Mar 2023",
                origin: true,
              },
              {
                who: "Collector A",
                action: "Purchased · ₦380,000",
                hash: "0x9b2c…f44a",
                time: "Jun 2023",
              },
              {
                who: "Collector B",
                action: "Swapped · Earth Rhythm III",
                hash: "0x3d7a…cc12",
                time: "Nov 2023",
              },
              {
                who: "Current listing",
                action: `For sale · ${fmt(a.price)}`,
                hash: a.token,
                time: "Now",
                active: true,
              },
            ].map((s, i, arr) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      s.origin
                        ? "bg-primary"
                        : s.active
                        ? "bg-emerald-500 animate-pulse"
                        : "border-2 border-primary bg-card"
                    }`}
                  />
                  {i < arr.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="text-xs font-semibold">
                    {s.who}
                    {s.tag && (
                      <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">
                        {s.tag}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{s.action}</div>
                  <div className="font-mono text-[10px] text-muted-foreground/70">
                    {s.hash} · {s.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
