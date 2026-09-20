import { redirect } from "next/navigation";
import SiteHeader from "@/components/site-header";
import PopoutForm from "@/components/popout-form";
import { Mascot } from "@/components/brand";
import { createClient, getViewer } from "@/lib/supabase/server";
import { ERRORS, toFormWhen } from "@/lib/popout-form";
import { createPopout } from "./actions";

export default async function NewPopout({ searchParams }: { searchParams: Promise<{ event?: string; error?: string }> }) {
  const { event: eventId, error } = await searchParams;
  const supabase = await createClient();
  const user = await getViewer();
  const next = eventId ? `/new?event=${eventId}` : "/new";
  if (!user) redirect(`/welcome?next=${encodeURIComponent(next)}`);
  const { data: me } = await supabase.from("profiles").select("age,gender").eq("id", user.id).single();
  if (!me?.age || !me.gender) redirect(`/profile?next=${encodeURIComponent(next)}`);

  const { data: event } = eventId ? await supabase.from("events").select("id,title,venue,lat,lng,starts_at").eq("id", eventId).maybeSingle() : { data: null };

  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader />
      <div className="mx-auto max-w-md px-5 pb-16 pt-4 sm:max-w-lg">
        <div className="reveal flex items-center gap-3">
          <Mascot size={44} />
          <div>
            <h1 className="font-display text-[30px] leading-none text-cream" style={{ fontWeight: 700 }}>
              {event ? "Start a crew" : "Start a Popout"}
            </h1>
            <p className="mt-1 text-[13px] text-cream-2">{event ? `For ${event.title}` : "Six fields. Under a minute."}</p>
          </div>
        </div>
        {error && <p className="mt-4 text-[13px] text-tix">{ERRORS[error] ?? "Something went wrong."}</p>}

        <PopoutForm action={createPopout} defaults={{ when: toFormWhen(event?.starts_at) }} event={event} submitLabel="Publish" />
      </div>
    </main>
  );
}
