import VenueField from "./venue-field";
import Select from "./select";
import WhenField from "./when-field";
import { MIN_PEOPLE } from "@/lib/types";
import { whenLong } from "@/lib/format";
import type { Place } from "@/lib/geocode";

export const field = "glass w-full rounded-[14px] px-3.5 py-3 text-[15px] text-cream placeholder:text-cream-3 outline-none focus:border-white/30";
export const label = "flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream-3";

export type PopoutDefaults = {
  id?: string;
  title?: string;
  venue?: Place | null;
  when: string; // YYYY-MM-DDTHH:mm IST
  max_people?: number;
  who?: string;
  min_age?: number | null;
  max_age?: number | null;
  description?: string | null;
  verified_only?: boolean;
};

type Props = {
  action: (fd: FormData) => Promise<void>;
  defaults: PopoutDefaults;
  event?: { id: string; title: string; venue: string; lat: number; lng: number; starts_at: string } | null;
  submitLabel: string;
};

/** The six-field form, shared by create and edit. Server action decides what to do with it. */
export default function PopoutForm({ action, defaults: d, event, submitLabel }: Props) {
  return (
    <form action={action} className="reveal mt-6 flex flex-col gap-4" style={{ animationDelay: "80ms" }}>
      {event && <input type="hidden" name="event_id" value={event.id} />}
      {d.id && <input type="hidden" name="id" value={d.id} />}

      <label className={label}>
        What
        <input name="title" required maxLength={80} placeholder={event ? `Crew for ${event.title}` : "Coffee and random conversation"} defaultValue={d.title ?? (event ? `Crew for ${event.title}` : "")} className={field} />
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
          <VenueField className={field} defaultValue={d.venue ?? null} />
        )}
      </div>

      <div className={label}>
        When
        <WhenField defaultValue={d.when} className={field} />
        {event && <span className="normal-case tracking-normal text-cream-3">Event starts {whenLong(event.starts_at)}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={label}>
          Max people
          <Select
            name="max_people"
            defaultValue={String(d.max_people ?? 4)}
            className={field}
            options={Array.from({ length: 6 - MIN_PEOPLE + 1 }, (_, i) => ({ value: String(MIN_PEOPLE + i), label: `${MIN_PEOPLE + i} people` }))}
          />
        </div>
        <div className={label}>
          Who can join
          <Select
            name="who"
            defaultValue={d.who ?? "anyone"}
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
          <input name="min_age" type="number" min={18} max={99} placeholder="22" defaultValue={d.min_age ?? ""} className={field} />
        </label>
        <label className={label}>
          <span>Max age <span className="font-normal normal-case tracking-normal text-cream-3">· optional</span></span>
          <input name="max_age" type="number" min={18} max={99} placeholder="32" defaultValue={d.max_age ?? ""} className={field} />
        </label>
      </div>

      <label className={label}>
        <span>Description <span className="font-normal normal-case tracking-normal text-cream-3">· optional</span></span>
        <textarea name="description" maxLength={280} rows={2} placeholder="New to Bangalore. Come have coffee." defaultValue={d.description ?? ""} className={`${field} resize-none`} />
      </label>

      <label className="glass flex cursor-pointer items-center gap-3 rounded-[14px] px-3.5 py-3">
        <input type="checkbox" name="verified_only" defaultChecked={d.verified_only} className="h-4 w-4 accent-[#5cff7a]" />
        <span className="text-[14px] text-cream">
          Face-verified people only
          <span className="block text-[12px] text-cream-3">Only people who&apos;ve done the selfie check can join.</span>
        </span>
      </label>

      <p className="text-[12px] text-cream-3">Public places only. You&apos;re the host — you show up even if it&apos;s just one more person.</p>

      <button type="submit" className="btn-pop mt-1 py-3.5 text-[16px]">
        {submitLabel}
      </button>
    </form>
  );
}
