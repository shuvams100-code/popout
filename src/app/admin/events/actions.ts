"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const title = str(formData, "title", 80);
  const venue = str(formData, "venue", 120);
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const startsAt = new Date(`${str(formData, "when", 16)}:00+05:30`);
  if (!title || !venue || !lat || !lng) redirect("/admin/events?error=venue");
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now()) redirect("/admin/events?error=when");
  // RLS: admins only
  const { error } = await supabase.from("events").insert({
    title,
    venue,
    lat,
    lng,
    starts_at: startsAt.toISOString(),
    price: str(formData, "price", 20) || null,
    organizer: str(formData, "organizer", 60) || null,
    booking_url: str(formData, "booking_url", 300) || null,
  });
  if (error) redirect("/admin/events?error=save");
  revalidatePath("/");
  redirect("/admin/events?saved=1");
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/");
  redirect("/admin/events");
}
