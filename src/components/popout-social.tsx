"use client";

import { useState } from "react";
import { Avatar, Verified } from "./brand";
import { Seats } from "./pin-card";
import Thread from "./thread";
import { blockUser, removeMember, report } from "@/app/p/[id]/actions";

type Person = { id: string; name: string; verified?: boolean };
type Target = { type: "profile" | "popout" | "message"; id: string; label: string; person?: Person };

type Props = {
  popoutId: string;
  title: string;
  host: Person;
  members: Person[]; // includes host
  max: number;
  me: Person | null;
  isHost: boolean;
  isMember: boolean;
};

const REASONS = ["Didn't show up", "Harassment or creepy", "Fake or spam", "Felt unsafe", "Something else"];

export default function PopoutSocial({ popoutId, title, host, members, max, me, isHost, isMember }: Props) {
  const [target, setTarget] = useState<Target | null>(null);
  const [reporting, setReporting] = useState(false);
  const back = `/p/${popoutId}`;
  const names = Object.fromEntries(members.map((m) => [m.id, m.name]));
  const verified = Object.fromEntries(members.map((m) => [m.id, !!m.verified]));

  const openPerson = (p: Person) => {
    if (!me || p.id === me.id) return;
    setTarget({ type: "profile", id: p.id, label: p.name.split(" ")[0], person: p });
    setReporting(false);
  };

  return (
    <>
      {/* Going */}
      <section className="reveal mt-4" style={{ animationDelay: "300ms" }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] uppercase tracking-[0.12em] text-cream-3">Going</h2>
          <span className="flex items-center gap-3 text-[13px] text-cream-2">
            <span className="flex items-center gap-2">
              <Seats filled={members.length} max={max} />
              {members.length}/{max}
            </span>
            {me && (
              <button
                type="button"
                onClick={() => {
                  setTarget({ type: "popout", id: popoutId, label: title });
                  setReporting(false);
                }}
                aria-label="More"
                className="glass grid h-7 w-7 place-items-center rounded-full text-cream"
              >
                ···
              </button>
            )}
          </span>
        </div>
        <ul className="flex flex-wrap gap-2">
          {members.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => openPerson(m)}
                className={`glass flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13px] text-cream ${me && m.id !== me.id ? "" : "cursor-default"}`}
              >
                <Avatar seed={m.id} size={24} />
                {m.name.split(" ")[0]}
                {m.verified && <Verified size={13} />}
                {m.id === host.id && <span className="rounded-full bg-pop-soft px-1.5 py-0.5 text-[10px] font-semibold text-pop">Host</span>}
              </button>
            </li>
          ))}
          {Array.from({ length: Math.max(0, max - members.length) }).map((_, i) => (
            <li key={`empty-${i}`} className="rounded-full border border-dashed border-line px-3 py-1 text-[13px] text-cream-3">
              open seat
            </li>
          ))}
        </ul>
      </section>

      {/* Thread */}
      {isMember && me && (
        <section className="reveal mt-8" style={{ animationDelay: "360ms" }}>
          <h2 className="mb-2 text-[13px] uppercase tracking-[0.12em] text-cream-3">Group chat</h2>
          <Thread
            popoutId={popoutId}
            me={me}
            names={names}
            verified={verified}
            onReport={(m) => {
              setTarget({ type: "message", id: String(m.id), label: `"${m.body.slice(0, 40)}${m.body.length > 40 ? "…" : ""}"`, person: { id: m.user_id, name: names[m.user_id] ?? "Someone" } });
              setReporting(true);
            }}
          />
        </section>
      )}

      {/* Safety sheet */}
      {target && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close" onClick={() => setTarget(null)} className="callout-fast absolute inset-0 bg-ink/70 backdrop-blur-[2px]" />
          <div className="glass callout-fast relative w-full max-w-md rounded-t-[24px] p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:rounded-[24px]">
            <div className="flex items-center gap-3 px-3 py-3">
              {target.person && (
                <span className="relative">
                  <Avatar seed={target.person.id} size={36} />
                  {target.person.verified && <Verified size={14} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-ink" />}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[15px] text-cream">{target.label}</p>
                <p className="text-[12px] text-cream-3">{target.type === "profile" ? "Member" : target.type === "popout" ? "This Popout" : `Message from ${target.person?.name.split(" ")[0]}`}</p>
              </div>
            </div>

            {reporting ? (
              <form action={report} className="flex flex-col gap-1 p-1">
                <input type="hidden" name="subject_type" value={target.type} />
                <input type="hidden" name="subject_id" value={target.id} />
                <input type="hidden" name="back" value={back} />
                {REASONS.map((r) => (
                  <button key={r} name="reason" value={r} className="rounded-[14px] px-3.5 py-2.5 text-left text-[14px] text-cream hover:bg-white/10">
                    {r}
                  </button>
                ))}
                <button type="button" onClick={() => setReporting(false)} className="mt-1 rounded-[14px] px-3.5 py-2.5 text-left text-[13px] text-cream-3 hover:bg-white/10">
                  Back
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-1 p-1">
                <button type="button" onClick={() => setReporting(true)} className="rounded-[14px] px-3.5 py-2.5 text-left text-[14px] text-cream hover:bg-white/10">
                  Report {target.type === "popout" ? "this Popout" : target.type === "profile" ? target.label : "message"}
                </button>
                {target.type === "popout" && host.id !== me?.id && (
                  <>
                    <button type="button" onClick={() => setTarget({ type: "profile", id: host.id, label: host.name.split(" ")[0], person: host })} className="rounded-[14px] px-3.5 py-2.5 text-left text-[14px] text-cream hover:bg-white/10">
                      Report the host
                    </button>
                    <form action={blockUser.bind(null, host.id, back)}>
                      <button className="w-full rounded-[14px] px-3.5 py-2.5 text-left text-[14px] text-tix hover:bg-white/10">Block the host</button>
                    </form>
                  </>
                )}
                {target.person && target.type !== "popout" && (
                  <form action={blockUser.bind(null, target.person.id, back)}>
                    <button className="w-full rounded-[14px] px-3.5 py-2.5 text-left text-[14px] text-tix hover:bg-white/10">Block {target.person.name.split(" ")[0]}</button>
                  </form>
                )}
                {isHost && target.person && target.person.id !== host.id && (
                  <form action={removeMember.bind(null, popoutId, target.person.id)}>
                    <button className="w-full rounded-[14px] px-3.5 py-2.5 text-left text-[14px] text-tix hover:bg-white/10">Remove from this Popout</button>
                  </form>
                )}
                <button type="button" onClick={() => setTarget(null)} className="mt-1 rounded-[14px] px-3.5 py-2.5 text-center text-[13px] text-cream-3 hover:bg-white/10">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
