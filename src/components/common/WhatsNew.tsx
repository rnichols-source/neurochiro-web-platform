"use client";

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import Link from "next/link";

// ============================================================
// UPDATE THIS when you ship new features.
// Users who dismiss it won't see it again until you change the id.
// ============================================================
type PortalUpdate = {
  id: string;
  title: string;
  description: string;
  cta: string;
  ctaLink: string;
  expiresAt: string | null;
};

// Set CURRENT_UPDATE to announce something. Leave it null to show nothing.
const CURRENT_UPDATE: PortalUpdate | null = null;

export default function WhatsNew() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!CURRENT_UPDATE) return;
    if (CURRENT_UPDATE.expiresAt && new Date(CURRENT_UPDATE.expiresAt).getTime() < Date.now()) return;
    const stored = localStorage.getItem("neurochiro_dismissed_update");
    if (stored !== CURRENT_UPDATE.id) setDismissed(false);
  }, []);

  function handleDismiss() {
    if (!CURRENT_UPDATE) return;
    localStorage.setItem("neurochiro_dismissed_update", CURRENT_UPDATE.id);
    setDismissed(true);
  }

  if (!CURRENT_UPDATE || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-neuro-orange/10 to-neuro-orange/5 border border-neuro-orange/20 rounded-2xl p-5 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <div className="w-9 h-9 rounded-xl bg-neuro-orange/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-neuro-orange" />
        </div>
        <div>
          <p className="text-xs font-black text-neuro-orange uppercase tracking-widest mb-1">What&apos;s New</p>
          <h3 className="font-bold text-white text-sm mb-1">{CURRENT_UPDATE.title}</h3>
          <p className="text-xs text-white/50 leading-relaxed mb-3">{CURRENT_UPDATE.description}</p>
          <Link
            href={CURRENT_UPDATE.ctaLink}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-neuro-orange text-white text-xs font-bold rounded-lg hover:bg-neuro-orange/90 transition-colors"
          >
            {CURRENT_UPDATE.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
