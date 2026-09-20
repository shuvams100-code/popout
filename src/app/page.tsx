import Explore from "@/components/explore";
import { fetchPins } from "@/lib/pins";
import { createClient, getViewer } from "@/lib/supabase/server";
import { signInWithGoogle } from "./auth/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [pins, user] = await Promise.all([fetchPins(), getViewer()]);
  let me: { id: string; name: string; admin: boolean; verified: boolean; pending: boolean; unread: number } | null = null;
  if (user) {
    const supabase = await createClient();
    const [{ data: admin }, { data: prof }, { data: unread }] = await Promise.all([
      supabase.rpc("is_admin"),
      supabase.from("profiles").select("verified_at,selfie_submitted_at").eq("id", user.id).maybeSingle(),
      supabase.rpc("unread_count"),
    ]);
    me = { id: user.id, name: user.name, admin: admin === true, verified: !!prof?.verified_at, pending: !!prof?.selfie_submitted_at, unread: (unread as number | null) ?? 0 };
  }

  return <Explore pins={pins} user={me} signIn={signInWithGoogle.bind(null, "/")} />;
}
