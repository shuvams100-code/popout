import Explore from "@/components/explore";
import { fetchPins } from "@/lib/pins";
import { createClient } from "@/lib/supabase/server";
import { signInWithGoogle } from "./auth/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const [pins, { data: { user } }] = await Promise.all([fetchPins(), supabase.auth.getUser()]);
  const me = user ? { id: user.id, name: (user.user_metadata.full_name as string) ?? "You" } : null;

  return <Explore pins={pins} user={me} signIn={signInWithGoogle.bind(null, "/")} />;
}
