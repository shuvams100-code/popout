import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { Avatar } from "@/components/brand";
import { createClient, getViewer } from "@/lib/supabase/server";
import { reviewSelfie } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const user = await getViewer();
  if (!user) notFound();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) notFound();

  const { data: pending } = await supabase.rpc("pending_selfies");
  const rows = (pending ?? []) as { id: string; name: string; age: number | null; selfie_path: string; submitted_at: string }[];

  // Signed URLs so the private bucket never leaks; 10 minutes is plenty for a review pass
  const signed = await Promise.all(rows.map((r) => supabase.storage.from("selfies").createSignedUrl(r.selfie_path, 600).then(({ data }) => data?.signedUrl ?? null)));

  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-5 pb-16 pt-4">
        <div className="mb-4 flex gap-2 text-[13px]">
          <Link href="/admin/events" className="glass flex h-9 items-center rounded-full px-4 font-semibold text-cream">Events</Link>
          <Link href="/admin/metrics" className="glass flex h-9 items-center rounded-full px-4 font-semibold text-cream">Kill criteria</Link>
        </div>
        <h1 className="font-display text-[30px] text-cream" style={{ fontWeight: 700 }}>
          Selfie queue
        </h1>
        <p className="mt-1 text-[13px] text-cream-2">{rows.length ? `${rows.length} waiting. Real face, matches an adult, not a screenshot → approve.` : "Nothing waiting."}</p>
        {error && <p className="mt-3 text-[13px] text-tix">Couldn&apos;t save that. Try again.</p>}

        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {rows.map((r, i) => (
            <li key={r.id} className="glass overflow-hidden rounded-[22px]">
              {signed[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={signed[i]!} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <div className="grid aspect-square place-items-center text-[13px] text-cream-3">Couldn&apos;t load image</div>
              )}
              <div className="flex items-center gap-3 p-3">
                <Avatar seed={r.id} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-cream">
                    {r.name}
                    {r.age ? <span className="text-cream-3">, {r.age}</span> : null}
                  </p>
                  <p className="text-[11px] text-cream-3">{new Date(r.submitted_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
                </div>
              </div>
              <div className="flex gap-2 p-3 pt-0">
                <form action={reviewSelfie.bind(null, r.id, true)} className="flex-1">
                  <button className="btn-pop h-10 w-full text-[14px]">Approve</button>
                </form>
                <form action={reviewSelfie.bind(null, r.id, false)} className="flex-1">
                  <button className="glass h-10 w-full rounded-full text-[13px] font-semibold text-tix">Reject</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
