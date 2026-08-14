"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

const DEMO_DATE = "August 28, 2026";
const DEMO_TIME = "7:00 PM EST";
const DEMO_DATETIME = new Date("2026-08-28T19:00:00-04:00");

const WHAT_YOULL_SEE = [
  "A live care plan built from scratch in real time",
  "How to present it during a report of findings so patients say yes",
  "The exact scripts and word tracks Dr. Ray uses in his own practice",
  "Real results: what changed in case acceptance after using this tool",
  "Q&A where you can ask anything",
];

export default function CarePlanCloserDemoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const daysUntil = Math.max(0, Math.ceil((DEMO_DATETIME.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (!name || !email) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/demo-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, first_name: name }),
      });
      if (!res.ok) throw new Error("Registration failed");
      setRegistered(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (registered) {
    return (
      <div className="min-h-dvh bg-[#0F1A24] flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <div className="bg-[#1a2e40] rounded-2xl p-12 border border-white/[0.08]">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-5" />
            <h1 className="text-2xl font-black text-white mb-3">You're Registered!</h1>
            <p className="text-white/50 text-sm mb-8 leading-relaxed">
              Mark your calendar: {DEMO_DATE} at {DEMO_TIME}. We'll send you the Zoom link before the demo.
            </p>
            <div className="bg-neuro-orange/10 border border-neuro-orange/20 rounded-xl p-5 mb-8">
              <p className="text-neuro-orange font-black text-sm">What to expect:</p>
              <p className="text-white/40 text-sm mt-2 leading-relaxed">
                60 minutes. Live demo. Real results. And an exclusive beta offer for the first 10 doctors only.
              </p>
            </div>
            <Link href="/" className="text-neuro-orange font-bold text-sm hover:underline">
              Back to NeuroChiro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0F1A24]">
      {/* Hero */}
      <div className="text-center px-6 pt-16 pb-8 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-neuro-orange/15 border border-neuro-orange/30 rounded-full px-4 py-2 mb-6">
          <Calendar className="w-3.5 h-3.5 text-neuro-orange" />
          <span className="text-[11px] font-black text-neuro-orange uppercase tracking-[0.15em]">
            Free Live Demo — {DEMO_DATE}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-6">
          Close More Care Plans.<br />
          <span className="text-neuro-orange">Stop Losing Cases.</span>
        </h1>

        <p className="text-white/45 text-lg leading-relaxed max-w-xl mx-auto mb-2">
          Watch Dr. Ray build a care plan live, present it the way he does with real patients, and show you exactly how this tool changed his case acceptance.
        </p>

        <p className="text-white/25 text-sm">
          {daysUntil === 0 ? "Today" : `${daysUntil} day${daysUntil !== 1 ? "s" : ""} away`} — {DEMO_TIME} on Zoom — Free
        </p>
      </div>

      {/* Two-Column: Form + What You'll See */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="bg-[#1a2e40] rounded-2xl p-8 border-2 border-neuro-orange" style={{ boxShadow: "0 20px 60px rgba(214,104,41,0.15)" }}>
            <h2 className="text-lg font-black text-white mb-6">Save Your Spot</h2>

            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white mb-3 outline-none focus:border-neuro-orange placeholder:text-white/25"
            />
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white mb-5 outline-none focus:border-neuro-orange placeholder:text-white/25"
            />

            {/* Honeypot */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <input type="text" name="company_url" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full py-4 bg-neuro-orange text-white font-black rounded-xl text-base flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-all disabled:opacity-50 shadow-lg shadow-neuro-orange/20"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? "Registering..." : "Save My Spot — Free"}
            </button>

            <p className="text-center text-[11px] text-white/25 mt-3">
              Free. No credit card. Zoom link sent to your email.
            </p>
          </form>

          {/* What You'll See + Stats */}
          <div className="space-y-6">
            <div className="bg-[#1a2e40] rounded-2xl border border-white/[0.08] p-8">
              <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-5">
                What You'll See in the Demo
              </p>
              <div className="space-y-4">
                {WHAT_YOULL_SEE.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white/60 text-sm leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1a2e40] rounded-2xl border border-white/[0.08] grid grid-cols-3 text-center">
              {[
                { value: "10", label: "Beta Spots" },
                { value: "60", label: "Minutes" },
                { value: "$0", label: "To Attend" },
              ].map((stat, i) => (
                <div key={i} className={`py-5 ${i < 2 ? "border-r border-white/[0.06]" : ""}`}>
                  <p className="text-2xl font-black text-neuro-orange">{stat.value}</p>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-neuro-orange/[0.08] border border-neuro-orange/15 rounded-xl p-6">
              <p className="text-white font-black text-sm mb-3">This is for chiropractors who:</p>
              <div className="space-y-2">
                {[
                  "Know they're losing cases they should be closing",
                  "Wing their report of findings every time",
                  "Struggle with the money conversation",
                  "Want a system, not another technique",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-neuro-orange flex-shrink-0" />
                    <span className="text-white/50 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-white/[0.05]">
        <p className="text-white/15 text-xs">NeuroChiro — neurochiro.co</p>
      </div>
    </div>
  );
}
