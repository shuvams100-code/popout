"use client";

import { useState } from "react";
import { joinPopout } from "@/app/p/[id]/actions";
import { Mascot } from "./brand";

type Props = { popoutId: string; canPlusOne: boolean; rulesAccepted: boolean };

const RULES: [string, string][] = [
  ["Public places only.", "Cafés, parks, venues. Never someone's home."],
  ["Show up, or say you can't.", "A no-show is the one thing that gets remembered here."],
  ["No pressure, ever.", "Anyone can leave any time. Nobody owes anyone a drink, a number, or a second meet."],
  ["See something off? Report it.", "One tap on any person or message. We read every one."],
];

/** Join / Join +1. First time ever, a ground-rules sheet stands between the tap and the join. */
export default function JoinButtons({ popoutId, canPlusOne, rulesAccepted }: Props) {
  const [pending, setPending] = useState<null | boolean>(null); // plusOne choice awaiting rules

  const submit = async (plusOne: boolean) => {
    if (rulesAccepted) await joinPopout(popoutId, plusOne, false);
    else setPending(plusOne);
  };

  return (
    <>
      <form action={() => submit(false)} className="flex-1">
        <button className="btn-pop h-12 w-full text-[16px]">Join</button>
      </form>
      {canPlusOne && (
        <form action={() => submit(true)} className="flex-1">
          <button className="glass h-12 w-full rounded-full text-[14px] font-semibold text-cream" title="Take two seats — you and a friend">
            Join +1
          </button>
        </form>
      )}

      {pending !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close" onClick={() => setPending(null)} className="callout-fast absolute inset-0 bg-ink/75 backdrop-blur-[2px]" />
          <div className="glass callout-fast relative w-full max-w-md rounded-t-[24px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[24px]">
            <div className="flex items-center gap-3">
              <Mascot size={40} />
              <h2 className="font-display text-[22px] leading-tight text-cream" style={{ fontWeight: 700 }}>
                Four ground rules
              </h2>
            </div>
            <ul className="mt-4 flex flex-col gap-3">
              {RULES.map(([h, d]) => (
                <li key={h} className="flex gap-3">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-pop-soft text-[11px] font-bold text-pop">✓</span>
                  <span>
                    <span className="block text-[14px] font-semibold text-cream">{h}</span>
                    <span className="block text-[13px] text-cream-2">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <form action={() => joinPopout(popoutId, pending, true)} className="mt-5">
              <button className="btn-pop h-12 w-full text-[16px]">I&apos;m in{pending ? " · +1" : ""}</button>
            </form>
            <button type="button" onClick={() => setPending(null)} className="mt-2 w-full py-2 text-[13px] text-cream-3">
              Not now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
