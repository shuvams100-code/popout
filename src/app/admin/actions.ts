"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reviewSelfie(userId: string, approve: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_selfie", { u: userId, approve });
  if (error) redirect("/admin?error=1");
  revalidatePath("/admin");
  redirect("/admin");
}
