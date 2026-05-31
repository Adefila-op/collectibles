import { Link, useParams } from "react-router-dom";
import type { ReactNode } from "react";
import { AppFrame } from "@/components/AppFrame";
import { getArt, fmt } from "@/lib/art-data";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  FileBadge,
  History,
  Landmark,
  Link2,
  Repeat2,
  Send,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
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

export default function ArtDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const a = getArt(id!);
  
  const userHoldings = user ? getHoldings(user.id) : [];
  const isOwned = userHoldings.some((h) => h.artId === a.id);
  const currentOwner = getArtworkOwner(a.id);
  const uniqueId = a.uniqueId || makeUniqueId(a.id);
  const certificate = a.certificate || {
    id: `CERT-${uniqueId.replace(/^ART-/, "")}`,
    issuer: "ArtChain Vault",
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
                  detail: "Current collector of record on ArtChain.",
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
            source: "Current ArtChain listing",
            reference: a.token,
          },
        ];

  return (
    <AppFrame label="Artwork · Provenance">
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
          <Link
            to={`/checkout/${a.id}`}
            className="rounded-2xl bg-primary py-3 text-center text-sm font-semibold text-white shadow-glow flex items-center justify-center gap-1 transition hover:bg-primary/90"
          >
            <ShoppingCart className="h-4 w-4" /> Buy
          </Link>
          {isOwned ? (
            <Link
              to="/swap"
              className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 py-3 text-center text-sm font-semibold text-white shadow-glow flex items-center justify-center gap-1 transition"
            >
              <Repeat2 className="h-4 w-4" /> Swap
            </Link>
          ) : (
            <Link
              to={`/offer?artId=${a.id}`}
              className="rounded-2xl bg-primary hover:bg-primary/90 py-3 text-center text-sm font-semibold text-white shadow-glow flex items-center justify-center gap-1 transition"
            >
              <Send className="h-4 w-4" /> Offer
            </Link>
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
