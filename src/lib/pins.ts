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
      .select("id,title,venue,lat,lng,starts_at,max_people,event_id,verified_only,gender_pref,host:profiles!host_id(id,name,verified_at,gender),members:popout_members(status,plus_one,user:profiles(gender))")
      .eq("status", "open")
      .gte("starts_at", from)
      .order("starts_at"),
    supabase.from("events").select("id,title,venue,lat,lng,starts_at,price").gte("starts_at", from).order("starts_at"),
    supabase.rpc("my_blocked_ids"),
  ]);
  const hidden = new Set(((blocked as string[] | null) ?? []));

  // Host reliability for the cards, one query for all hosts on the map
  const hostIds = [...new Set((popouts ?? []).map((p) => (p.host as unknown as { id: string }).id))];
  const { data: stats } = hostIds.length ? await supabase.from("profile_stats").select("id,hosted,no_shows").in("id", hostIds) : { data: [] };
  const statsBy = new Map((stats ?? []).map((s) => [s.id, s]));

  const pins: Pin[] = [
    ...(popouts ?? [])
      .filter((p) => !hidden.has((p.host as unknown as { id: string }).id))
      .map((p) => {
        type M = { status: string; plus_one: boolean; user: { gender: string | null } | null };
        const host = p.host as unknown as { id: string; name: string; verified_at: string | null; gender: string | null };
        const live = (p.members as unknown as M[]).filter((m) => m.status !== "dropped" && m.status !== "removed");
        const st = statsBy.get(host.id);
        return {
      kind: "popout" as const,
      id: p.id,
      title: p.title,
      venue: p.venue,
      lat: p.lat,
      lng: p.lng,
      startsAt: p.starts_at,
      max: p.max_people,
      filled: live.reduce((n, m) => n + (m.plus_one ? 2 : 1), 0),
      host: { id: host.id, name: host.name, verified: !!host.verified_at, gender: host.gender, hosted: st?.hosted ?? 0, noShows: st?.no_shows ?? 0 },
      verifiedOnly: p.verified_only,
      genderPref: p.gender_pref,
      women: live.filter((m) => m.user?.gender === "woman").length,
      men: live.filter((m) => m.user?.gender === "man").length,
      eventId: p.event_id,
        };
      }),
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
