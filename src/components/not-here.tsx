"use client";

import { useState } from "react";
import { Mascot } from "./brand";
import { requestLaunch } from "@/app/launch/actions";

type Props = { city: string; lat?: number; lng?: number; signedIn: boolean; onClose: () => void };

/** Outside Bangalore. Say so plainly, and turn the disappointment into a data point. */
export default function NotHere({ city, lat, lng, signedIn, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  const go = async () => {
    setState("busy");
    const r = await requestLaunch({ city, lat, lng, email: signedIn ? undefined : email });
    setState(r.ok ? "done" : "error");
  };

  return (
    <div className="glass callout-fast pointer-events-auto absolute inset-x-4 top-[calc(50%-10px)] z-30 mx-auto max-w-md -translate-y-1/2 rounded-[24px] p-5">
      <button type="button" onClick={onClose} aria-label="Close" className="glass absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-cream">
        ×
      </button>
      <div className="flex items-start gap-4">
        <Mascot size={56} live />
        <div className="min-w-0">
          <p className="font-display text-[22px] leading-tight text-cream" style={{ fontWeight: 700 }}>
            Not in {city} yet
          </p>
          <p className="mt-1 text-[13px] text-cream-2">Popout is Bangalore-only right now — nothing to join here, nobody to host for. Yet.</p>
        </div>
      </div>

      {state === "done" ? (
        <div className="mt-4 flex items-center gap-3 rounded-[16px] bg-pop-soft px-4 py-3 text-[14px] text-cream">
          <span className="text-pop">✓</span> Noted. {city} moves up the list every time someone asks.
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-[14px] text-cream">Want Popout in {city}?</p>
          {!signedIn && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com — so we can tell you"
              className="glass mt-2 w-full rounded-[14px] px-3.5 py-2.5 text-[14px] text-cream placeholder:text-cream-3 outline-none"
            />
          )}
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={go} disabled={state === "busy" || (!signedIn && !email)} className="btn-pop h-11 flex-1 text-[15px] disabled:opacity-50">
              {state === "busy" ? "Saving…" : "Yes, launch here"}
            </button>
            <button type="button" onClick={onClose} className="glass h-11 rounded-full px-4 text-[13px] text-cream-2">
              Just looking
            </button>
          </div>
          {state === "error" && <p className="mt-2 text-[12px] text-tix">Didn&apos;t save. Try again.</p>}
        </div>
      )}
    </div>
  );
}
