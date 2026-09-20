import Explore from "@/components/explore";
import { fetchPins } from "@/lib/pins";
import { createClient, getViewer } from "@/lib/supabase/server";
import { signInWithGoogle } from "./auth/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [pins, user] = await Promise.all([fetchPins(), getViewer()]);
  const admin = user ? (await (await createClient()).rpc("is_admin")).data === true : false;
  const me = user ? { id: user.id, name: user.name, admin } : null;

  return <Explore pins={pins} user={me} signIn={signInWithGoogle.bind(null, "/")} />;
}
