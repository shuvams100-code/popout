import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { signInWithGoogle, signOut } from "./auth/actions";

export const metadata: Metadata = {
  title: "Popout",
  description: "Find something to do. Find someone to do it with.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-neutral-900">
        <header className="flex items-center justify-between border-b px-4 py-2">
          <Link href="/" className="font-medium">Popout</Link>
          {user ? (
            <div className="flex items-center gap-3 text-sm">
              <Link href="/profile">Profile</Link>
              <form action={signOut}><button type="submit">Sign out</button></form>
            </div>
          ) : (
            <form action={signInWithGoogle.bind(null, "/")}>
              <button type="submit" className="rounded border px-3 py-1 text-sm">Sign in with Google</button>
            </form>
          )}
        </header>
        {children}
      </body>
    </html>
  );
}
