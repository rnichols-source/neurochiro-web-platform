"use client";

import { useState } from "react";

export function ShareBar({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const shareUrl = url.includes("?") ? `${url}&utm_source=share` : `${url}?utm_source=share`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  }
  return (
    <button type="button" onClick={share} className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 text-sm font-bold text-white">
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
