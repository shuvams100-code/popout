"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Errors raised by join_popout() in Postgres → query param the page can explain
const KNOWN = ["popout_not_open", "popout_started", "profile_incomplete", "not_eligible", "popout_full", "host_cannot_leave"];

export async function joinPopout(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/p/${id}`);
  const { error } = await supabase.rpc("join_popout", { p: id });
  if (error) {
    const code = KNOWN.find((k) => error.message.includes(k)) ?? "unknown";
    if (code === "profile_incomplete") redirect(`/profile?next=${encodeURIComponent(`/p/${id}`)}`);
    redirect(`/p/${id}?error=${code}`);
  }
  revalidatePath(`/p/${id}`);
  revalidatePath("/");
  redirect(`/p/${id}?joined=1`);
}

export async function leavePopout(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_popout", { p: id });
  if (error) redirect(`/p/${id}?error=${KNOWN.find((k) => error.message.includes(k)) ?? "unknown"}`);
  revalidatePath(`/p/${id}`);
  revalidatePath("/");
  redirect(`/p/${id}`);
}
