"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type State = "unsupported" | "ios-install" | "ask" | "on" | "denied" | "hidden";

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

function b64ToU8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/**
 * One card that does the right thing per platform:
 * Android/desktop → ask permission + subscribe. iPhone in Safari → tell them to add to Home Screen first.
 * Silently registers the service worker on every load so an existing subscription keeps working.
 */
export default function PushPrompt({ userId, compact = false }: { userId: string; compact?: boolean }) {
  const [state, setState] = useState<State>("hidden");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Decide asynchronously so the effect body itself never sets state synchronously
    const decide = async (): Promise<State> => {
      if (isIOS() && !standalone()) return "ios-install";
      if (!("serviceWorker" in navigator) || !("Notification" in window)) return "unsupported";
      const reg = await navigator.serviceWorker.register("/sw.js");
      if (await reg.pushManager.getSubscription()) return "on";
      if (Notification.permission === "denied") return "denied";
      if (localStorage.getItem("push-dismissed")) return "hidden";
      return "ask";
    };
    decide().then(setState).catch(() => setState("unsupported"));
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState("denied");
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) });
      const j = sub.toJSON();
      const supabase = createClient();
      await supabase.from("push_subscriptions").upsert({ endpoint: sub.endpoint, user_id: userId, p256dh: j.keys!.p256dh, auth: j.keys!.auth });
      setState("on");
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem("push-dismissed", "1");
    setState("hidden");
  };

  if (state === "hidden" || state === "unsupported" || (state === "on" && compact)) return null;

  if (state === "on") {
    return (
      <div className="glass flex items-center gap-3 rounded-[18px] p-3.5 text-[13px] text-cream-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pop-soft text-pop">🔔</span>
        Notifications are on for this device.
      </div>
    );
  }

  if (state === "ios-install") {
    if (localStorage.getItem("ios-dismissed")) return null;
    return (
      <div className="glass rounded-[18px] p-4 text-[13px]">
        <p className="font-display text-[16px] text-cream" style={{ fontWeight: 600 }}>
          Get notified on iPhone
        </p>
        <p className="mt-1 text-cream-2">
          Safari only allows notifications for apps on your Home Screen. Tap <b className="text-cream">Share</b> <span className="text-cream-3">(the square with an arrow)</span> → <b className="text-cream">Add to Home Screen</b>, then open Popout from there.
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("ios-dismissed", "1");
            setState("hidden");
          }}
          className="mt-2 text-[12px] text-cream-3 underline underline-offset-4"
        >
          Maybe later
        </button>
      </div>
    );
  }

  if (state === "denied") {
    return <p className="text-[12px] text-cream-3">Notifications are blocked for this site. Allow them in your browser settings to get chat and reminders.</p>;
  }

  return (
    <div className="glass rounded-[18px] p-4">
      <p className="font-display text-[16px] text-cream" style={{ fontWeight: 600 }}>
        Know when someone replies
      </p>
      <p className="mt-1 text-[13px] text-cream-2">Chat messages, people joining your Popout, and a &ldquo;still coming?&rdquo; nudge before it starts. Nothing else.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={enable} disabled={busy} className="btn-pop h-10 flex-1 text-[14px] disabled:opacity-60">
          {busy ? "Turning on…" : "Turn on notifications"}
        </button>
        <button type="button" onClick={dismiss} className="glass h-10 rounded-full px-4 text-[13px] text-cream-2">
          Not now
        </button>
      </div>
    </div>
  );
}
