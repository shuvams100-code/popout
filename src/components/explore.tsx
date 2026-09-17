"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Pin } from "@/lib/types";
import { INDIRANAGAR } from "@/lib/types";
import { dayBucket } from "@/lib/format";
import PinCard from "./pin-card";
import PinCallout from "./pin-callout";
import SearchBar, { type Place } from "./search-bar";
import { Mascot, Wordmark } from "./brand";
import type { Anchor } from "./map-canvas";

const MapCanvas = dynamic(() => import("./map-canvas"), { ssr: false });

type Props = {
  pins: Pin[];
  user: { name: string; photo: string | null } | null;
  signIn: () => Promise<void>;
};

export default function Explore({ pins, user, signIn }: Props) {
  const [view, setView] = useState<"map" | "list">("map");
  const [origin, setOrigin] = useState(INDIRANAGAR);
  const [located, setLocated] = useState<"idle" | "ok" | "denied">("idle");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; n: number; name: string } | null>(null);
  const onAnchor = useCallback((a: Anchor | null) => setAnchor(a), []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocated("ok");
      },
      () => setLocated("denied"),
      { timeout: 6000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActiveId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId]);

  const active = pins.find((p) => p.id === activeId) ?? null;
  const buckets = ["Today", "Tomorrow", "Later"] as const;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-ink">
      {view === "map" && <MapCanvas pins={pins} center={origin} activeId={activeId} onSelect={setActiveId} onAnchor={onAnchor} focus={focus} />}
      {view === "map" && active && anchor && <PinCallout pin={active} anchor={anchor} origin={origin} onClose={() => setActiveId(null)} />}

      {/* Top chrome */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-y-3 p-4 pt-[max(1rem,env(safe-area-inset-top))] md:flex-nowrap md:gap-x-4">
        <div className="reveal pointer-events-auto flex flex-col gap-2">
          <Link href="/" className="wiggle">
            <Wordmark size={30} />
          </Link>
          <button
            type="button"
            onClick={() => setFocus(null)}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line bg-ink-2/80 px-2.5 py-1 text-[12px] text-cream-2 backdrop-blur-md"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${focus ? "bg-ice" : located === "ok" ? "bg-pop" : "bg-cream-3"}`} />
            {focus ? `Around ${focus.name}` : located === "ok" ? "Near you" : "Around Indiranagar"}
          </button>
        </div>
        <SearchBar
          near={origin}
          onPick={(p: Place) => {
            setActiveId(null);
            setFocus({ lat: p.lat, lng: p.lng, n: Date.now(), name: p.name });
          }}
          className="reveal pointer-events-auto order-3 w-full md:order-none md:mt-0 md:w-[616px]"
        />
        <div className="reveal pointer-events-auto flex items-center gap-2" style={{ animationDelay: "80ms" }}>
          <div className="flex rounded-full border border-line bg-ink-2/80 p-0.5 text-[12px] backdrop-blur-md">
            {(["map", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full px-3.5 py-1.5 font-semibold capitalize transition ${view === v ? "bg-cream text-ink" : "text-cream-2"}`}
              >
                {v}
              </button>
            ))}
          </div>
          {user ? (
            <Link href="/profile" aria-label="Profile" className="grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-line bg-ink-2/80 text-[12px] backdrop-blur-md">
              {user.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                user.name[0]
              )}
            </Link>
          ) : (
            <form action={signIn}>
              <button className="rounded-full border border-line bg-ink-2/80 px-3.5 py-1.5 text-[12px] font-semibold text-cream backdrop-blur-md">Sign in</button>
            </form>
          )}
        </div>
      </header>

      {/* Create */}
      <Link
        href="/new"
        className="btn-pop reveal wiggle absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 z-30 flex h-13 items-center gap-2 pl-3 pr-5 text-[16px]"
        style={{ animationDelay: "160ms" }}
      >
        <Mascot size={30} glow={false} /> Start one
      </Link>

      {/* Empty state */}
      {view === "map" && pins.length === 0 && (
        <div className="reveal absolute inset-x-4 bottom-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] z-20 flex items-center gap-3 rounded-[22px] border border-line bg-ink-2/85 p-4 text-[14px] text-cream-2 backdrop-blur-md">
          <Mascot size={36} /> Nothing nearby yet. Be the first — start one.
        </div>
      )}

      {/* List */}
      {view === "list" && (
        <div className="absolute inset-0 overflow-y-auto px-4 pb-28 pt-24">
          {buckets.map((b) => {
            const items = pins.filter((p) => dayBucket(p.startsAt) === b);
            if (!items.length) return null;
            return (
              <section key={b} className="reveal mb-6">
                <h2 className="font-display mb-3 text-[24px] text-cream" style={{ fontWeight: 600 }}>
                  {b}
                  <span className="ml-2 text-[13px] text-cream-3">{items.length}</span>
                </h2>
                <div className="flex flex-col gap-3">
                  {items.map((p) => (
                    <PinCard key={p.id} pin={p} origin={origin} wide />
                  ))}
                </div>
              </section>
            );
          })}
          {pins.length === 0 && <p className="text-cream-2">Nothing yet. Start one.</p>}
        </div>
      )}
    </div>
  );
}
