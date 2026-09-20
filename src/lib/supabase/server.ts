import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { getJwks } from "./jwks";

export const createClient = cache(async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all) => {
          try {
            all.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // ponytail: called from a Server Component; proxy.ts refreshes the session instead
          }
        },
      },
    },
  );
});

export type Viewer = { id: string; name: string };

/**
 * Who's signed in, verified locally from the JWT (no round trip to Supabase Auth).
 * Cached per request so pages, metadata and actions share one check.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const [supabase, jwks] = await Promise.all([createClient(), getJwks()]);
  const { data, error } = await supabase.auth.getClaims(undefined, jwks ? { jwks: jwks as never } : undefined);
  if (error || !data?.claims?.sub) return null;
  const meta = (data.claims.user_metadata ?? {}) as { full_name?: string; name?: string };
  return { id: data.claims.sub, name: meta.full_name ?? meta.name ?? "You" };
});
