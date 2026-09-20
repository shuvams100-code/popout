"use server";

import { cookies } from "next/headers";
import { createClient, getViewer } from "@/lib/supabase/server";

/** One row per tap. Signed-in users are linked; signed-out ones leave an email. */
export async function requestLaunch(input: { city: string; lat?: number; lng?: number; email?: string }) {
  const supabase = await createClient();
  const user = await getViewer();
  const city = input.city.trim().slice(0, 80);
  const email = (input.email ?? "").trim().toLowerCase().slice(0, 120) || null;
  if (!city) return { ok: false as const };
  if (!user && !(email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))) return { ok: false as const };
  const referred_by = (await cookies()).get("popout-via")?.value ?? null; // who shared the /launch link
  const { error } = await supabase.from("launch_requests").insert({ city, lat: input.lat ?? null, lng: input.lng ?? null, user_id: user?.id ?? null, email, referred_by });
  return { ok: !error };
}
