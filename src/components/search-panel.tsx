"use client";

import { useEffect, useRef, useState } from "react";
import type { Pin } from "@/lib/types";
import { when, km, distance } from "@/lib/format";
import { Mascot } from "./brand";

import { geocode, type Place } from "@/lib/geocode";
export type { Place };

type Props = {
  pins: Pin[];
  near: { lat: number; lng: number };
  onPickPlace: (p: Place) => void;
  onPickPin: (id: string) => void;
  onClose: () => void;
  className?: string;
};

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export default function SearchPanel({ pins, near, onPickPlace, onPickPin, onClose, className = "" }: Props) {
  const [q, setQ] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  const query = q.trim().toLowerCase();

  // Default: what's happening soonest. Typing: substring match on title / venue.
  const hits = (query ? pins.filter((p) => `${p.title} ${p.venue}`.toLowerCase().includes(query)) : pins).slice(0, query ? 8 : 6);

  useEffect(() => {
    if (query.length < 2) return;
    const id = ++seq.current;
    const t = setTimeout(async () => {
      setBusy(true);
      const res = await geocode(query, near, 4, "anywhere").catch(() => []);
      if (id === seq.current) {
        setPlaces(res);
        setBusy(false);
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const submit = () => {
    if (hits[0]) return onPickPin(hits[0].id);
    if (places[0]) return onPickPlace(places[0]);
  };

  const row = "flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition hover:bg-white/10";

  return (
    <div className={`relative ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="glass flex h-10 items-center gap-1 rounded-full p-1 pl-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="shrink-0 text-cream-3" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (e.target.value.trim().length < 2) setPlaces([]);
          }}
          placeholder="Events, plans, or a place…"
          aria-label="Search"
          autoComplete="off"
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-[14px] text-cream placeholder:text-cream-3 focus:outline-none"
        />
        <button type="submit" aria-label="Search" className="btn-pop grid h-8 w-8 shrink-0 place-items-center">
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </button>
      </form>

      <div className="glass callout-fast mt-2 max-h-[min(60dvh,520px)] overflow-y-auto rounded-[20px] p-1.5">
        {hits.length > 0 && (
          <>
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream-3">{query ? "Matches" : "Happening soon"}</p>
            {hits.map((p) => {
              const isPopout = p.kind === "popout";
              return (
                <button key={p.id} type="button" onClick={() => onPickPin(p.id)} className={row}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${isPopout ? "bg-pop-soft" : "bg-tix-soft"}`}>
                    {isPopout ? <Mascot size={20} glow={false} /> : <Mascot size={20} glow={false} tone="tix" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-cream">{p.title}</span>
                    <span className="block truncate text-[12px] text-cream-3">
                      {when(p.startsAt)} · {p.venue}
                    </span>
                  </span>
                  <span className="shrink-0 text-[12px] text-cream-3">
                    {isPopout ? (
                      <span className="text-pop">
                        {p.filled}/{p.max}
                      </span>
                    ) : (
                      distance(km(near, p))
                    )}
                  </span>
                </button>
              );
            })}
          </>
        )}

        {places.length > 0 && (
          <>
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream-3">Places</p>
            {places.map((p) => (
              <button key={`${p.lat},${p.lng}`} type="button" onClick={() => onPickPlace(p)} className={row}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-cream-2">
                  <PinIcon />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] text-cream">{p.name}</span>
                  {p.detail && <span className="block truncate text-[12px] text-cream-3">{p.detail}</span>}
                </span>
              </button>
            ))}
          </>
        )}

        {!hits.length && !places.length && (
          <p className="px-3 py-4 text-center text-[13px] text-cream-3">{busy ? "Looking…" : query ? `Nothing for “${q}” yet` : "Nothing on the map yet"}</p>
        )}
      </div>

      <button type="button" onClick={onClose} className="sr-only">
        Close search
      </button>
    </div>
  );
}
