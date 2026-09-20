import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import VenueField from "@/components/venue-field";
import WhenField from "@/components/when-field";
import { Mascot } from "@/components/brand";
import { field, label } from "@/components/popout-form";
import { toFormWhen } from "@/lib/popout-form";
import { whenLong } from "@/lib/format";
import { createClient, getViewer } from "@/lib/supabase/server";
import { createEvent, deleteEvent } from "./actions";

export const dynamic = "force-dynamic";

const since = () => new Date(Date.now() - 3600000).toISOString();

export default async function EventsAdmin({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { error, saved } = await searchParams;
  const user = await getViewer();
  if (!user) notFound();
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) notFound();

  const { data: events } = await supabase.from("events").select("id,title,venue,starts_at,price,organizer").gte("starts_at", since()).order("starts_at");

  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader back="/admin" />
      <div className="mx-auto max-w-md px-5 pb-16 pt-4 sm:max-w-lg">
        <div className="reveal flex items-center gap-3">
          <Mascot size={44} tone="tix" />
          <div>
            <h1 className="font-display text-[30px] leading-none text-cream" style={{ fontWeight: 700 }}>Events</h1>
            <p className="mt-1 text-[13px] text-cream-2">Things already happening. We link out; we don&apos;t sell tickets.</p>
          </div>
        </div>
        {error && <p className="mt-4 text-[13px] text-tix">{error === "venue" ? "Pick the venue from the list." : error === "when" ? "Pick a future time." : "Couldn't save."}</p>}
        {saved && <p className="glass mt-4 rounded-[14px] px-3.5 py-2.5 text-[13px] text-cream">Added. It&apos;s on the map.</p>}

        <form action={createEvent} className="reveal mt-6 flex flex-col gap-4" style={{ animationDelay: "80ms" }}>
          <label className={label}>
            Title
            <input name="title" required maxLength={80} placeholder="Open mic comedy night" className={field} />
          </label>
          <div className={label}>
            Venue
            <VenueField className={field} />
          </div>
          <div className={label}>
            When
            <WhenField defaultValue={toFormWhen()} className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Price
              <input name="price" maxLength={20} placeholder="₹399 or Free" className={field} />
            </label>
            <label className={label}>
              Organizer
              <input name="organizer" maxLength={60} placeholder="That Comedy Club" className={field} />
            </label>
          </div>
          <label className={label}>
            Booking link
            <input name="booking_url" type="url" placeholder="https://in.bookmyshow.com/…" className={field} />
          </label>
          <button type="submit" className="btn-pop mt-1 py-3.5 text-[16px]">Add event</button>
        </form>

        <h2 className="reveal mt-10 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream-3">Upcoming ({events?.length ?? 0})</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {(events ?? []).map((e) => (
            <li key={e.id} className="glass flex items-center gap-3 rounded-[16px] p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] text-cream">{e.title}</p>
                <p className="truncate text-[12px] text-cream-3">
                  {whenLong(e.starts_at)} · {e.venue}
                  {e.price ? ` · ${e.price}` : ""}
                </p>
              </div>
              <form action={deleteEvent.bind(null, e.id)}>
                <button className="text-[12px] text-cream-3 hover:text-tix">Remove</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
