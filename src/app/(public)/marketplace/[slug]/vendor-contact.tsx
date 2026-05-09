"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

export default function VendorContact({ vendorName, vendorId }: { vendorName: string; vendorId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    // Track the demo request
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "profile_view", pagePath: `/marketplace/${vendorId}` }),
    }).catch(() => {});

    // Simulate send (in production, this would email the vendor)
    await new Promise(r => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="font-bold text-green-700 text-sm">Request Sent!</p>
        <p className="text-xs text-green-600 mt-1">{vendorName} will reach out to you soon.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-bold text-neuro-navy text-sm mb-3">Request Information</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="name" required placeholder="Your name" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-neuro-orange" />
        <input name="email" type="email" required placeholder="Email" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-neuro-orange" />
        <input name="clinic" placeholder="Clinic name (optional)" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-neuro-orange" />
        <textarea name="message" rows={2} placeholder="What are you interested in?" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none focus:outline-neuro-orange" />
        <button type="submit" disabled={loading} className="w-full py-3 bg-neuro-navy text-white font-bold rounded-lg text-sm hover:bg-neuro-navy-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? "Sending..." : "Request Info"}
        </button>
      </form>
    </div>
  );
}
