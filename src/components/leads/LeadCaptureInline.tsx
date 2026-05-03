"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail, MapPin } from "lucide-react";

interface LeadCaptureInlineProps {
  source: string;
  role?: string;
  headline?: string;
  description?: string;
  buttonText?: string;
  showLocation?: boolean;
  variant?: "light" | "dark" | "card";
  className?: string;
}

export default function LeadCaptureInline({
  source,
  role = "patient",
  headline = "Stay in the loop",
  description = "Get notified when new doctors join near you.",
  buttonText = "Notify Me",
  showLocation = false,
  variant = "light",
  className = "",
}: LeadCaptureInlineProps) {
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await fetch("/api/leads", {
        method: "POST",
        body: JSON.stringify({ email, source, role, location: location || undefined }),
        headers: { "Content-Type": "application/json" },
      });
    } catch {}
    setStatus("success");
  };

  const isDark = variant === "dark";
  const isCard = variant === "card";

  if (status === "success") {
    return (
      <div className={`text-center py-6 ${className}`}>
        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className={`text-sm font-bold ${isDark ? "text-white" : "text-neuro-navy"}`}>You&apos;re on the list!</p>
        <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>We&apos;ll be in touch.</p>
      </div>
    );
  }

  return (
    <div className={`${isCard ? "bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" : ""} ${className}`}>
      <h3 className={`text-lg font-black mb-1 ${isDark ? "text-white" : "text-neuro-navy"}`}>{headline}</h3>
      <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{description}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className={`flex ${showLocation ? "flex-col" : "flex-col sm:flex-row"} gap-2`}>
          <div className="relative flex-1">
            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/50 ${
                isDark
                  ? "bg-white/10 border border-white/20 text-white placeholder:text-gray-500"
                  : "bg-gray-50 border border-gray-200 text-neuro-navy placeholder:text-gray-400"
              }`}
            />
          </div>
          {showLocation && (
            <div className="relative flex-1">
              <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Your city (optional)"
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/50 ${
                  isDark
                    ? "bg-white/10 border border-white/20 text-white placeholder:text-gray-500"
                    : "bg-gray-50 border border-gray-200 text-neuro-navy placeholder:text-gray-400"
                }`}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm hover:bg-neuro-orange/90 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : buttonText}
          </button>
        </div>
        <p className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-400"}`}>No spam. Unsubscribe anytime.</p>
      </form>
    </div>
  );
}
