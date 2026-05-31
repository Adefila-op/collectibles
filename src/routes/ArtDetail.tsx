import { Link, useParams } from "react-router-dom";
import { AppFrame } from "@/components/AppFrame";
import { getArt, fmt } from "@/lib/art-data";
import { ArrowLeft, ShieldCheck, Link2, Repeat2, Send, ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getHoldings, getArtworkOwner } from "@/lib/db";

export default function ArtDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const a = getArt(id!);
  
  const userHoldings = user ? getHoldings(user.id) : [];
  const isOwned = userHoldings.some((h) => h.artId === a.id);
  const currentOwner = getArtworkOwner(a.id);

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
          {(
            [
              ["Artist", a.artist, "text-primary font-semibold"],
              ["Art Type", a.category, ""],
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
            className="rounded-2xl bg-blue-600 hover:bg-blue-700 py-3 text-center text-sm font-semibold text-white shadow-glow flex items-center justify-center gap-1 transition"
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
