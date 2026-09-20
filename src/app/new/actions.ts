"use server";

import { redirect } from "next/navigation";
import { createClient, getViewer } from "@/lib/supabase/server";
import { MIN_PEOPLE } from "@/lib/types";

const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);

function parse(formData: FormData) {
  const title = str(formData, "title", 80);
  const venue = str(formData, "venue", 120);
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  // ponytail: datetime-local has no zone; Bangalore-only launch, so it's IST
  const startsAt = new Date(`${str(formData, "when", 16)}:00+05:30`);
  const max = Number(formData.get("max_people"));
  const who = str(formData, "who", 12);
  const minAge = Number(formData.get("min_age")) || null;
  const maxAge = Number(formData.get("max_age")) || null;
  const description = str(formData, "description", 280) || null;
  const eventId = str(formData, "event_id", 40) || null;
  const verifiedOnly = formData.get("verified_only") === "on";
  const id = str(formData, "id", 40) || null;
  const back = id ? `/p/${id}/edit?` : eventId ? `/new?event=${eventId}&` : "/new?";

  const bad = (e: string) => redirect(`${back}error=${e}`);
  if (!title) bad("title");
  if (!venue || !Number.isFinite(lat) || !Number.isFinite(lng) || !lat) bad("venue");
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now() + 10 * 60000) bad("when");
  if (!Number.isInteger(max) || max < MIN_PEOPLE || max > 6) bad("max");
  if (!["anyone", "women_only", "men_only"].includes(who)) bad("who");
  if (minAge && maxAge && minAge > maxAge) bad("age");

  return { id, title, venue, lat, lng, startsAt, max, who, minAge, maxAge, description, eventId, verifiedOnly, back };
}

export async function createPopout(formData: FormData) {
  const supabase = await createClient();
  const user = await getViewer();
  if (!user) redirect("/");

  const { data: me } = await supabase.from("profiles").select("age,gender").eq("id", user.id).single();
  if (!me?.age || !me.gender) redirect("/profile?next=/new");

  const { title, venue, lat, lng, startsAt, max, who, minAge, maxAge, description, eventId, verifiedOnly, back } = parse(formData);

  const { data, error } = await supabase
    .from("popouts")
    .insert({
      host_id: user.id,
      event_id: eventId,
      title,
      venue,
      lat,
      lng,
      starts_at: startsAt.toISOString(),
      max_people: max,
      gender_pref: who,
      min_age: minAge,
      max_age: maxAge,
      description,
      verified_only: verifiedOnly,
    })
    .select("id")
    .single();
  if (error || !data) redirect(`${back}error=save`);

  redirect(`/p/${data.id}?created=1`);
}

export async function updatePopout(formData: FormData) {
  const supabase = await createClient();
  const user = await getViewer();
  if (!user) redirect("/");
  const { id, title, venue, lat, lng, startsAt, max, who, minAge, maxAge, description, verifiedOnly, back } = parse(formData);
  if (!id) redirect("/");
  // RLS: only the host can update
  const { error } = await supabase
    .from("popouts")
    .update({ title, venue, lat, lng, starts_at: startsAt.toISOString(), max_people: max, gender_pref: who, min_age: minAge, max_age: maxAge, description, verified_only: verifiedOnly })
    .eq("id", id)
    .eq("host_id", user.id);
  if (error) redirect(`${back}error=save`);
  redirect(`/p/${id}?updated=1`);
}
