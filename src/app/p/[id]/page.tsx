import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import { Seats } from "@/components/pin-card";
import { whenLong } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { signInWithGoogle } from "@/app/auth/actions";

type Params = { params: Promise<{ id: string }> };

async function load(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("popouts")
    .select(
      "*, host:profiles!host_id(id,name,age,photo_url,bio), event:events(id,title,booking_url,price), members:popout_members(status,user:profiles(id,name,photo_url))",
    )
    .eq("id", id)
    .maybeSingle();
  return data && { ...data, started: new Date(data.starts_at).getTime() < Date.now() };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const p = await load(id);
  if (!p) return { title: "Popout" };
  const desc = `${whenLong(p.starts_at)} · ${p.venue}`;
  return {
    title: p.title,
    description: desc,
    openGraph: { title: p.title, description: desc, type: "website", siteName: "Popout" },
    twitter: { card: "summary", title: p.title, description: desc },
  };
}

export default async function PopoutPage({ params }: Params) {
  const { id } = await params;
  const p = await load(id);
  if (!p) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  type Member = { status: string; user: { id: string; name: string; photo_url: string | null } };
  const host = p.host as unknown as { id: string; name: string; age: number | null; photo_url: string | null; bio: string | null };
  const event = p.event as unknown as { id: string; title: string; booking_url: string | null; price: string | null } | null;
  const members = (p.members as unknown as Member[]).filter((m) => m.status !== "dropped");
  const filled = members.length;
  const full = filled >= p.max_people;
  const mine = members.some((m) => m.user.id === user?.id);
  const isHost = user?.id === host.id;
  const started = p.started;

  const eligibility = [
    p.gender_pref === "women_only" ? "Women only" : p.gender_pref === "men_only" ? "Men only" : "Anyone",
    p.min_age || p.max_age ? `${p.min_age ?? 18}–${p.max_age ?? 99}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader />
      <article className="mx-auto max-w-md px-5 pb-32 pt-6">
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
            {host.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={host.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-full bg-pop-soft font-display text-[18px] text-pop">{host.name[0]}</span>
            )}
            <div className="min-w-0">
              <p className="text-[15px] text-cream">
                {host.name}
                {host.age ? <span className="text-cream-3">, {host.age}</span> : null}
                <span className="ml-2 rounded-full bg-pop-soft px-2 py-0.5 text-[11px] text-pop">Host</span>
              </p>
              {host.bio && <p className="truncate text-[13px] text-cream-2">{host.bio}</p>}
            </div>
          </div>
        </section>

        <section className="reveal mt-4" style={{ animationDelay: "300ms" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] uppercase tracking-[0.12em] text-cream-3">Going</h2>
            <span className="flex items-center gap-2 text-[13px] text-cream-2">
              <Seats filled={filled} max={p.max_people} />
              {filled}/{p.max_people}
            </span>
          </div>
          <ul className="flex flex-wrap gap-2">
            {members.map((m) => (
              <li key={m.user.id} className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-[13px] text-cream">
                {m.user.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.user.photo_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-ink-3 text-[11px]">{m.user.name[0]}</span>
                )}
                {m.user.name.split(" ")[0]}
              </li>
            ))}
            {Array.from({ length: Math.max(0, p.max_people - filled) }).map((_, i) => (
              <li key={`empty-${i}`} className="rounded-full border border-dashed border-line px-3 py-1 text-[13px] text-cream-3">
                open seat
              </li>
            ))}
          </ul>
        </section>

        {event && (
          <section className="reveal mt-6 rounded-[22px] border border-ice-soft bg-ice-soft/40 p-4 text-[14px]" style={{ animationDelay: "360ms" }}>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ice">For the event</p>
            <Link href={`/e/${event.id}`} className="mt-1 block text-cream underline decoration-line-strong underline-offset-4">
              {event.title}
            </Link>
            {event.booking_url && (
              <p className="mt-1 text-cream-2">
                Book your own ticket{event.price ? ` (${event.price})` : ""} —{" "}
                <a href={event.booking_url} target="_blank" rel="noreferrer" className="text-ice underline underline-offset-4">
                  booking page
                </a>
              </p>
            )}
          </section>
        )}
      </article>

      {/* Primary action */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/85 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3">
          {isHost ? (
            <span className="flex-1 rounded-full border border-line py-3 text-center text-[14px] text-cream-2">You&apos;re hosting this</span>
          ) : mine ? (
            <span className="flex-1 rounded-full border border-line py-3 text-center text-[14px] text-cream-2">You&apos;re in · join & leave land in M3</span>
          ) : started ? (
            <span className="flex-1 rounded-full border border-line py-3 text-center text-[14px] text-cream-3">Already started</span>
          ) : full ? (
            <span className="flex-1 rounded-full border border-line py-3 text-center text-[14px] text-cream-3">Full</span>
          ) : user ? (
            <button disabled className="flex-1 btn-pop py-3 text-[16px] opacity-60">Join · M3</button>
          ) : (
            <form action={signInWithGoogle.bind(null, `/p/${p.id}`)} className="flex-1">
              <button className="btn-pop w-full py-3.5 text-[16px]">Sign in to join</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
