"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Pin } from "@/lib/types";
import { when } from "@/lib/format";

const STYLE = "https://tiles.openfreemap.org/styles/fiord";

// Turbopack rebases import.meta.url, so MapLibre can't find its worker next to the bundle.
// Copied from node_modules/maplibre-gl/dist (worker + shared) into public/maplibre.
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

// Inline mascot markup for markers (no React inside MapLibre markers)
const MASCOT = `<svg width="30" height="30" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D4FF3F"/><stop offset=".55" stop-color="#5CFF7A"/><stop offset="1" stop-color="#12E9A8"/></linearGradient></defs><g fill="url(#pg)"><rect x="44" y="4" width="12" height="26" rx="6"/><rect x="44" y="4" width="12" height="24" rx="6" transform="rotate(-38 50 50)"/><rect x="44" y="4" width="12" height="24" rx="6" transform="rotate(38 50 50)"/><circle cx="50" cy="63" r="31"/></g><g fill="#0b0d12"><rect x="37" y="54" width="9" height="16" rx="4.5"/><rect x="54" y="54" width="9" height="16" rx="4.5"/></g></svg>`;

const MASCOT_TIX = MASCOT.replace('id="pg"', 'id="tg"').replace("url(#pg)", "url(#tg)").replace("#D4FF3F", "#FFCF4A").replace("#5CFF7A", "#FFB03B").replace("#12E9A8", "#FF6B4A");

export type Anchor = { x: number; y: number };

type Props = {
  pins: Pin[];
  center: { lat: number; lng: number };
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onAnchor: (a: Anchor | null) => void;
  focus?: { lat: number; lng: number; n: number } | null;
};

/**
 * Push the land to near-black but keep roads/water/labels lit, so the glass card
 * still has texture to blur and pins stay readable. Runs once after the style loads.
 */
function darken(m: maplibregl.Map) {
  for (const layer of m.getStyle().layers) {
    const id = layer.id;
    const set = (k: string, v: unknown) => {
      try {
        m.setPaintProperty(id, k as "background-color", v as string);
      } catch {}
    };
    if (layer.type === "background") set("background-color", "#08090c");
    else if (layer.type === "fill") {
      if (/water/.test(id)) set("fill-color", "#0d1420");
      else if (/building/.test(id)) set("fill-color", "#101218");
      else if (/park|wood|grass|landcover|landuse/.test(id)) set("fill-color", "#0b0e11");
      else set("fill-color", "#0a0b0f");
      set("fill-outline-color", "rgba(0,0,0,0)");
    } else if (layer.type === "line") {
      if (/motorway|trunk|primary/.test(id)) set("line-color", "rgba(255,255,255,0.22)");
      else if (/secondary|tertiary/.test(id)) set("line-color", "rgba(255,255,255,0.13)");
      else if (/rail|transit/.test(id)) set("line-color", "rgba(255,255,255,0.06)");
      else if (/water/.test(id)) set("line-color", "rgba(120,160,220,0.25)");
      else if (/boundary|admin/.test(id)) set("line-color", "rgba(255,255,255,0.06)");
      else set("line-color", "rgba(255,255,255,0.065)");
    } else if (layer.type === "symbol") {
      set("text-color", "rgba(250,250,247,0.42)");
      set("text-halo-color", "#08090c");
      set("text-halo-width", 1.2);
    }
  }
}

function pinLabel(p: Pin) {
  const t = when(p.startsAt);
  return p.kind === "popout" ? `${t} · <b>${p.filled}/${p.max}</b>` : `${t}${p.price ? ` · <b>${p.price}</b>` : ""}`;
}

export default function MapCanvas({ pins, center, activeId, onSelect, onAnchor, focus }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const me = useRef<maplibregl.Marker | null>(null);
  const cb = useRef({ onSelect, onAnchor, pins, activeId });
  useEffect(() => {
    cb.current = { onSelect, onAnchor, pins, activeId };
  }, [onSelect, onAnchor, pins, activeId]);

  useEffect(() => {
    if (!box.current || map.current) return;
    const m = new maplibregl.Map({
      container: box.current,
      style: STYLE,
      center: [center.lng, center.lat],
      zoom: 13.2,
      pitch: 30,
      attributionControl: false,
      fadeDuration: 0,
    });
    m.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    const labels = () => box.current?.classList.toggle("labels-on", m.getZoom() >= 13.5);
    m.on("zoom", labels);
    m.once("load", () => {
      labels();
      darken(m);
    });
    m.on("click", () => cb.current.onSelect(null));
    // A dropped tile is not an error worth a red overlay; MapLibre re-requests it on the next move
    m.on("error", (e) => {
      const err = e.error as { name?: string; message?: string; status?: number } | undefined;
      if (err?.name === "AJAXError" || /Failed to fetch/.test(err?.message ?? "")) return;
      console.warn("map:", err?.message ?? e);
    });
    // Keep the card glued to the pin while the map moves
    m.on("move", () => {
      const { pins, activeId, onAnchor } = cb.current;
      const p = pins.find((x) => x.id === activeId);
      if (!p) return;
      const pt = m.project([p.lng, p.lat]);
      onAnchor({ x: pt.x, y: pt.y });
    });
    map.current = m;
    const mks = markers.current;
    return () => {
      m.remove();
      map.current = null;
      mks.clear();
      me.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    m.easeTo({ center: [center.lng, center.lat], duration: 900 });
    if (!me.current) {
      const el = document.createElement("div");
      el.className = "pin-me";
      me.current = new maplibregl.Marker({ element: el }).setLngLat([center.lng, center.lat]).addTo(m);
    } else {
      me.current.setLngLat([center.lng, center.lat]);
    }
  }, [center.lat, center.lng]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const seen = new Set<string>();
    for (const p of pins) {
      seen.add(p.id);
      let mk = markers.current.get(p.id);
      if (!mk) {
        const el = document.createElement("div");
        el.className = `pin ${p.kind === "event" ? "pin-event" : "pin-popout"}`;
        // MapLibre writes an inline transform on `el` every frame, so all our own transforms live on .pin-body
        el.innerHTML = `<span class="pin-body">${p.kind === "popout" ? `<span class="pin-halo"></span>${MASCOT}` : MASCOT_TIX}<span class="pin-label">${pinLabel(p)}</span></span>`;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          cb.current.onSelect(cb.current.activeId === p.id ? null : p.id);
        });
        mk = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([p.lng, p.lat]).addTo(m);
        markers.current.set(p.id, mk);
      }
      const el = mk.getElement();
      el.classList.toggle("is-active", p.id === activeId);
      el.classList.toggle("is-past", new Date(p.startsAt).getTime() < Date.now());
    }
    for (const [id, mk] of markers.current) {
      if (!seen.has(id)) {
        mk.remove();
        markers.current.delete(id);
      }
    }
  }, [pins, activeId]);

  // Search result: fly there
  const hadFocus = useRef(false);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (focus) {
      hadFocus.current = true;
      m.flyTo({ center: [focus.lng, focus.lat], zoom: 14, duration: 1200, essential: true });
    } else if (hadFocus.current) {
      hadFocus.current = false;
      m.flyTo({ center: [center.lng, center.lat], zoom: 13.2, duration: 1000, essential: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  // Selecting a pin: nudge it into the lower half so the card has room above, then report its anchor
  useEffect(() => {
    const m = map.current;
    const p = pins.find((x) => x.id === activeId);
    if (!m || !p) {
      onAnchor(null);
      return;
    }
    const pt = m.project([p.lng, p.lat]);
    onAnchor({ x: pt.x, y: pt.y });
    m.easeTo({ center: [p.lng, p.lat], offset: [0, 120], duration: 600, zoom: Math.max(m.getZoom(), 14) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <div className="map-atmosphere absolute inset-0">
      <div ref={box} className="h-full w-full" />
    </div>
  );
}
