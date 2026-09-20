import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google OAuth lands here; exchange the code for a session, then bounce to `next` (the page they were on).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const v = request.cookies.get("popout-terms")?.value;
      if (v) await supabase.rpc("accept_terms", { v });
      const res = NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/"}`);
      res.cookies.delete("popout-terms");
      return res;
    }
  }
  return NextResponse.redirect(`${origin}/?auth=error`);
}
