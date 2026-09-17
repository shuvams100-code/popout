import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveProfile } from "./actions";

const ERRORS: Record<string, string> = {
  age: "Age must be between 18 and 99.",
  gender: "Pick a gender.",
  save: "Couldn't save. Try again.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/", error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-medium">Your profile</h1>
      <p className="mt-1 text-sm text-neutral-600">Hosts and members see this. Takes 30 seconds.</p>
      {error && <p className="mt-3 text-sm text-red-600">{ERRORS[error] ?? "Something went wrong."}</p>}
      <form action={saveProfile} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        {p?.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photo_url} alt="" className="h-16 w-16 rounded-full" />
        )}
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input name="name" defaultValue={p?.name ?? ""} required maxLength={60} className="rounded border p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Age
          <input name="age" type="number" min={18} max={99} defaultValue={p?.age ?? ""} required className="rounded border p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Gender
          <select name="gender" defaultValue={p?.gender ?? ""} required className="rounded border p-2">
            <option value="" disabled>Select</option>
            <option value="woman">Woman</option>
            <option value="man">Man</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Area
          <input name="area" defaultValue={p?.area ?? ""} placeholder="Indiranagar" maxLength={60} className="rounded border p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          One line about you
          <input name="bio" defaultValue={p?.bio ?? ""} placeholder="New to Bangalore. Into coffee and bad puns." maxLength={140} className="rounded border p-2" />
        </label>
        <button type="submit" className="mt-2 rounded bg-black p-3 font-medium text-white">Save</button>
      </form>
    </main>
  );
}
