import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import { whenLong } from "@/lib/format";
import { createClient, getViewer } from "@/lib/supabase/server";
import { signInWithGoogle } from "@/app/auth/actions";
import { cache } from "react";
import ShareButton from "@/components/share-button";
import { Avatar, Verified } from "@/components/brand";
import PopoutSocial from "@/components/popout-social";
import Gate from "@/components/gate";
import { joinPopout, leavePopout } from "./actions";

const ERRORS: Record<string, string> = {
  popout_full: "Just filled up. Try another one nearby.",
  popout_started: "This one already started.",
  popout_not_open: "This Popout isn't open any more.",
  not_eligible: "This one has an age or gender filter you don't match.",
  not_verified: "This one is for face-verified people only. Verify from your profile — takes a minute.",
  unknown: "Couldn't do that. Try again.",
};

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; joined?: string; error?: string; reported?: string; confirmed?: string; done?: string }> };

// cache(): generateMetadata and the page share one query per request
const load = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("popouts")
    .select(
      "*, host:profiles!host_id(id,name,age,bio,verified_at), event:events(id,title,booking_url,price), members:popout_members(status,user:profiles(id,name,verified_at))",
    )
    .eq("id", id)
    .maybeSingle();
  const now = Date.now();
  return data && { ...data, now, started: new Date(data.starts_at).getTime() < now };
});

const loadStats = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("profile_stats").select("attended,no_shows,hosted").eq("id", id).maybeSingle();
  return data ?? { attended: 0, no_shows: 0, hosted: 0 };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const p = await load(id);
  if (!p) return { title: "Popout" };
  const h = p.host as unknown as { name: string; age: number | null };
  const n = (p.members as unknown as { status: string }[]).filter((m) => m.status !== "dropped" && m.status !== "removed").length;
  const left = p.max_people - n;
  const desc = `${whenLong(p.starts_at)} · ${p.venue} · ${h.name.split(" ")[0]}${h.age ? `, ${h.age}` : ""} is hosting · ${left > 0 ? `${left} seat${left === 1 ? "" : "s"} left` : "Full"}`;
  return {
    title: p.title,
    description: desc,
    openGraph: { title: p.title, description: desc, type: "website", siteName: "Popout" },
    twitter: { card: "summary", title: p.title, description: desc },
  };
}

export default async function PopoutPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { created, joined, error, reported, confirmed, done } = await searchParams;
  const p = await load(id);
  if (!p) notFound();

  const supabase = await createClient();
  const hostId = (p.host as unknown as { id: string }).id;
  const [user, { data: blockedIds }, stats] = await Promise.all([getViewer(), supabase.rpc("my_blocked_ids"), loadStats(hostId)]);
  const reliable = stats.attended >= 3 && stats.no_shows === 0;
  if (((blockedIds as string[] | null) ?? []).includes(hostId)) {
    return (
      <main className="min-h-dvh bg-ink">
        <SiteHeader />
        <p className="mx-auto max-w-md px-5 pt-16 text-center text-[15px] text-cream-2">This Popout isn&apos;t available to you.</p>
      </main>
    );
  }

  type Member = { status: string; user: { id: string; name: string; verified_at: string | null } };
  const host = p.host as unknown as { id: string; name: string; age: number | null; bio: string | null; verified_at: string | null };
  const event = p.event as unknown as { id: string; title: string; booking_url: string | null; price: string | null } | null;
  const members = (p.members as unknown as Member[]).filter((m) => m.status !== "dropped" && m.status !== "removed");
  const filled = members.length;
  const full = filled >= p.max_people;
  const mine = members.some((m) => m.user.id === user?.id);
  const isHost = user?.id === host.id;
  const started = p.started;

  const shareText = `${isHost ? "I'm" : `${host.name.split(" ")[0]} is`} doing "${p.title}" — ${whenLong(p.starts_at)}, ${p.venue}. Want to come?`;

  const eligibility = [
    p.gender_pref === "women_only" ? "Women only" : p.gender_pref === "men_only" ? "Men only" : "Anyone",
    p.min_age || p.max_age ? `${p.min_age ?? 18}–${p.max_age ?? 99}` : null,
    p.verified_only ? "face-verified only" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader />
      <article className="mx-auto max-w-md px-5 pb-32 pt-6">
        {(created || joined) && (
          <div className="glass reveal mb-5 flex items-center gap-3 rounded-[18px] p-3.5 text-[14px] text-cream">
            <span className="text-[20px]">🎉</span>
            <span className="flex-1">
              {created ? "It's live. Share it so it fills up." : "You're in. Bring a friend?"}
            </span>
            <ShareButton text={shareText} path={`/p/${p.id}`} label="Share" className="btn-pop shrink-0 px-4 py-2 text-[14px]" />
          </div>
        )}
        {error && <p className="mb-4 text-[13px] text-tix">{ERRORS[error] ?? ERRORS.unknown}</p>}
        {reported && <p className="glass mb-4 rounded-[14px] px-3.5 py-2.5 text-[13px] text-cream-2">Thanks — we&apos;ve got the report and will look.</p>}
        {confirmed && <p className="glass mb-4 rounded-[14px] px-3.5 py-2.5 text-[13px] text-cream">See you there. 🙌</p>}
        {done && <p className="glass mb-4 rounded-[14px] px-3.5 py-2.5 text-[13px] text-cream">Closed. Attendance is on everyone&apos;s profile now.</p>}
        <p className="reveal mb-3 text-[11px] uppercase tracking-[0.14em] text-pop">{event ? "Crew" : "Popout"}</p>
        <h1 className="reveal font-display text-[36px] leading-[1.02] text-cream" style={{ fontWeight: 700, animationDelay: "60ms" }}>
          {p.title}
        </h1>

        <dl className="reveal mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]" style={{ animationDelay: "120ms" }}>
          <dt className="text-cream-3">When</dt>
          <dd className="text-cream">{whenLong(p.starts_at)}</dd>
          <dt className="text-cream-3">Where</dt>
          <dd className="text-cream">
            {p.venue}
            <a
              className="ml-2 text-[13px] text-cream-2 underline decoration-line-strong underline-offset-4"
              href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              directions
            </a>
          </dd>
          <dt className="text-cream-3">Who</dt>
          <dd className="text-cream">{eligibility}</dd>
        </dl>

        {p.description && (
          <p className="reveal mt-6 text-[17px] leading-[1.45] text-cream-2" style={{ animationDelay: "180ms" }}>
            “{p.description}”
          </p>
        )}

        <section className="reveal mt-8 rounded-[22px] border border-line bg-ink-2 p-4" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center gap-3">
            <span className="glass relative grid h-12 w-12 place-items-center rounded-full">
              <Avatar seed={host.id} size={38} />
              {host.verified_at && <Verified size={16} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-ink" />}
            </span>
            <div className="min-w-0">
              <p className="text-[15px] text-cream">
                {host.name}
                {host.age ? <span className="text-cream-3">, {host.age}</span> : null}
                <span className="ml-2 rounded-full bg-pop-soft px-2 py-0.5 text-[11px] text-pop">Host</span>
              </p>
              {host.bio && <p className="truncate text-[13px] text-cream-2">{host.bio}</p>}
              <p className="mt-0.5 text-[12px] text-cream-3">
                {stats.attended} attended · {stats.no_shows} no-show{stats.no_shows === 1 ? "" : "s"}
                {reliable && <span className="ml-2 rounded-full bg-pop-soft px-1.5 py-0.5 text-[10px] font-semibold text-pop">Reliable</span>}
              </p>
            </div>
          </div>
        </section>

        <Gate
          popoutId={p.id}
          startsAt={p.starts_at}
          status={p.status}
          members={members.map((m) => ({ id: m.user.id, name: m.user.name, status: m.status }))}
          hostId={host.id}
          me={user?.id ?? null}
          isHost={isHost}
          now={p.now}
        />

        <PopoutSocial
          popoutId={p.id}
          title={p.title}
          host={{ id: host.id, name: host.name }}
          members={members.map((m) => ({ id: m.user.id, name: m.user.name, verified: !!m.user.verified_at }))}
          max={p.max_people}
          me={user ? { id: user.id, name: user.name } : null}
          isHost={isHost}
          isMember={mine}
        />

        {event && (
          <section className="reveal mt-6 rounded-[22px] border border-tix/30 bg-tix-soft/60 p-4 text-[14px]" style={{ animationDelay: "360ms" }}>
            <p className="text-[11px] uppercase tracking-[0.12em] text-tix">For the event</p>
            <Link href={`/e/${event.id}`} className="mt-1 block text-cream underline decoration-line-strong underline-offset-4">
              {event.title}
            </Link>
            {event.booking_url && (
              <p className="mt-1 text-cream-2">
                Book your own ticket{event.price ? ` (${event.price})` : ""} —{" "}
                <a href={event.booking_url} target="_blank" rel="noreferrer" className="text-tix underline underline-offset-4">
                  booking page
                </a>
              </p>
            )}
          </section>
        )}
      </article>

      {/* Primary action */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/85 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <ShareButton text={shareText} path={`/p/${p.id}`} className="glass h-12 shrink-0 rounded-full px-4 text-[14px] font-semibold text-cream" />
          {isHost ? (
            <span className="glass flex h-12 flex-1 items-center justify-center rounded-full text-[14px] text-cream-2">
              You&apos;re hosting · {filled}/{p.max_people}
            </span>
          ) : mine ? (
            <form action={leavePopout.bind(null, p.id)} className="flex-1">
              <button className="glass h-12 w-full rounded-full text-[14px] font-semibold text-cream">You&apos;re in · Leave</button>
            </form>
          ) : p.status === "done" ? (
            <span className="glass flex h-12 flex-1 items-center justify-center rounded-full text-[14px] text-cream-3">This one&apos;s done</span>
          ) : started ? (
            <span className="glass flex h-12 flex-1 items-center justify-center rounded-full text-[14px] text-cream-3">Already started</span>
          ) : full ? (
            <span className="glass flex h-12 flex-1 items-center justify-center rounded-full text-[14px] text-cream-3">Full</span>
          ) : user ? (
            <form action={joinPopout.bind(null, p.id)} className="flex-1">
              <button className="btn-pop h-12 w-full text-[16px]">Join</button>
            </form>
          ) : (
            <form action={signInWithGoogle.bind(null, `/p/${p.id}`)} className="flex-1">
              <button className="btn-pop h-12 w-full text-[16px]">Sign in to join</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
