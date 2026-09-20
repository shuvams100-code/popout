import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import { Seats } from "@/components/pin-card";
import { Avatar, Verified } from "@/components/brand";
import { whenLong } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

async function load(id: string) {
  const supabase = await createClient();
  const [{ data: event }, { data: crews }] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("popouts")
      .select("id,title,max_people,starts_at,host:profiles!host_id(id,name,verified_at),members:popout_members(status,plus_one)")
      .eq("event_id", id)
      .eq("status", "open")
      .order("starts_at"),
  ]);
  return { event, crews: crews ?? [] };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const { event } = await load(id);
  if (!event) return { title: "Event" };
  const desc = `${whenLong(event.starts_at)} · ${event.venue}`;
  return { title: event.title, description: desc, openGraph: { title: event.title, description: desc, siteName: "Popout" } };
}

export default async function EventPage({ params }: Params) {
  const { id } = await params;
  const { event, crews } = await load(id);
  if (!event) notFound();

  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader />
      <article className="mx-auto max-w-md px-5 pb-32 pt-6">
        <p className="reveal mb-3 text-[11px] uppercase tracking-[0.14em] text-tix">Event{event.organizer ? ` · ${event.organizer}` : ""}</p>
        <h1 className="reveal font-display text-[36px] leading-[1.02] text-cream" style={{ fontWeight: 700, animationDelay: "60ms" }}>
          {event.title}
        </h1>
        <dl className="reveal mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]" style={{ animationDelay: "120ms" }}>
          <dt className="text-cream-3">When</dt>
          <dd className="text-cream">{whenLong(event.starts_at)}</dd>
          <dt className="text-cream-3">Where</dt>
          <dd className="text-cream">{event.venue}</dd>
          <dt className="text-cream-3">Price</dt>
          <dd className="text-cream">{event.price ?? "Free"}</dd>
        </dl>

        {event.booking_url && (
          <a
            href={event.booking_url}
            target="_blank"
            rel="noreferrer"
            className="reveal mt-6 block rounded-full border border-line-strong py-3 text-center text-[15px] text-cream transition hover:bg-ink-2"
            style={{ animationDelay: "180ms" }}
          >
            Book on organizer&apos;s page ↗
          </a>
        )}

        <section className="reveal mt-10" style={{ animationDelay: "240ms" }}>
          <h2 className="font-display text-[26px] leading-tight text-cream" style={{ fontWeight: 700 }}>
            Going alone?{" "}<span className="text-grad">Find people to go with.</span>
          </h2>
          <p className="mt-2 text-[14px] text-cream-2">Join a crew that&apos;s already forming, or start one.</p>

          <ul className="mt-4 flex flex-col gap-3">
            {crews.map((c) => {
              const host = c.host as unknown as { id: string; name: string; verified_at: string | null };
              const filled = (c.members as { status: string; plus_one: boolean }[]).filter((m) => m.status !== "dropped" && m.status !== "removed").reduce((a, m) => a + (m.plus_one ? 2 : 1), 0);
              return (
                <li key={c.id}>
                  <Link href={`/p/${c.id}`} className="flex items-center gap-3 rounded-[22px] border border-line bg-ink-2 p-3 transition hover:border-line-strong">
                    <span className="glass relative grid h-10 w-10 place-items-center rounded-full">
                      <Avatar seed={host.id} size={30} />
                      {host.verified_at && <Verified size={14} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-ink" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] text-cream">{host.name.split(" ")[0]}&apos;s crew</p>
                      <p className="text-[13px] text-cream-2">{whenLong(c.starts_at)}</p>
                    </div>
                    <span className="flex items-center gap-2 text-[13px] text-cream-2">
                      <Seats filled={filled} max={c.max_people} />
                      {filled}/{c.max_people}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            href={`/new?event=${event.id}`}
            className="btn-pop mt-4 block py-3.5 text-center text-[16px]"
          >
            Start a crew
          </Link>
        </section>
      </article>
    </main>
  );
}
