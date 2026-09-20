import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Item = { sub: { endpoint: string; keys: { p256dh: string; auth: string } }; note: { title: string; body: string; url: string } };

/** Called by Postgres (pg_net) with a shared secret. Sends the batch; forgets subscriptions that are gone. */
export async function POST(req: NextRequest) {
  if (req.headers.get("x-push-secret") !== process.env.PUSH_SECRET) return NextResponse.json({ error: "nope" }, { status: 401 });
  const { items } = (await req.json()) as { items: Item[] };
  if (!Array.isArray(items) || !items.length) return NextResponse.json({ sent: 0 });

  webpush.setVapidDetails(`mailto:${process.env.VAPID_CONTACT ?? "hello@popout.app"}`, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);

  const dead: string[] = [];
  const results = await Promise.allSettled(
    items.map((it) =>
      webpush.sendNotification(it.sub, JSON.stringify(it.note), { TTL: 3600, urgency: "high" }).catch((e: { statusCode?: number }) => {
        if (e.statusCode === 404 || e.statusCode === 410) dead.push(it.sub.endpoint);
        throw e;
      }),
    ),
  );

  // ponytail: prune via the anon key + a definer RPC guarded by the same secret; no service-role key in the app
  if (dead.length) {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await sb.rpc("prune_push", { endpoints: dead, secret: process.env.PUSH_SECRET });
  }

  return NextResponse.json({ sent: results.filter((r) => r.status === "fulfilled").length, dead: dead.length });
}
