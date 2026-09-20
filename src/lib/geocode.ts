export type Place = { name: string; detail: string; lat: number; lng: number; city?: string };

// The city a result belongs to. A result that *is* a city/town has no `city` field — use its own name.
const cityOf = (p: Record<string, string>) => p.city ?? (["city", "town", "village"].includes(p.type) ? p.name : (p.county ?? p.state));

// ponytail: Photon (komoot) is free, CORS-open, no key. Swap the URL if it rate-limits us.
type Feature = { properties: Record<string, string>; geometry: { coordinates: [number, number] } };

async function photon(q: string, near: { lat: number; lng: number }, limit: number, bounded: boolean): Promise<Feature[]> {
  // Bounded: ~40km box so "thir" finds Third Wave, not a village in Austria.
  // Unbounded: no bias at all — Photon then ranks by importance, so "Rajasthan" is the state, "Mumbai" the city.
  const d = 0.36;
  const where = bounded ? `&lat=${near.lat}&lon=${near.lng}&bbox=${near.lng - d},${near.lat - d},${near.lng + d},${near.lat + d}` : "";
  const u = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${limit}${where}&lang=en`;
  const r = await fetch(u);
  if (!r.ok) return [];
  return ((await r.json()) as { features: Feature[] }).features;
}

const ADMIN = ["country", "state", "region", "county", "city", "town", "district", "village", "locality"];

export async function geocode(q: string, near: { lat: number; lng: number }, limit = 4, scope: "near" | "anywhere" = "near"): Promise<Place[]> {
  let feats: Feature[];
  if (scope === "near") {
    feats = await photon(q, near, limit, true);
  } else {
    // Like Google: the place the world knows by that name first, then local hits.
    const [world, local] = await Promise.all([photon(q, near, limit, false), photon(q, near, limit, true)]);
    const key = (f: Feature) => f.geometry.coordinates.join(",");
    const seen = new Set<string>();
    const all = [...world, ...local].filter((f) => !seen.has(key(f)) && seen.add(key(f)));
    const qn = q.trim().toLowerCase();
    const india = (f: Feature) => f.properties.country === "India";
    const rank = (f: Feature) => {
      const p = f.properties;
      const exact = (p.name ?? "").toLowerCase() === qn;
      const admin = ADMIN.indexOf(p.type);
      const abroad = india(f) ? 0 : 100; // an Indian app: India first, always
      if (exact && admin >= 0) return abroad + admin; // Rajasthan the state before Rajasthan the restaurant
      if (exact) return abroad + 20;
      if (admin >= 0) return abroad + 30 + admin;
      return abroad + 50;
    };
    feats = all.sort((a, b) => rank(a) - rank(b)).slice(0, limit);
  }
  return feats.map((f) => {
    const p = f.properties;
    const name = p.name ?? p.street ?? p.city ?? q;
    const detail = [p.street, p.district, p.city ?? p.state].filter((x) => x && x !== name).join(", ");
    return { name, detail, lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], city: cityOf(p) };
  });
}

/** Nearest named thing to a point — a café, a street, a neighbourhood. */
export async function reverseGeocode(lat: number, lng: number): Promise<Place> {
  const fallback = { name: "Pinned location", detail: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng };
  try {
    const r = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`);
    if (!r.ok) return fallback;
    const j = (await r.json()) as { features: { properties: Record<string, string> }[] };
    const p = j.features[0]?.properties;
    if (!p) return fallback;
    const name = p.name ?? p.street ?? p.district ?? p.city ?? fallback.name;
    const detail = [p.street, p.district, p.city ?? p.state].filter((x) => x && x !== name).join(", ");
    return { name, detail, lat, lng, city: cityOf(p) };
  } catch {
    return fallback;
  }
}
