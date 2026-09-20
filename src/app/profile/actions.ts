"use server";

import { redirect } from "next/navigation";
import { createClient, getViewer } from "@/lib/supabase/server";

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const user = await getViewer();
  if (!user) redirect("/");

  const age = Number(formData.get("age"));
  const gender = String(formData.get("gender") || "");
  if (!Number.isInteger(age) || age < 18 || age > 99) redirect("/profile?error=age");
  if (!["man", "woman", "other"].includes(gender)) redirect("/profile?error=gender");

  const { error } = await supabase
    .from("profiles")
    .update({
      name: String(formData.get("name") || "").trim().slice(0, 60) || "Someone",
      age,
      gender,
      area: String(formData.get("area") || "").trim().slice(0, 60) || null,
      bio: String(formData.get("bio") || "").trim().slice(0, 140) || null,
    })
    .eq("id", user.id);
  if (error) redirect("/profile?error=save");

  const next = String(formData.get("next") || "/");
  redirect(next.startsWith("/") ? next : "/");
}
