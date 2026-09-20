"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signInWithGoogle } from "@/app/auth/actions";

const TERMS_VERSION = "2026-09-20";

/** Records the tick in a short-lived cookie; the OAuth callback stamps it on the profile once a session exists. */
export async function startSignIn(formData: FormData) {
  const next = String(formData.get("next") || "/");
  if (formData.get("agree") !== "on") redirect(`/welcome?next=${encodeURIComponent(next)}&error=agree`);
  (await cookies()).set("popout-terms", TERMS_VERSION, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  await signInWithGoogle(next);
}
