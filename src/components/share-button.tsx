"use client";

import { useState } from "react";

type Props = { text: string; path: string; via?: string | null; className?: string; label?: string };

/** Native share sheet where it exists (phones), WhatsApp deep link otherwise, copy as last resort. `via` = who shared, for attribution. */
export default function ShareButton({ text, path, via, className = "", label = "Share" }: Props) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}${path}${via ? `?via=${via}` : ""}`;
    if (navigator.share) {
      try {
        await navigator.share({ text: `${text} ${url}` });
        return;
      } catch {
        return; // user dismissed
      }
    }
    const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    const w = window.open(wa, "_blank", "noopener");
    if (!w) {
      await navigator.clipboard?.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };
  return (
    <button type="button" onClick={share} className={className}>
      {copied ? "Link copied" : label}
    </button>
  );
}
