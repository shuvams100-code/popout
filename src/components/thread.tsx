"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, Verified } from "./brand";

type Msg = { id: number; user_id: string; sender_name: string | null; body: string; created_at: string };
type Props = { popoutId: string; me: { id: string; name: string }; names: Record<string, string>; verified: Record<string, boolean>; onReport: (m: Msg) => void };

const clock = (iso: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));

/** Members-only realtime thread. RLS decides who can read/post; this just renders and subscribes. */
export default function Thread({ popoutId, me, names, verified, onReport }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    supabase
      .from("messages")
      .select("id,user_id,sender_name,body,created_at")
      .eq("popout_id", popoutId)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => alive && data && setMsgs(data));
    supabase.rpc("mark_read", { p: popoutId }).then(() => {});

    const ch = supabase
      .channel(`thread:${popoutId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `popout_id=eq.${popoutId}` }, (payload) => {
        const m = payload.new as Msg;
        setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        if (document.visibilityState === "visible") supabase.rpc("mark_read", { p: popoutId }).then(() => {});
      })
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [popoutId, supabase]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    const { error } = await supabase.from("messages").insert({ popout_id: popoutId, user_id: me.id, sender_name: me.name, body });
    if (error) setText(body);
    setSending(false);
  };

  return (
    <div className="flex flex-col">
      <div className="flex max-h-[50dvh] min-h-[160px] flex-col gap-2.5 overflow-y-auto py-2">
        {msgs.length === 0 && <p className="py-6 text-center text-[13px] text-cream-3">Say hi. Sort out where to meet.</p>}
        {msgs.map((m) => {
          const mine = m.user_id === me.id;
          const name = m.sender_name ?? names[m.user_id] ?? "Someone";
          return (
            <div key={m.id} className={`group flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              {!mine && <Avatar seed={m.user_id} size={26} className="shrink-0" />}
              <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                {!mine && (
                  <span className="mb-0.5 inline-flex items-center gap-1 px-1 text-[11px] text-cream-3">
                    {name.split(" ")[0]}
                    {verified[m.user_id] && <Verified size={11} />}
                  </span>
                )}
                <div className={`rounded-[18px] px-3.5 py-2 text-[14px] leading-snug ${mine ? "rounded-br-[6px] bg-grad text-ink" : "glass rounded-bl-[6px] text-cream"}`}>{m.body}</div>
                <span className="mt-0.5 flex items-center gap-2 px-1 text-[10px] text-cream-3">
                  {clock(m.created_at)}
                  {!mine && (
                    <button type="button" onClick={() => onReport(m)} className="opacity-0 transition group-hover:opacity-100 focus:opacity-100 hover:text-tix">
                      report
                    </button>
                  )}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="glass mt-2 flex items-center gap-1 rounded-full p-1 pl-4"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          placeholder="Message the group…"
          aria-label="Message"
          className="min-w-0 flex-1 bg-transparent py-2 text-[14px] text-cream placeholder:text-cream-3 focus:outline-none"
        />
        <button type="submit" aria-label="Send" disabled={!text.trim() || sending} className="btn-pop grid h-9 w-9 shrink-0 place-items-center disabled:opacity-50">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
}
