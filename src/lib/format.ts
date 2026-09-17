const TZ = "Asia/Kolkata";

const dayKey = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

const clock = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true })
    .format(d)
    .replace(/\s?(am|pm)/i, (m) => m.trim().toUpperCase());

/** "in 30 min", "8:00 PM", "Tomorrow 7:00 PM", "Sat 11:00 AM" */
export function when(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const diffMin = Math.round((d.getTime() - now.getTime()) / 60000);
  if (diffMin < -30) return "Started";
  if (diffMin < 0) return "Starting now";
  if (diffMin < 90) return `in ${diffMin} min`;
  const today = dayKey(now);
  const target = dayKey(d);
  if (target === today) return clock(d);
  const tomorrow = dayKey(new Date(now.getTime() + 86400000));
  if (target === tomorrow) return `Tomorrow ${clock(d)}`;
  const wd = new Intl.DateTimeFormat("en-IN", { timeZone: TZ, weekday: "short" }).format(d);
  return `${wd} ${clock(d)}`;
}

/** Full form for detail pages: "Tonight, 8:00 PM" / "Saturday 20 Sep, 11:00 AM" */
export function whenLong(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const target = dayKey(d);
  if (target === dayKey(now)) return `Today, ${clock(d)}`;
  if (target === dayKey(new Date(now.getTime() + 86400000))) return `Tomorrow, ${clock(d)}`;
  const day = new Intl.DateTimeFormat("en-IN", { timeZone: TZ, weekday: "long", day: "numeric", month: "short" }).format(d);
  return `${day}, ${clock(d)}`;
}

export function dayBucket(iso: string, now = new Date()): "Today" | "Tomorrow" | "Later" {
  const target = dayKey(new Date(iso));
  if (target === dayKey(now)) return "Today";
  if (target === dayKey(new Date(now.getTime() + 86400000))) return "Tomorrow";
  return "Later";
}

export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function distance(k: number): string {
  return k < 1 ? `${Math.round(k * 100) * 10}m` : `${k.toFixed(1)}km`;
}
