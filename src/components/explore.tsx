"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Pin } from "@/lib/types";
import { INDIRANAGAR } from "@/lib/types";
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
  const [origin, setOrigin] = useState(INDIRANAGAR);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; n: number; name: string } | null>(null);
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);
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

  const active = pins.find((p) => p.id === activeId) ?? null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-ink">
      <MapCanvas pins={pins} center={origin} activeId={activeId} onSelect={setActiveId} onAnchor={onAnchor} focus={focus} />
      {active && anchor && <PinCallout pin={active} anchor={anchor} origin={origin} onClose={() => setActiveId(null)} />}

      {/* Top chrome */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="reveal pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-label="Menu"
              aria-expanded={menu}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.09] text-cream backdrop-blur-xl transition hover:bg-white/15"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <Link href="/" className="wiggle ml-1">
              <Wordmark size={26} />
            </Link>
          </div>
          <div className="reveal pointer-events-auto flex items-center gap-2" style={{ animationDelay: "80ms" }}>
            <button
              type="button"
              onClick={() => setSearch((v) => !v)}
              aria-label="Search location"
              aria-expanded={search}
              className={`grid h-10 w-10 place-items-center rounded-full border border-white/15 backdrop-blur-xl transition ${search ? "bg-pop-soft text-pop" : "bg-white/[0.09] text-pop hover:bg-white/15"}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
            {user ? (
              <Link href="/profile" aria-label="Profile" className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/[0.09] text-[13px] backdrop-blur-xl">
                {user.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  user.name[0]
                )}
              </Link>
            ) : (
              <form action={signIn}>
                <button className="h-10 rounded-full border border-white/15 bg-white/[0.09] px-4 text-[13px] font-semibold text-cream backdrop-blur-xl transition hover:bg-white/15">Sign in</button>
              </form>
            )}
          </div>
        </div>

        {search && (
          <SearchBar
            near={origin}
            autoFocus
            onPick={(p: Place) => {
              setActiveId(null);
              setFocus({ lat: p.lat, lng: p.lng, n: Date.now(), name: p.name });
              setSearch(false);
            }}
            className="callout-fast pointer-events-auto mt-3 w-full md:mx-auto md:w-[616px]"
          />
        )}

        {menu && (
          <nav className="callout-fast pointer-events-auto mt-3 w-[240px] overflow-hidden rounded-[20px] border border-white/15 bg-ink/85 p-1.5 backdrop-blur-xl">
            {user ? (
              <>
                <Link href="/profile" className="block rounded-[14px] px-3.5 py-2.5 text-[14px] text-cream hover:bg-white/10">Profile</Link>
                <Link href="/new" className="block rounded-[14px] px-3.5 py-2.5 text-[14px] text-cream hover:bg-white/10">Start a Popout</Link>
              </>
            ) : (
              <form action={signIn}>
                <button className="block w-full rounded-[14px] px-3.5 py-2.5 text-left text-[14px] text-cream hover:bg-white/10">Sign in with Google</button>
              </form>
            )}
            {focus && (
              <button type="button" onClick={() => {
                  setFocus(null);
                  setMenu(false);
                }} className="block w-full rounded-[14px] px-3.5 py-2.5 text-left text-[14px] text-cream-2 hover:bg-white/10">
                Back to my location
              </button>
            )}
          </nav>
        )}
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
      {pins.length === 0 && (
        <div className="reveal absolute inset-x-4 bottom-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] z-20 flex items-center gap-3 rounded-[22px] border border-line bg-ink-2/85 p-4 text-[14px] text-cream-2 backdrop-blur-md">
          <Mascot size={36} /> Nothing nearby yet. Be the first — start one.
        </div>
      )}

    </div>
  );
}
