"use client";

import { useEffect, useRef, useState } from "react";

export type Place = { name: string; detail: string; lat: number; lng: number };

type Props = { near: { lat: number; lng: number }; onPick: (p: Place) => void; className?: string };

// ponytail: Photon (komoot) is free, CORS-open, no key. Swap the URL if it rate-limits us.
async function geocode(q: string, near: { lat: number; lng: number }): Promise<Place[]> {
  const u = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lat=${near.lat}&lon=${near.lng}&lang=en`;
  const r = await fetch(u);
  if (!r.ok) return [];
  const j = (await r.json()) as { features: { properties: Record<string, string>; geometry: { coordinates: [number, number] } }[] };
  return j.features.map((f) => {
    const p = f.properties;
    const name = p.name ?? p.street ?? p.city ?? q;
    const detail = [p.district, p.city, p.state].filter((x) => x && x !== name).join(", ");
    return { name, detail, lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] };
  });
}

export default function SearchBar({ near, onPick, className = "" }: Props) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  // Debounced suggestions
  useEffect(() => {
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    const id = ++seq.current;
    const t = setTimeout(async () => {
      const res = await geocode(q, near).catch(() => []);
      if (id === seq.current) {
        setItems(res);
        setHi(0);
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

  const pick = (p: Place) => {
    setQ(p.name);
    setOpen(false);
    onPick(p);
  };

  const submit = async () => {
    if (!q.trim()) return;
    if (items[hi]) return pick(items[hi]);
    setBusy(true);
    const res = await geocode(q, near).catch(() => []);
    setBusy(false);
    if (res[0]) pick(res[0]);
  };

  return (
    <div ref={box} className={`relative ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.09] p-1 pl-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="shrink-0 text-cream-3" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => items.length && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !items.length) return;
            if (e.key === "ArrowDown") (e.preventDefault(), setHi((h) => (h + 1) % items.length));
            if (e.key === "ArrowUp") (e.preventDefault(), setHi((h) => (h - 1 + items.length) % items.length));
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search a place — Koramangala, Church Street…"
          aria-label="Search location"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-2 text-[14px] text-cream placeholder:text-cream-3 focus:outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setItems([]);
            }}
            aria-label="Clear"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-cream-3 hover:bg-white/10 hover:text-cream"
          >
            ×
          </button>
        )}
        <button type="submit" aria-label="Search" className="btn-pop grid h-9 w-9 shrink-0 place-items-center" disabled={busy}>
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </button>
      </form>

      {open && items.length > 0 && (
        <ul
          role="listbox"
          className="callout-fast absolute inset-x-0 top-[calc(100%+8px)] overflow-hidden rounded-[20px] border border-white/15 bg-ink/80 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
        >
          {items.map((p, i) => (
            <li key={`${p.lat},${p.lng}`} role="option" aria-selected={i === hi}>
              <button
                type="button"
                onMouseEnter={() => setHi(i)}
                onClick={() => pick(p)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${i === hi ? "bg-white/10" : ""}`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pop-soft text-pop">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] text-cream">{p.name}</span>
                  {p.detail && <span className="block truncate text-[12px] text-cream-3">{p.detail}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
