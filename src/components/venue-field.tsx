"use client";

import { useEffect, useRef, useState } from "react";
import { geocode, reverseGeocode, type Place } from "@/lib/geocode";
import { INDIRANAGAR } from "@/lib/types";

/**
 * "Where" — search a venue (suggestions biased to where you are), or tap "Use my location".
 * Either way writes venue/lat/lng into hidden inputs for the server action.
 */
export default function VenueField({ defaultValue, className }: { defaultValue?: Place | null; className: string }) {
  const [q, setQ] = useState(defaultValue?.name ?? "");
  const [picked, setPicked] = useState<Place | null>(defaultValue ?? null);
  const [items, setItems] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [near, setNear] = useState(INDIRANAGAR);
  const [locating, setLocating] = useState(false);
  const seq = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((p) => setNear({ lat: p.coords.latitude, lng: p.coords.longitude }), () => {}, { timeout: 5000 });
  }, []);

  useEffect(() => {
    if (picked && q === picked.name) return;
    if (q.trim().length < 2) return;
    const id = ++seq.current;
    const t = setTimeout(async () => {
      const res = await geocode(q, near, 5).catch(() => []);
      if (id === seq.current) {
        setItems(res);
        setOpen(true);
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (p: Place) => {
    setPicked(p);
    setQ(p.name);
    setOpen(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setNear(here);
        choose(await reverseGeocode(here.lat, here.lng));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const chip = "glass inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-cream";

  return (
    <div ref={box} className="flex flex-col gap-2">
      <div className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPicked(null);
        }}
        onFocus={() => items.length && setOpen(true)}
        placeholder="Search a café, park, venue…"
        required
        autoComplete="off"
        className={className}
        aria-label="Where"
      />
      {open && items.length > 0 && (
        <ul className="callout-fast absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[16px] border border-white/15 bg-ink-2 p-1 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
          {items.map((p) => (
            <li key={`${p.lat},${p.lng}`}>
              <button type="button" onClick={() => choose(p)} className="flex w-full flex-col rounded-[12px] px-3 py-2 text-left hover:bg-white/10">
                <span className="text-[14px] text-cream">{p.name}</span>
                {p.detail && <span className="text-[12px] text-cream-3">{p.detail}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      </div>

      <input type="hidden" name="venue" value={picked ? `${picked.name}${picked.detail ? `, ${picked.detail}` : ""}` : ""} />
      <input type="hidden" name="lat" value={picked?.lat ?? ""} />
      <input type="hidden" name="lng" value={picked?.lng ?? ""} />

      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={useMyLocation} className={chip} disabled={locating}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>

      {!picked && q.trim().length >= 2 && !open && <p className="text-[12px] text-cream-3">Pick a place from the list so we can pin it.</p>}
    </div>
  );
}
