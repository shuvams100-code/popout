"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = { userId: string; state: "none" | "pending" | "verified" };

/** Shrinks to ≤800px JPEG in the browser so uploads are ~100KB and never leave anything huge on the server. */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.85));
}

export default function SelfieVerify({ userId, state }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const supabase = createClient();
      const blob = await shrink(f);
      const path = `${userId}/selfie.jpg`;
      const { error } = await supabase.storage.from("selfies").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      const { error: e2 } = await supabase.rpc("submit_selfie", { path });
      if (e2) throw e2;
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  if (state === "verified") {
    return (
      <div className="glass flex items-center gap-3 rounded-[18px] p-3.5 text-[14px] text-cream">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pop-soft text-pop">✓</span>
        Face verified. Hosts and members see the badge.
      </div>
    );
  }

  return (
    <div className="glass rounded-[18px] p-4">
      <p className="font-display text-[17px] text-cream" style={{ fontWeight: 600 }}>
        {state === "pending" ? "Selfie received — we're checking it" : "Verify your face"}
      </p>
      <p className="mt-1 text-[13px] text-cream-2">
        {state === "pending"
          ? "Usually within a day. You can retake it if it was blurry."
          : "One selfie, seen only by the Popout team, never shown to anyone. Gets you a badge and access to verified-only Popouts."}
      </p>
      <label className={`btn-pop mt-3 flex h-11 cursor-pointer items-center justify-center text-[15px] ${busy ? "opacity-60" : ""}`}>
        <input type="file" accept="image/*" capture="user" className="sr-only" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
        {busy ? "Uploading…" : state === "pending" ? "Retake selfie" : "Take a selfie"}
      </label>
      {err && <p className="mt-2 text-[12px] text-tix">{err}</p>}
    </div>
  );
}
