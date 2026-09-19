export type Place = { name: string; detail: string; lat: number; lng: number };

// ponytail: Photon (komoot) is free, CORS-open, no key. Swap the URL if it rate-limits us.
export async function geocode(q: string, near: { lat: number; lng: number }, limit = 4): Promise<Place[]> {
  // ~40km box around the user so "thir" finds Third Wave, not a village in Austria
  const d = 0.36;
  const bbox = `${near.lng - d},${near.lat - d},${near.lng + d},${near.lat + d}`;
  const u = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${limit}&lat=${near.lat}&lon=${near.lng}&bbox=${bbox}&lang=en`;
  const r = await fetch(u);
  if (!r.ok) return [];
  const j = (await r.json()) as { features: { properties: Record<string, string>; geometry: { coordinates: [number, number] } }[] };
  return j.features.map((f) => {
    const p = f.properties;
    const name = p.name ?? p.street ?? p.city ?? q;
    const detail = [p.street, p.district, p.city].filter((x) => x && x !== name).join(", ");
    return { name, detail, lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] };
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
    const detail = [p.street, p.district, p.city].filter((x) => x && x !== name).join(", ");
    return { name, detail, lat, lng };
  } catch {
    return fallback;
  }
}
