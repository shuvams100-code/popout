import { redirect } from "next/navigation";
import SiteHeader from "@/components/site-header";
import VenueField from "@/components/venue-field";
import Select from "@/components/select";
import WhenField from "@/components/when-field";
import { Mascot } from "@/components/brand";
import { createClient, getViewer } from "@/lib/supabase/server";
import { MIN_PEOPLE } from "@/lib/types";
import { whenLong } from "@/lib/format";
import { createPopout } from "./actions";
import { signInWithGoogle } from "@/app/auth/actions";

const ERRORS: Record<string, string> = {
  title: "Give it a name.",
  venue: "Pick a place from the suggestions so we can pin it.",
  when: "Pick a time at least 10 minutes from now.",
  max: `Group size is ${MIN_PEOPLE}–6.`,
  who: "Pick who can join.",
  age: "Min age can't be more than max age.",
  save: "Couldn't save. Try again.",
};

const field = "glass w-full rounded-[14px] px-3.5 py-3 text-[15px] text-cream placeholder:text-cream-3 outline-none focus:border-white/30";
const label = "flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream-3";

// Default "when": next round hour, at least 90 min out, in IST for datetime-local
function defaultWhen(iso?: string) {
  const d = iso ? new Date(iso) : new Date(Date.now() + 90 * 60000);
  if (!iso) {
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
  }
  const ist = new Date(d.getTime() + 5.5 * 3600000);
  return ist.toISOString().slice(0, 16);
}

export default async function NewPopout({ searchParams }: { searchParams: Promise<{ event?: string; error?: string }> }) {
  const { event: eventId, error } = await searchParams;
  const supabase = await createClient();
  const user = await getViewer();
  const next = eventId ? `/new?event=${eventId}` : "/new";
  if (!user) {
    return (
      <main className="min-h-dvh bg-ink">
        <SiteHeader />
        <div className="mx-auto flex max-w-md flex-col items-center px-5 pt-16 text-center">
          <Mascot size={96} live />
          <h1 className="font-display mt-6 text-[30px] leading-tight text-cream" style={{ fontWeight: 700 }}>
            Sign in to start a Popout
          </h1>
          <p className="mt-2 text-[14px] text-cream-2">Google only. No phone number, no password. Takes five seconds.</p>
          <form action={signInWithGoogle.bind(null, next)} className="mt-8 w-full">
            <button className="btn-pop w-full py-3.5 text-[16px]">Continue with Google</button>
          </form>
        </div>
      </main>
    );
  }
  const { data: me } = await supabase.from("profiles").select("age,gender").eq("id", user.id).single();
  if (!me?.age || !me.gender) redirect(`/profile?next=${encodeURIComponent(next)}`);

  const { data: event } = eventId ? await supabase.from("events").select("id,title,venue,lat,lng,starts_at").eq("id", eventId).maybeSingle() : { data: null };

  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader />
      <div className="mx-auto max-w-md px-5 pb-16 pt-4 sm:max-w-lg">
        <div className="reveal flex items-center gap-3">
          <Mascot size={44} />
          <div>
            <h1 className="font-display text-[30px] leading-none text-cream" style={{ fontWeight: 700 }}>
              {event ? "Start a crew" : "Start a Popout"}
            </h1>
            <p className="mt-1 text-[13px] text-cream-2">{event ? `For ${event.title}` : "Six fields. Under a minute."}</p>
          </div>
        </div>
        {error && <p className="mt-4 text-[13px] text-tix">{ERRORS[error] ?? "Something went wrong."}</p>}

        <form action={createPopout} className="reveal mt-6 flex flex-col gap-4" style={{ animationDelay: "80ms" }}>
          {event && <input type="hidden" name="event_id" value={event.id} />}

          <label className={label}>
            What
            <input name="title" required maxLength={80} placeholder={event ? `Crew for ${event.title}` : "Coffee and random conversation"} defaultValue={event ? `Crew for ${event.title}` : ""} className={field} />
          </label>

          <div className={label}>
            Where
            {event ? (
              <>
                <input value={event.venue} readOnly className={`${field} text-cream-2`} />
                <input type="hidden" name="venue" value={event.venue} />
                <input type="hidden" name="lat" value={event.lat} />
                <input type="hidden" name="lng" value={event.lng} />
              </>
            ) : (
              <VenueField className={field} />
            )}
          </div>

          <div className={label}>
            When
            <WhenField defaultValue={defaultWhen(event?.starts_at)} className={field} />
            {event && <span className="normal-case tracking-normal text-cream-3">Event starts {whenLong(event.starts_at)}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={label}>
              Max people
              <Select
                name="max_people"
                defaultValue="4"
                className={field}
                options={Array.from({ length: 6 - MIN_PEOPLE + 1 }, (_, i) => ({ value: String(MIN_PEOPLE + i), label: `${MIN_PEOPLE + i} people` }))}
              />
            </div>
            <div className={label}>
              Who can join
              <Select
                name="who"
                defaultValue="anyone"
                className={field}
                options={[
                  { value: "men_only", label: "Male" },
                  { value: "women_only", label: "Female" },
                  { value: "anyone", label: "Anyone" },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              <span>Min age <span className="font-normal normal-case tracking-normal text-cream-3">· optional</span></span>
              <input name="min_age" type="number" min={18} max={99} placeholder="22" className={field} />
            </label>
            <label className={label}>
              <span>Max age <span className="font-normal normal-case tracking-normal text-cream-3">· optional</span></span>
              <input name="max_age" type="number" min={18} max={99} placeholder="32" className={field} />
            </label>
          </div>

          <label className={label}>
            <span>Description <span className="font-normal normal-case tracking-normal text-cream-3">· optional</span></span>
            <textarea name="description" maxLength={280} rows={2} placeholder="New to Bangalore. Come have coffee." className={`${field} resize-none`} />
          </label>

          <p className="text-[12px] text-cream-3">Public places only. You&apos;re the host — you show up even if it&apos;s just one more person.</p>

          <button type="submit" className="btn-pop mt-1 py-3.5 text-[16px]">
            Publish
          </button>
        </form>
      </div>
    </main>
  );
}
