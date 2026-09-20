"use server";

import { redirect } from "next/navigation";
import { createClient, getViewer } from "@/lib/supabase/server";
import { MIN_PEOPLE } from "@/lib/types";

const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);

export async function createPopout(formData: FormData) {
  const supabase = await createClient();
  const user = await getViewer();
  if (!user) redirect("/");

  const { data: me } = await supabase.from("profiles").select("age,gender").eq("id", user.id).single();
  if (!me?.age || !me.gender) redirect("/profile?next=/new");

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
  const back = eventId ? `/new?event=${eventId}` : "/new";

  if (!title) redirect(`${back}&error=title`);
  if (!venue || !Number.isFinite(lat) || !Number.isFinite(lng) || !lat) redirect(`${back}&error=venue`);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now() + 10 * 60000) redirect(`${back}&error=when`);
  if (!Number.isInteger(max) || max < MIN_PEOPLE || max > 6) redirect(`${back}&error=max`);
  if (!["anyone", "women_only", "men_only"].includes(who)) redirect(`${back}&error=who`);
  if (minAge && maxAge && minAge > maxAge) redirect(`${back}&error=age`);

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
    })
    .select("id")
    .single();
  if (error || !data) redirect(`${back}&error=save`);

  redirect(`/p/${data.id}?created=1`);
}
