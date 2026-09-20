import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import { whenLong } from "@/lib/format";
import { createClient, getViewer } from "@/lib/supabase/server";
import { cache } from "react";
import { cookies } from "next/headers";
import ShareButton from "@/components/share-button";
import { Avatar, Verified } from "@/components/brand";
import PopoutSocial from "@/components/popout-social";
import Gate from "@/components/gate";
import JoinButtons from "@/components/join-buttons";
import PushPrompt from "@/components/push-prompt";
import { leavePopout, cancelPopout } from "./actions";

const ERRORS: Record<string, string> = {
  popout_full: "Just filled up. Try another one nearby.",
  popout_started: "This one already started.",
  popout_not_open: "This Popout isn't open any more.",
  not_eligible: "This one has an age or gender filter you don't match.",
  not_verified: "This one is for face-verified people only. Verify from your profile — takes a minute.",
  unknown: "Couldn't do that. Try again.",
};

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; joined?: string; error?: string; reported?: string; confirmed?: string; done?: string; updated?: string; cancelled?: string; checkin?: string; fill?: string }> };

// cache(): generateMetadata and the page share one query per request
const load = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("popouts")
    .select(
      "*, host:profiles!host_id(id,name,age,bio,verified_at), event:events(id,title,booking_url,price), members:popout_members(status,plus_one,user:profiles(id,name,verified_at,gender))",
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
  const n = (p.members as unknown as { status: string; plus_one: boolean }[]).filter((m) => m.status !== "dropped" && m.status !== "removed").reduce((a, m) => a + (m.plus_one ? 2 : 1), 0);
  const left = p.max_people - n;
  const desc = `${whenLong(p.starts_at)} · ${p.venue} · ${h.name.split(" ")[0]}${h.age ? `, ${h.age}` : ""} is hosting · ${left > 0 ? `${left} seat${left === 1 ? "" : "s"} left` : "Full"}`;
  return {
    title: p.title,
    description: desc,
    openGraph: { title: p.title, description: desc, type: "website", siteName: "Popout" },
    twitter: { card: "summary_large_image", title: p.title, description: desc },
  };
}

export default async function PopoutPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { created, joined, error, reported, confirmed, done, updated, cancelled, checkin, fill } = await searchParams;
  const p = await load(id);
  if (!p) notFound();

  const supabase = await createClient();
  const hostId = (p.host as unknown as { id: string }).id;
  const [user, { data: blockedIds }, stats] = await Promise.all([getViewer(), supabase.rpc("my_blocked_ids"), loadStats(hostId)]);
  const { data: viewerProf } = user ? await supabase.from("profiles").select("rules_accepted_at").eq("id", user.id).maybeSingle() : { data: null };
  const rulesAccepted = !!viewerProf?.rules_accepted_at;
  const reliable = stats.attended >= 3 && stats.no_shows === 0;
  if (((blockedIds as string[] | null) ?? []).includes(hostId)) {
    return (
      <main className="min-h-dvh bg-ink">
        <SiteHeader />
        <p className="mx-auto max-w-md px-5 pt-16 text-center text-[15px] text-cream-2">This Popout isn&apos;t available to you.</p>
      </main>
    );
  }

  type Member = { status: string; plus_one: boolean; user: { id: string; name: string; verified_at: string | null; gender: string | null } };
  const host = p.host as unknown as { id: string; name: string; age: number | null; bio: string | null; verified_at: string | null };
  const event = p.event as unknown as { id: string; title: string; booking_url: string | null; price: string | null } | null;
  const members = (p.members as unknown as Member[]).filter((m) => m.status !== "dropped" && m.status !== "removed");
  const filled = members.reduce((a, m) => a + (m.plus_one ? 2 : 1), 0);
  const full = filled >= p.max_people;
  const canPlusOne = p.max_people - filled >= 2;
  const women = members.filter((m) => m.user.gender === "woman").length;
  const men = members.filter((m) => m.user.gender === "man").length;
  const mine = members.some((m) => m.user.id === user?.id);
  const isHost = user?.id === host.id;
  const started = p.started;
  // +1 loop: I hold a seat for a friend / the person who shared this with me is holding one for me
  const myPlusOne = !!user && members.some((m) => m.user.id === user.id && m.plus_one);
  const via = (await cookies()).get("popout-via")?.value;
  const savedBy = !mine && via && via !== user?.id ? members.find((m) => m.plus_one && m.user.id === via)?.user : undefined;

  const shareText = `${isHost ? "I'm" : `${host.name.split(" ")[0]} is`} doing "${p.title}" — ${whenLong(p.starts_at)}, ${p.venue}. Want to come?`;
  const seatText = `I saved you a seat for "${p.title}" — ${whenLong(p.starts_at)}, ${p.venue}. Tap to take it:`;
  const openSeats = p.max_people - filled;
  const fillText = `Anyone free? "${p.title}" — ${whenLong(p.starts_at)}, ${p.venue}. ${openSeats} seat${openSeats === 1 ? "" : "s"} left, just tap to join:`;
  const planText = `Heads up — I'm going to "${p.title}" at ${p.venue}, ${whenLong(p.starts_at)}. Hosted by ${host.name}${host.age ? `, ${host.age}` : ""} on Popout. Details:`;

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
        {myPlusOne && p.status === "open" && !started ? (
          <div className="glass reveal mb-5 flex items-center gap-3 rounded-[18px] p-3.5 text-[14px] text-cream">
            <span className="text-[20px]">🪑</span>
            <span className="flex-1">You&apos;re holding a seat for your +1. Send it to them — it becomes theirs when they open it.</span>
            <ShareButton text={seatText} path={`/p/${p.id}`} via={user?.id} label="Send seat" className="btn-pop shrink-0 px-4 py-2 text-[14px]" />
          </div>
        ) : fill && isHost && openSeats > 0 && p.status === "open" && !started ? (
          <div className="glass reveal mb-5 flex items-center gap-3 rounded-[18px] border-pop/40 p-3.5 text-[14px] text-cream">
            <span className="text-[20px]">📣</span>
            <span className="flex-1">{openSeats} seat{openSeats === 1 ? "" : "s"} still open. Drop it in a group — it fills faster from people you know.</span>
            <ShareButton text={fillText} path={`/p/${p.id}`} via={user?.id} label="Share" className="btn-pop shrink-0 px-4 py-2 text-[14px]" />
          </div>
        ) : (created || joined) ? (
          <div className="glass reveal mb-5 flex items-center gap-3 rounded-[18px] p-3.5 text-[14px] text-cream">
            <span className="text-[20px]">🎉</span>
            <span className="flex-1">
              {created ? "It's live. Share it so it fills up." : "You're in. Bring a friend?"}
            </span>
            <ShareButton text={shareText} path={`/p/${p.id}`} via={user?.id} label="Share" className="btn-pop shrink-0 px-4 py-2 text-[14px]" />
          </div>
        ) : null}
        {savedBy && p.status === "open" && !started && (
          <div className="glass reveal mb-5 flex items-center gap-3 rounded-[18px] border-pop/40 p-3.5 text-[14px] text-cream">
            <Avatar seed={savedBy.id} size={32} />
            <span className="flex-1">{savedBy.name.split(" ")[0]} saved you a seat here. {user ? "Take it below." : "Sign in to take it."}</span>
          </div>
        )}
        {error && <p className="mb-4 text-[13px] text-tix">{ERRORS[error] ?? ERRORS.unknown}</p>}
        {reported && <p className="glass mb-4 rounded-[14px] px-3.5 py-2.5 text-[13px] text-cream-2">Thanks — we&apos;ve got the report and will look.</p>}
        {confirmed && <p className="glass mb-4 rounded-[14px] px-3.5 py-2.5 text-[13px] text-cream">See you there. 🙌</p>}
        {done && <p className="glass mb-4 rounded-[14px] px-3.5 py-2.5 text-[13px] text-cream">Closed. Attendance is on everyone&apos;s profile now.</p>}
        {updated && <p className="glass mb-4 rounded-[14px] px-3.5 py-2.5 text-[13px] text-cream">Saved.</p>}
        {(cancelled || p.status === "cancelled") && <p className="glass mb-4 rounded-[14px] border-tix/30 px-3.5 py-2.5 text-[13px] text-cream">This Popout was cancelled by the host.</p>}
        {checkin && user && mine && !isHost && (
          <div className="glass reveal mb-5 rounded-[18px] p-4">
            <p className="font-display text-[18px] text-cream" style={{ fontWeight: 600 }}>All good?</p>
            <p className="mt-1 text-[13px] text-cream-2">If anything feels off, you can leave any time. No explanation needed.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
              <Link href={`/p/${p.id}`} className="btn-pop flex h-10 flex-1 items-center justify-center rounded-full px-4">All good 👍</Link>
              <a href="tel:112" className="glass flex h-10 items-center rounded-full px-4 font-semibold text-tix">Call 112</a>
              <a href="tel:1091" className="glass flex h-10 items-center rounded-full px-4 font-semibold text-tix">Women&apos;s helpline 1091</a>
            </div>
            <p className="mt-2 text-[12px] text-cream-3">To report or block the host, tap ··· next to Going.</p>
          </div>
        )}
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
          <dd className="text-cream">
            {eligibility}
            {(women || men) && p.gender_pref !== "women_only" ? (
              <span className="text-cream-3">
                {" "}· so far {women ? `${women} ${women === 1 ? "woman" : "women"}` : ""}{women && men ? ", " : ""}{men ? `${men} ${men === 1 ? "man" : "men"}` : ""}
              </span>
            ) : null}
          </dd>
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

        {isHost && p.status === "open" && (
          <div className="reveal mt-3 flex gap-2 text-[13px]" style={{ animationDelay: "270ms" }}>
            <Link href={`/p/${p.id}/edit`} className="glass flex h-9 items-center rounded-full px-4 font-semibold text-cream">Edit</Link>
            <form action={cancelPopout.bind(null, p.id)}>
              <button className="glass flex h-9 items-center rounded-full px-4 font-semibold text-tix">Cancel this Popout</button>
            </form>
          </div>
        )}

        <Gate
          popoutId={p.id}
          startsAt={p.starts_at}
          status={p.status}
          members={members.map((m) => ({ id: m.user.id, name: m.user.name, status: m.status, verified: !!m.user.verified_at }))}
          hostId={host.id}
          me={user?.id ?? null}
          isHost={isHost}
          now={p.now}
        />

        {user && (mine || isHost) && (
          <div className="reveal mt-6" style={{ animationDelay: "330ms" }}>
            <PushPrompt userId={user.id} compact />
          </div>
        )}

        <PopoutSocial
          popoutId={p.id}
          title={p.title}
          host={{ id: host.id, name: host.name }}
          members={members.map((m) => ({ id: m.user.id, name: m.user.name, verified: !!m.user.verified_at, plusOne: m.plus_one }))}
          max={p.max_people}
          filled={filled}
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
          <ShareButton text={shareText} path={`/p/${p.id}`} via={user?.id} className="glass h-12 shrink-0 rounded-full px-4 text-[14px] font-semibold text-cream" />
          {isHost ? (
            <span className="glass flex h-12 flex-1 items-center justify-center rounded-full text-[14px] text-cream-2">
              You&apos;re hosting · {filled}/{p.max_people}
            </span>
          ) : mine ? (
            <>
              <ShareButton text={planText} path={`/p/${p.id}`} via={user?.id} label="Tell someone" className="glass h-12 flex-1 rounded-full text-[14px] font-semibold text-cream" />
              <form action={leavePopout.bind(null, p.id)} className="flex-1">
                <button className="glass h-12 w-full rounded-full text-[14px] font-semibold text-cream">You&apos;re in · Leave</button>
              </form>
            </>
          ) : p.status === "done" ? (
            <span className="glass flex h-12 flex-1 items-center justify-center rounded-full text-[14px] text-cream-3">This one&apos;s done</span>
          ) : p.status === "cancelled" ? (
            <span className="glass flex h-12 flex-1 items-center justify-center rounded-full text-[14px] text-cream-3">Cancelled</span>
          ) : started ? (
            <span className="glass flex h-12 flex-1 items-center justify-center rounded-full text-[14px] text-cream-3">Already started</span>
          ) : full && !savedBy ? (
            <span className="glass flex h-12 flex-1 items-center justify-center rounded-full text-[14px] text-cream-3">Full</span>
          ) : user ? (
            <JoinButtons popoutId={p.id} canPlusOne={canPlusOne && !savedBy} rulesAccepted={rulesAccepted} label={savedBy ? "Take your seat" : "Join"} />
          ) : (
            <Link href={`/welcome?next=${encodeURIComponent(`/p/${p.id}`)}`} className="btn-pop flex h-12 flex-1 items-center justify-center text-[16px]">
              Sign in to join
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
