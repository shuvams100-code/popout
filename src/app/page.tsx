import Explore from "@/components/explore";
import { fetchPins } from "@/lib/pins";
import { getViewer } from "@/lib/supabase/server";
import { signInWithGoogle } from "./auth/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [pins, user] = await Promise.all([fetchPins(), getViewer()]);
  const me = user ? { id: user.id, name: user.name } : null;

  return <Explore pins={pins} user={me} signIn={signInWithGoogle.bind(null, "/")} />;
}
