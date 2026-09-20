"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Pin } from "@/lib/types";
import { INDIRANAGAR } from "@/lib/types";
import { km, distance, dayBucket } from "@/lib/format";
import PinCallout from "./pin-callout";
import SearchPanel, { type Place } from "./search-panel";
import { Mascot, Wordmark, Avatar, Verified } from "./brand";
import type { Anchor } from "./map-canvas";

const MapCanvas = dynamic(() => import("./map-canvas"), { ssr: false });

type Props = {
  pins: Pin[];
  user: { id: string; name: string; admin?: boolean; verified?: boolean; pending?: boolean; unread?: number } | null;
  signIn: () => Promise<void>;
};

export default function Explore({ pins, user, signIn }: Props) {
  const [origin, setOrigin] = useState(INDIRANAGAR);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; n: number; name: string } | null>(null);
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const onAnchor = useCallback((a: Anchor | null) => setAnchor(a), []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 6000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setActiveId(null);
      setSearch(false);
      setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Women-only map: women-only Popouts, women-hosted Popouts, plus events (they're venues, not people)
  const shown = womenOnly ? pins.filter((p) => p.kind === "event" || p.genderPref === "women_only" || p.host?.gender === "woman") : pins;
  const active = shown.find((p) => p.id === activeId) ?? null;

  const goTo = (p: { name: string; lat: number; lng: number }) => {
    setActiveId(null);
    setFocus({ lat: p.lat, lng: p.lng, n: Date.now(), name: p.name });
    setSearch(false);
  };

  // What's around the searched area (≈3km), and the nearest pin if nothing is
  const NEAR_KM = 3;
  const around = focus ? shown.filter((p) => km(focus, p) <= NEAR_KM) : [];
  const tonight = around.filter((p) => dayBucket(p.startsAt) === "Today").length;
  const nearest = focus && !around.length ? [...shown].sort((a, b) => km(focus, a) - km(focus, b))[0] : null;


  return (
    <div className="relative h-dvh w-full overflow-hidden bg-ink">
      <MapCanvas pins={shown} center={origin} activeId={activeId} onSelect={setActiveId} onAnchor={onAnchor} focus={focus} />
      {active && anchor && <PinCallout pin={active} anchor={anchor} origin={origin} onClose={() => setActiveId(null)} />}

      {/* Dim the map while searching */}
      {search && <button type="button" aria-label="Close search" onClick={() => setSearch(false)} className="callout-fast absolute inset-0 z-10 bg-ink/60 backdrop-blur-[2px]" />}

      {/* Top chrome */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-3 md:flex-nowrap">
          <div className="reveal pointer-events-auto flex h-10 shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-label="Menu"
              aria-expanded={menu}
              className="glass relative grid h-10 w-10 place-items-center rounded-full text-cream"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              {!!user?.unread && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-pop ring-2 ring-ink" />}
            </button>
            <Link href="/" className="wiggle ml-1 flex items-center">
              <Wordmark size={26} />
            </Link>
          </div>

          {search && (
            <SearchPanel
              pins={shown}
              near={origin}
              onPickPlace={(p: Place) => goTo(p)}
              onPickPin={(id) => {
                setSearch(false);
                setActiveId(id);
              }}
              onClose={() => setSearch(false)}
              className="callout-fast pointer-events-auto order-3 w-full md:order-none md:mx-2 md:w-[520px]"
            />
          )}

          <div className="reveal pointer-events-auto flex h-10 shrink-0 items-center gap-2" style={{ animationDelay: "80ms" }}>
            <button
              type="button"
              onClick={() => {
                setWomenOnly((v) => !v);
                setActiveId(null);
              }}
              aria-pressed={womenOnly}
              title="Women-only and women-hosted Popouts"
              className={`glass flex h-10 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold ${womenOnly ? "glass-on text-pop" : "text-cream"}`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="8" r="5" />
                <path d="M12 13v8M9 18h6" />
              </svg>
              <span className="hidden sm:inline">Women</span>
            </button>
            <button
              type="button"
              onClick={() => setSearch((v) => !v)}
              aria-label="Search location"
              aria-expanded={search}
              className={`glass grid h-10 w-10 place-items-center rounded-full text-pop ${search ? "glass-on" : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
            {user ? (
              <Link href="/profile" aria-label={user.verified ? "Profile" : "Profile — verification pending"} className="glass relative grid h-10 w-10 place-items-center rounded-full">
                <Avatar seed={user.id} size={30} />
                {user.verified ? (
                  <Verified size={15} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-ink" />
                ) : (
                  <span
                    title={user.pending ? "Selfie under review" : "Verify your face"}
                    className={`absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold text-ink ring-2 ring-ink ${user.pending ? "bg-cream-3" : "bg-tix pulse-soft"}`}
                  >
                    !
                  </span>
                )}
              </Link>
            ) : (
              <form action={signIn} className="flex">
                <button className="glass flex h-10 items-center rounded-full px-4 text-[13px] font-semibold leading-none text-cream">Sign in</button>
              </form>
            )}
          </div>
        </div>

        {focus && !search && (
          <div className="glass callout-fast pointer-events-auto mt-3 flex w-fit max-w-full items-center gap-2 rounded-full py-1.5 pl-3.5 pr-1.5 text-[13px] text-cream">
            {around.length ? (
              <span>
                Around <b className="font-semibold">{focus.name}</b>
                <span className="text-cream-3"> · {tonight ? `${tonight} tonight` : `${around.length} coming up`}</span>
              </span>
            ) : nearest ? (
              <span>
                Nothing in <b className="font-semibold">{focus.name}</b> yet
                <button type="button" onClick={() => setActiveId(nearest.id)} className="ml-2 font-semibold text-pop underline decoration-pop/40 underline-offset-4">
                  nearest {distance(km(focus, nearest))} →
                </button>
              </span>
            ) : (
              <span>Nothing in <b className="font-semibold">{focus.name}</b> yet</span>
            )}
            <button type="button" onClick={() => setFocus(null)} aria-label="Back to my location" className="grid h-7 w-7 place-items-center rounded-full text-cream-3 hover:bg-white/10 hover:text-cream">
              ×
            </button>
          </div>
        )}

        {menu && (
          <nav className="glass callout-fast pointer-events-auto mt-3 w-[240px] overflow-hidden rounded-[20px] p-1.5">
            {user ? (
              <>
                <Link href="/mine" className="flex items-center justify-between rounded-[14px] px-3.5 py-2.5 text-[14px] text-cream hover:bg-white/10">
                  My Popouts
                  {!!user.unread && <span className="rounded-full bg-pop px-1.5 py-0.5 text-[10px] font-bold text-ink">{user.unread}</span>}
                </Link>
                <Link href="/profile" className="block rounded-[14px] px-3.5 py-2.5 text-[14px] text-cream hover:bg-white/10">Profile</Link>
                <Link href="/new" className="block rounded-[14px] px-3.5 py-2.5 text-[14px] text-cream hover:bg-white/10">Start a Popout</Link>
                {user.admin && <Link href="/admin" className="block rounded-[14px] px-3.5 py-2.5 text-[14px] text-pop hover:bg-white/10">Admin</Link>}
              </>
            ) : (
              <form action={signIn}>
                <button className="block w-full rounded-[14px] px-3.5 py-2.5 text-left text-[14px] text-cream hover:bg-white/10">Sign in with Google</button>
              </form>
            )}
          </nav>
        )}
      </header>

      {/* Create: living mascot + speech bubble */}
      <Link
        href="/new"
        aria-label="Start a Popout"
        className="reveal absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-3 z-30 flex items-end gap-2 sm:right-4"
        style={{ animationDelay: "160ms" }}
      >
        <span className="bubble glass font-display relative mb-4 rounded-[18px] rounded-br-[6px] px-3.5 py-2 text-[14px] font-semibold text-cream">
          Tap me to start a Popout
        </span>
        <span className="mascot-wrap grid place-items-center">
          <Mascot size={72} live />
        </span>
      </Link>

      {/* Empty state */}
      {shown.length === 0 && (
        <div className="glass reveal absolute inset-x-4 bottom-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] z-20 flex items-center gap-3 rounded-[22px] p-4 text-[14px] text-cream-2">
          <Mascot size={36} /> {womenOnly ? "No women-only Popouts yet. Start one — you set who joins." : "Nothing nearby yet. Be the first — start one."}
        </div>
      )}

    </div>
  );
}
