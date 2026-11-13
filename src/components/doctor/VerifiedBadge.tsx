"use client";

import { useState } from "react";
import { usePortal } from "@/components/portal/PortalProvider";

export default function VerifiedBadge({
  doctorSlug,
  doctorName,
}: {
  doctorSlug: string;
  doctorName: string;
}) {
  const portal = usePortal();
  const locked = portal.membership.tier === "free";
  const ready = Boolean(doctorSlug && doctorName.trim());
  const [copied, setCopied] = useState(false);
  const [imageOk, setImageOk] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://neurochiro.co";
  const embedCode = ready
    ? `<a href="${baseUrl}/directory/${doctorSlug}" target="_blank" rel="noopener noreferrer" style="display:inline-block;">\n  <img loading="lazy" decoding="async" src="${baseUrl}/api/badge/${doctorSlug}" alt="Verified NeuroChiro Provider - ${doctorName}" width="200" height="60" style="border:none;border-radius:12px;" />\n</a>`
    : "";

  async function copy() {
    if (locked || !ready) return;
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="bg-white rounded-xl border border-portal-border p-6">
      <h2 className="text-lg font-bold text-portal-ink">Add your NeuroChiro badge to your website</h2>
      <p className="mt-2 text-sm text-portal-ink-2 max-w-xl">
        Paste this code on your clinic website. It shows community members you&apos;re a verified NeuroChiro member and links to your profile on neurochiro.co.
      </p>
      {locked ? (
        <p className="mt-4 text-sm font-bold text-portal-ink">Badges are part of Pro.</p>
      ) : !ready ? (
        <div className="mt-4">
          <p className="text-sm text-portal-ink-2">Loading…</p>
          <button type="button" disabled className="mt-3 min-h-11 px-4 rounded-lg bg-portal-surface text-sm font-bold text-portal-muted">
            Copy
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {imageOk ? (
            <img
              src={`/api/badge/${doctorSlug}`}
              alt={`Verified NeuroChiro Provider - ${doctorName}`}
              width={200}
              height={60}
              className="h-auto w-[200px] rounded-xl border border-portal-border bg-white"
              onError={() => setImageOk(false)}
            />
          ) : (
            <svg viewBox="0 0 200 60" width="200" height="60" className="rounded-xl border border-portal-border" role="img" aria-label={`Verified NeuroChiro Provider - ${doctorName}`}>
              <rect width="200" height="60" rx="12" fill="#0B1118" />
              <rect x="1" y="1" width="198" height="58" rx="11" fill="none" stroke="#D66829" strokeWidth="2" />
              <text x="52" y="27" fill="white" fontFamily="Montserrat, sans-serif" fontWeight="800" fontSize="11">PRO PROVIDER</text>
              <text x="52" y="43" fill="#9CA3AF" fontFamily="Montserrat, sans-serif" fontWeight="600" fontSize="9">NeuroChiro Directory</text>
            </svg>
          )}
          <pre className="overflow-x-auto rounded-lg bg-portal-sidebar p-4 text-sm text-white">{embedCode}</pre>
          <button type="button" onClick={copy} className="min-h-11 px-4 rounded-lg bg-portal-accent text-sm font-bold text-white">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </section>
  );
}
