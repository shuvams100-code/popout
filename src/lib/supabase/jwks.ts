// JWKS cached across requests (auth-js caches per client instance, and we make one per request).
type Jwks = { keys: { kid: string; [k: string]: unknown }[] };
let cached: { jwks: Jwks; at: number } | null = null;
const TTL = 10 * 60 * 1000;

export async function getJwks(): Promise<Jwks | undefined> {
  if (cached && Date.now() - cached.at < TTL) return cached.jwks;
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/.well-known/jwks.json`, { cache: "no-store" });
    if (!r.ok) return cached?.jwks;
    const jwks = (await r.json()) as Jwks;
    cached = { jwks, at: Date.now() };
    return jwks;
  } catch {
    return cached?.jwks;
  }
}
