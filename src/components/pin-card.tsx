"use client";

import Link from "next/link";
import type { Pin } from "@/lib/types";
import { when, km, distance } from "@/lib/format";
import { Mascot, Avatar } from "./brand";

type Props = {
  pin: Pin;
  origin: { lat: number; lng: number };
  active?: boolean;
  onFocus?: () => void;
  wide?: boolean;
};

export function Seats({ filled, max }: { filled: number; max: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`${filled} of ${max} joined`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`h-2 w-2 rounded-full ${i < filled ? "bg-grad" : "border border-cream-3"}`} />
      ))}
    </span>
  );
}

export default function PinCard({ pin, origin, active, onFocus, wide }: Props) {
  const href = pin.kind === "popout" ? `/p/${pin.id}` : `/e/${pin.id}`;
  const isPopout = pin.kind === "popout";
  const dist = distance(km(origin, pin));
  const full = isPopout && pin.filled! >= pin.max!;

  return (
    <Link
      href={href}
      onMouseEnter={onFocus}
      onFocus={onFocus}
      className={[
        "group relative block shrink-0 rounded-[22px] border p-4 transition-all duration-300 backdrop-blur-md",
        wide ? "w-full" : "w-[272px]",
        active ? "border-pop/50 bg-ink-2" : "border-line bg-ink-2/85 hover:border-line-strong",
      ].join(" ")}
    >
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em]">
        <span className={`inline-flex items-center gap-1.5 ${isPopout ? "text-pop" : "text-tix"}`}>
          {isPopout ? <Mascot size={14} glow={false} /> : <Mascot size={14} glow={false} tone="tix" />}
          {isPopout ? (pin.eventId ? "Crew" : "Popout") : "Event"}
        </span>
        <span className="text-cream-3">{dist}</span>
      </div>
      <h3 className="font-display text-[20px] leading-[1.1] text-cream" style={{ fontWeight: 600 }}>
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
        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[12px] text-cream-2">
          <Avatar seed={pin.host.id} size={20} />
          <span>{pin.host.name.split(" ")[0]} is hosting</span>
        </div>
      )}
    </Link>
  );
}
