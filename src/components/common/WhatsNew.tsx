"use client";

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import Link from "next/link";

// ============================================================
// UPDATE THIS when you ship new features.
// Users who dismiss it won't see it again until you change the id.
// ============================================================
const CURRENT_UPDATE = {
  id: "2026-04-23-spotlight-launch",
  title: "NeuroChiro Highlight is LIVE",
  description: "Watch EP 01 featuring Dr. Jordan Wolff — a second-generation chiropractor from NYC adjusted from birth. New episodes dropping regularly.",
  cta: "Watch Now",
  ctaLink: "/spotlight",
};

export default function WhatsNew() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("neurochiro_dismissed_update");
    if (stored !== CURRENT_UPDATE.id) {
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem("neurochiro_dismissed_update", CURRENT_UPDATE.id);
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-neuro-orange/10 to-neuro-orange/5 border border-neuro-orange/20 rounded-2xl p-5 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors"
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
          <h3 className="font-bold text-neuro-navy text-sm mb-1">{CURRENT_UPDATE.title}</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{CURRENT_UPDATE.description}</p>
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
