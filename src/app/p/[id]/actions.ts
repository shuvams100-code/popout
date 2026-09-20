"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getViewer } from "@/lib/supabase/server";

// Errors raised by join_popout() in Postgres → query param the page can explain
const KNOWN = ["popout_not_open", "popout_started", "profile_incomplete", "not_eligible", "popout_full", "host_cannot_leave"];

export async function joinPopout(id: string) {
  const supabase = await createClient();
  const user = await getViewer();
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

export async function removeMember(popoutId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", { p: popoutId, u: userId });
  if (error) redirect(`/p/${popoutId}?error=unknown`);
  revalidatePath(`/p/${popoutId}`);
  redirect(`/p/${popoutId}`);
}

export async function blockUser(userId: string, back: string) {
  const supabase = await createClient();
  const user = await getViewer();
  if (!user || user.id === userId) redirect(back);
  await supabase.from("blocks").upsert({ blocker_id: user.id, blocked_id: userId });
  revalidatePath("/");
  redirect("/?blocked=1");
}

export async function report(formData: FormData) {
  const supabase = await createClient();
  const user = await getViewer();
  const back = String(formData.get("back") || "/");
  if (!user) redirect(back);
  const subject_type = String(formData.get("subject_type"));
  const subject_id = String(formData.get("subject_id"));
  const reason = String(formData.get("reason") || "").slice(0, 500);
  if (!["profile", "popout", "message"].includes(subject_type) || !subject_id || !reason) redirect(back);
  await supabase.from("reports").insert({ reporter_id: user.id, subject_type, subject_id, reason });
  redirect(`${back}${back.includes("?") ? "&" : "?"}reported=1`);
}

export async function confirmAttendance(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_attendance", { p: id });
  if (error) redirect(`/p/${id}?error=${KNOWN.find((k) => error.message.includes(k)) ?? "unknown"}`);
  revalidatePath(`/p/${id}`);
  redirect(`/p/${id}?confirmed=1`);
}

export async function markAttendance(popoutId: string, userId: string, showed: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_attendance", { p: popoutId, u: userId, showed });
  if (error) redirect(`/p/${popoutId}?error=unknown`);
  revalidatePath(`/p/${popoutId}`);
  redirect(`/p/${popoutId}`);
}

export async function finishPopout(id: string) {
  const supabase = await createClient();
  await supabase.rpc("finish_popout", { p: id });
  revalidatePath(`/p/${id}`);
  revalidatePath("/");
  redirect(`/p/${id}?done=1`);
}
