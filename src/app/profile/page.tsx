import { redirect } from "next/navigation";
import SiteHeader from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { saveProfile } from "./actions";

const ERRORS: Record<string, string> = {
  age: "Age must be between 18 and 99.",
  gender: "Pick a gender.",
  save: "Couldn't save. Try again.",
};

const field = "w-full rounded-xl border border-line bg-ink-2 px-3 py-2.5 text-[15px] text-cream outline-none transition focus:border-line-strong";
const label = "flex flex-col gap-1.5 text-[12px] uppercase tracking-[0.12em] text-cream-3";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/", error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();

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
            {p?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-full bg-pop-soft font-display text-[22px] text-pop">{p?.name?.[0] ?? "?"}</span>
            )}
            <p className="text-[13px] text-cream-3">Photo comes from Google.</p>
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
            <label className={label}>
              Gender
              <select name="gender" defaultValue={p?.gender ?? ""} required className={field}>
                <option value="" disabled>Select</option>
                <option value="woman">Woman</option>
                <option value="man">Man</option>
                <option value="other">Other</option>
              </select>
            </label>
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
