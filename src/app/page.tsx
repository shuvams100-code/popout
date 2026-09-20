import Explore from "@/components/explore";
import { fetchPins } from "@/lib/pins";
import { createClient, getViewer } from "@/lib/supabase/server";
import { signInWithGoogle } from "./auth/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [pins, user] = await Promise.all([fetchPins(), getViewer()]);
  let me: { id: string; name: string; admin: boolean; verified: boolean } | null = null;
  if (user) {
    const supabase = await createClient();
    const [{ data: admin }, { data: prof }] = await Promise.all([supabase.rpc("is_admin"), supabase.from("profiles").select("verified_at").eq("id", user.id).maybeSingle()]);
    me = { id: user.id, name: user.name, admin: admin === true, verified: !!prof?.verified_at };
  }

  return <Explore pins={pins} user={me} signIn={signInWithGoogle.bind(null, "/")} />;
}
