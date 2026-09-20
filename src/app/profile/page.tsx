import { redirect } from "next/navigation";
import SiteHeader from "@/components/site-header";
import { createClient, getViewer } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { saveProfile } from "./actions";
import Select from "@/components/select";
import { Avatar } from "@/components/brand";

const ERRORS: Record<string, string> = {
  age: "Age must be between 18 and 99.",
  gender: "Pick a gender.",
  save: "Couldn't save. Try again.",
};

const field = "glass w-full rounded-[14px] px-3.5 py-3 text-[15px] text-cream placeholder:text-cream-3 outline-none focus:border-white/30";
const label = "flex flex-col gap-1.5 text-[12px] uppercase tracking-[0.12em] text-cream-3";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/", error } = await searchParams;
  const supabase = await createClient();
  const user = await getViewer();
  if (!user) redirect("/");
  const [{ data: p }, { data: st }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("profile_stats").select("attended,no_shows,hosted").eq("id", user.id).maybeSingle(),
  ]);
  const stats = st ?? { attended: 0, no_shows: 0, hosted: 0 };
  const reliable = stats.attended >= 3 && stats.no_shows === 0;

  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader />
      <div className="mx-auto max-w-md px-5 pb-16 pt-6">
        <h1 className="reveal font-display text-[34px] leading-tight text-cream" style={{ fontWeight: 700 }}>
          Your profile
        </h1>
        <p className="reveal mt-1 text-[14px] text-cream-2" style={{ animationDelay: "60ms" }}>
          Hosts and members see this. Thirty seconds.
        </p>
        {error && <p className="mt-3 text-[13px] text-pop">{ERRORS[error] ?? "Something went wrong."}</p>}

        <form action={saveProfile} className="reveal mt-6 flex flex-col gap-4" style={{ animationDelay: "120ms" }}>
          <input type="hidden" name="next" value={next} />
          <div className="flex items-center gap-4">
            <span className="glass grid h-20 w-20 place-items-center rounded-full">
              <Avatar seed={user.id} size={64} />
            </span>
            <div className="text-[13px] text-cream-3">
              <p>Your avatar. One of a kind, no photo needed.</p>
              <p className="mt-1.5 text-cream-2">
                <b className="font-semibold text-cream">{stats.attended}</b> attended · <b className="font-semibold text-cream">{stats.no_shows}</b> no-shows · <b className="font-semibold text-cream">{stats.hosted}</b> hosted
                {reliable && <span className="ml-2 rounded-full bg-pop-soft px-1.5 py-0.5 text-[10px] font-semibold text-pop">Reliable</span>}
              </p>
            </div>
          </div>
          <label className={label}>
            Name
            <input name="name" defaultValue={p?.name ?? ""} required maxLength={60} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Age
              <input name="age" type="number" min={18} max={99} defaultValue={p?.age ?? ""} required className={field} />
            </label>
            <div className={label}>
              Gender
              <Select
                name="gender"
                defaultValue={p?.gender ?? ""}
                required
                className={field}
                options={[
                  { value: "man", label: "Male" },
                  { value: "woman", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>
          </div>
          <label className={label}>
            Area
            <input name="area" defaultValue={p?.area ?? ""} placeholder="Indiranagar" maxLength={60} className={field} />
          </label>
          <label className={label}>
            One line about you
            <input name="bio" defaultValue={p?.bio ?? ""} placeholder="New to Bangalore. Into coffee and bad puns." maxLength={140} className={field} />
          </label>
          <button type="submit" className="btn-pop mt-2 py-3.5 text-[16px]">
            Save
          </button>
        </form>

        <form action={signOut} className="mt-10 text-center">
          <button type="submit" className="text-[13px] text-cream-3 underline underline-offset-4">Sign out</button>
        </form>
      </div>
    </main>
  );
}
