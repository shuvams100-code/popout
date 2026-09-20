import { createClient } from "@/lib/supabase/server";

import type { Pin } from "@/lib/types";

/** Everything open in the next ~3 days, sorted by start. Never returns an empty list if anything exists at all (principle 5). */
export async function fetchPins(): Promise<Pin[]> {
  const supabase = await createClient();
  const from = new Date(Date.now() - 60 * 60000).toISOString();
  const to = new Date(Date.now() + 3 * 86400000).toISOString();

  const [{ data: popouts }, { data: events }, { data: blocked }] = await Promise.all([
    supabase
      .from("popouts")
      .select("id,title,venue,lat,lng,starts_at,max_people,event_id,verified_only,host:profiles!host_id(id,name,verified_at),members:popout_members(status)")
      .eq("status", "open")
      .gte("starts_at", from)
      .order("starts_at"),
    supabase.from("events").select("id,title,venue,lat,lng,starts_at,price").gte("starts_at", from).order("starts_at"),
    supabase.rpc("my_blocked_ids"),
  ]);
  const hidden = new Set(((blocked as string[] | null) ?? []));

  const pins: Pin[] = [
    ...(popouts ?? [])
      .filter((p) => !hidden.has((p.host as unknown as { id: string }).id))
      .map((p) => ({
      kind: "popout" as const,
      id: p.id,
      title: p.title,
      venue: p.venue,
      lat: p.lat,
      lng: p.lng,
      startsAt: p.starts_at,
      max: p.max_people,
      filled: (p.members as { status: string }[]).filter((m) => m.status !== "dropped" && m.status !== "removed").length,
      host: (({ id, name, verified_at }: { id: string; name: string; verified_at: string | null }) => ({ id, name, verified: !!verified_at }))(p.host as unknown as { id: string; name: string; verified_at: string | null }),
      verifiedOnly: p.verified_only,
      eventId: p.event_id,
    })),
    ...(events ?? []).map((e) => ({
      kind: "event" as const,
      id: e.id,
      title: e.title,
      venue: e.venue,
      lat: e.lat,
      lng: e.lng,
      startsAt: e.starts_at,
      price: e.price,
    })),
  ].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  // ponytail: widen the window only when nothing is soon; a hard cap avoids a wall of pins
  const soon = pins.filter((p) => p.startsAt <= to);
  return (soon.length ? soon : pins).slice(0, 300);
}
