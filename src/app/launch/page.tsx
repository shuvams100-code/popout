import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import NotHere from "@/components/not-here";
import ShareButton from "@/components/share-button";
import { createClient, getViewer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CITY_GOAL = 150; // a city opens when this many people ask — Timeleft's "151 signups" trick

export const metadata: Metadata = {
  title: "Bring Popout to your city",
  description: `Bangalore is live. Any other city opens at ${CITY_GOAL} votes. Vote, then share to unlock yours.`,
};

/** Public city leaderboard. Each share carries ?via= so we know who campaigned. */
export default async function Launch({ searchParams }: { searchParams: Promise<{ city?: string }> }) {
  const { city: wanted } = await searchParams;
  const [supabase, user] = await Promise.all([createClient(), getViewer()]);
  const { data } = await supabase.rpc("launch_counts");
  const cities = ((data ?? []) as { city: string; requests: number }[]).map((c) => ({ ...c, requests: Number(c.requests) }));
  const city = wanted?.trim().slice(0, 80);
  const mine = city ? cities.find((c) => c.city.toLowerCase() === city.toLowerCase()) ?? { city, requests: 0 } : null;

  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader />
      <div className="mx-auto max-w-md px-5 pb-16 pt-4">
        <h1 className="reveal font-display text-[32px] leading-tight text-cream" style={{ fontWeight: 700 }}>
          Not in Bangalore?
          <br />
          <span className="text-grad">Vote to bring Popout to your city.</span>
        </h1>
        <p className="reveal mt-2 text-[14px] text-cream-2" style={{ animationDelay: "60ms" }}>
          Type your city, tap “Yes, launch here”, then share the link with friends there. At {CITY_GOAL} votes, we open the map in that city.
        </p>

        <form className="reveal mt-5 flex gap-2" style={{ animationDelay: "90ms" }}>
          <input
            name="city"
            defaultValue={city ?? ""}
            placeholder="Which city? e.g. Pune"
            autoComplete="off"
            maxLength={80}
            required
            className="glass h-12 flex-1 rounded-full px-4 text-[15px] text-cream placeholder:text-cream-3 outline-none"
          />
          <button className="btn-pop h-12 px-5 text-[15px]">Find</button>
        </form>

        {mine && (
          <div className="reveal mt-4" style={{ animationDelay: "120ms" }}>
            <p className="mb-2 text-[13px] text-cream-2">
              <b className="text-cream">{mine.city}</b> · {mine.requests} of {CITY_GOAL} votes
            </p>
            <NotHere city={mine.city} signedIn={!!user} via={user?.id} inline />
          </div>
        )}

        {cities.length > 0 && (
          <p className="reveal mt-8 text-[11px] uppercase tracking-[0.14em] text-cream-3" style={{ animationDelay: "150ms" }}>
            Cities in the running
          </p>
        )}
        <ul className="reveal mt-3 flex flex-col gap-3" style={{ animationDelay: "180ms" }}>
          {cities.map((c) => {
            const pct = Math.min(100, Math.round((100 * c.requests) / CITY_GOAL));
            return (
              <li key={c.city} className="glass rounded-[18px] p-4">
                <div className="flex items-center justify-between text-[15px]">
                  <span className="text-cream">{c.city}</span>
                  <span className="text-cream-2">
                    {c.requests} <span className="text-cream-3">/ {CITY_GOAL}</span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-pop" style={{ width: `${pct}%` }} />
                </div>
                <ShareButton
                  text={`Help open Popout in ${c.city} — ${c.requests} of ${CITY_GOAL} so far. Tap "launch here":`}
                  path={`/launch?city=${encodeURIComponent(c.city)}`}
                  via={user?.id}
                  label={`Share to unlock ${c.city}`}
                  className="mt-3 text-[13px] font-semibold text-pop"
                />
              </li>
            );
          })}
          {cities.length === 0 && !mine && <li className="text-[14px] text-cream-3">No votes yet anywhere. Yours would be the first.</li>}
        </ul>
      </div>
    </main>
  );
}
