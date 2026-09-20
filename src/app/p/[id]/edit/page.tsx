import { notFound, redirect } from "next/navigation";
import SiteHeader from "@/components/site-header";
import PopoutForm from "@/components/popout-form";
import { createClient, getViewer } from "@/lib/supabase/server";
import { ERRORS, toFormWhen } from "@/lib/popout-form";
import { updatePopout } from "@/app/new/actions";

export default async function EditPopout({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, { error }, user] = await Promise.all([params, searchParams, getViewer()]);
  if (!user) redirect(`/p/${id}`);
  const supabase = await createClient();
  const { data: p } = await supabase.from("popouts").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  if (p.host_id !== user.id || p.status !== "open") redirect(`/p/${id}`);

  const [name, ...rest] = p.venue.split(", ");
  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader back={`/p/${id}`} />
      <div className="mx-auto max-w-md px-5 pb-16 pt-4 sm:max-w-lg">
        <h1 className="reveal font-display text-[30px] leading-none text-cream" style={{ fontWeight: 700 }}>
          Edit Popout
        </h1>
        <p className="reveal mt-1 text-[13px] text-cream-2">People who joined keep their seats. They&apos;ll see the new details.</p>
        {error && <p className="mt-4 text-[13px] text-tix">{ERRORS[error] ?? "Something went wrong."}</p>}
        <PopoutForm
          action={updatePopout}
          defaults={{
            id: p.id,
            title: p.title,
            venue: { name, detail: rest.join(", "), lat: p.lat, lng: p.lng },
            when: toFormWhen(p.starts_at),
            max_people: p.max_people,
            who: p.gender_pref,
            min_age: p.min_age,
            max_age: p.max_age,
            description: p.description,
            verified_only: p.verified_only,
          }}
          event={null}
          submitLabel="Save changes"
        />
      </div>
    </main>
  );
}
