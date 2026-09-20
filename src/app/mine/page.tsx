import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/site-header";
import { Avatar, Mascot } from "@/components/brand";
import { Seats } from "@/components/pin-card";
import { when } from "@/lib/format";
import { createClient, getViewer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = { id: string; title: string; venue: string; starts_at: string; status: string; max_people: number; host_id: string; host_name: string; seats: number; unread: number; last_message: string | null; last_sender: string | null; last_at: string | null };

export default async function MinePage() {
  const user = await getViewer();
  if (!user) redirect("/welcome?next=%2Fmine");
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_popouts");
  const rows = (data ?? []) as Row[];
  const open = rows.filter((r) => r.status === "open");
  const past = rows.filter((r) => r.status !== "open");

  const Card = ({ r }: { r: Row }) => (
    <Link href={`/p/${r.id}`} className={`glass block rounded-[20px] p-4 ${r.unread ? "border-pop/40" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display truncate text-[18px] leading-tight text-cream" style={{ fontWeight: 600 }}>
            {r.title}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-cream-3">
            {when(r.starts_at)} · {r.venue}
          </p>
        </div>
        {r.unread ? <span className="shrink-0 rounded-full bg-pop px-2 py-0.5 text-[11px] font-bold text-ink">{r.unread} new</span> : <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-cream-3"><Seats filled={r.seats} max={r.max_people} />{r.seats}/{r.max_people}</span>}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[13px]">
        <Avatar seed={r.host_id} size={20} />
        {r.last_message ? (
          <span className={`truncate ${r.unread ? "text-cream" : "text-cream-2"}`}>
            <b className="font-semibold">{r.last_sender?.split(" ")[0] ?? "Someone"}:</b> {r.last_message}
          </span>
        ) : (
          <span className="text-cream-3">{r.host_id === user.id ? "You're hosting · no messages yet" : `${r.host_name.split(" ")[0]} is hosting · say hi`}</span>
        )}
      </div>
    </Link>
  );

  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader />
      <div className="mx-auto max-w-md px-5 pb-16 pt-4 sm:max-w-lg">
        <h1 className="reveal font-display text-[30px] text-cream" style={{ fontWeight: 700 }}>My Popouts</h1>
        {rows.length === 0 && (
          <div className="glass reveal mt-6 flex items-center gap-3 rounded-[20px] p-4 text-[14px] text-cream-2">
            <Mascot size={40} /> Nothing yet. Join one on the map, or start your own.
          </div>
        )}
        {open.length > 0 && (
          <section className="reveal mt-5" style={{ animationDelay: "60ms" }}>
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream-3">Upcoming</h2>
            <div className="flex flex-col gap-3">{open.map((r) => <Card key={r.id} r={r} />)}</div>
          </section>
        )}
        {past.length > 0 && (
          <section className="reveal mt-8" style={{ animationDelay: "120ms" }}>
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream-3">Happened</h2>
            <div className="flex flex-col gap-3 opacity-70">{past.map((r) => <Card key={r.id} r={r} />)}</div>
          </section>
        )}
      </div>
    </main>
  );
}
