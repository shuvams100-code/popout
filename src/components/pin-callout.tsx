"use client";

import Link from "next/link";
import type { Pin } from "@/lib/types";
import type { Anchor } from "./map-canvas";
import { when, km, distance } from "@/lib/format";
import { Seats } from "./pin-card";
import { Mascot, Avatar, Verified } from "./brand";

const LINE = 64; // px from pin centre up to the card
const W = 300;

type Props = { pin: Pin; anchor: Anchor; origin: { lat: number; lng: number }; onClose: () => void };

export default function PinCallout({ pin, anchor, origin, onClose }: Props) {
  const isPopout = pin.kind === "popout";
  const full = isPopout && pin.filled! >= pin.max!;
  const href = isPopout ? `/p/${pin.id}` : `/e/${pin.id}`;

  // Card sits above the pin, centred, clamped inside the viewport with 12px gutters
  const vw = typeof window === "undefined" ? 400 : window.innerWidth;
  const w = Math.min(W, vw - 24);
  const left = Math.min(Math.max(12, anchor.x - w / 2), vw - w - 12);
  const top = anchor.y - LINE;

  return (
    <div key={pin.id} className="pointer-events-none absolute inset-0 z-20">
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <line
          x1={anchor.x}
          y1={anchor.y - 18}
          x2={anchor.x}
          y2={anchor.y - LINE + 6}
          stroke={isPopout ? "#5cff7a" : "#ffb03b"}
          strokeWidth="2"
          strokeLinecap="round"
          className="leader"
        />
        <circle cx={anchor.x} cy={anchor.y - LINE + 6} r="3.5" fill={isPopout ? "#5cff7a" : "#ffb03b"} className="leader-dot" />
      </svg>

      <div
        className="callout pointer-events-auto absolute"
        style={{ left, top, width: w, transform: "translateY(-100%)" }}
        role="dialog"
        aria-label={pin.title}
      >
        <div className="glass rounded-[22px] p-4">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em]">
            <span className={`inline-flex items-center gap-1.5 ${isPopout ? "text-pop" : "text-tix"}`}>
              {isPopout ? <Mascot size={14} glow={false} /> : <Mascot size={14} glow={false} tone="tix" />}
              {isPopout ? (pin.eventId ? "Crew" : "Popout") : "Event"}
            </span>
            <span className="flex items-center gap-3 text-cream-3">
              {distance(km(origin, pin))}
              <button onClick={onClose} aria-label="Close" className="glass grid h-6 w-6 place-items-center rounded-full text-cream">
                ×
              </button>
            </span>
          </div>
          <h3 className="font-display text-[21px] leading-[1.1] text-cream" style={{ fontWeight: 600 }}>
            {pin.title}
          </h3>
          <p className="mt-1 truncate text-[13px] text-cream-2">{pin.venue}</p>
          <div className="mt-3 flex items-center justify-between text-[13px]">
            <span className="font-semibold text-cream">{when(pin.startsAt)}</span>
            {isPopout ? (
              <span className="flex items-center gap-2">
                <Seats filled={pin.filled!} max={pin.max!} />
                <span className={full ? "text-cream-3" : "text-cream-2"}>{full ? "Full" : `${pin.max! - pin.filled!} left`}</span>
              </span>
            ) : (
              <span className="font-semibold text-tix">{pin.price ?? "Free"}</span>
            )}
          </div>
          {isPopout && pin.host && (
            <div className="mt-3 flex items-center gap-2 text-[12px] text-cream-2">
              <Avatar seed={pin.host.id} size={20} />
              <span className="inline-flex items-center gap-1">
                {pin.host.name.split(" ")[0]} is hosting
                {pin.host.verified && <Verified size={13} />}
              </span>
              {pin.verifiedOnly && <span className="ml-auto rounded-full bg-pop-soft px-1.5 py-0.5 text-[10px] font-semibold text-pop">Verified only</span>}
            </div>
          )}
          <Link href={href} className="btn-pop mt-4 block py-2.5 text-center text-[15px]">
            {isPopout ? (full ? "See who's going" : "Join") : "Details"}
          </Link>
        </div>
      </div>
    </div>
  );
}
