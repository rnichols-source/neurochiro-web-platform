"use client";

import { useState } from "react";
import { Target, CheckCircle, ArrowRight, Calendar, Users, Zap, Phone, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/landing/Footer";

export default function ScreeningCallPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);

    try {
      await fetch("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          first_name: name.trim(),
          email: email.trim(),
          source: "screening_strategy_call",
          role: "doctor",
          location: phone.trim() || undefined,
          metadata: { phone: phone.trim(), event: "screening-weekend-may-2026", funnel: "strategy_call" },
        }),
        headers: { "Content-Type": "application/json" },
      });
    } catch {}

    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-dvh bg-[#fafbfc]">
      {/* Hero */}
      <section className="bg-neuro-navy pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-20 left-10 w-96 h-96 bg-neuro-orange rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-neuro-orange/20 text-neuro-orange text-xs font-bold rounded-full mb-6 uppercase tracking-wider border border-neuro-orange/20">
            <Calendar className="w-3.5 h-3.5" />
            May 22-24, 2026 — Limited to 40 Seats
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-black mb-4 leading-tight">
            <span className="text-white">Free 15-Minute</span><br />
            <span className="text-neuro-orange">Screening Strategy Call</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
            Talk with Dr. Ray about how community screenings can become the #1 growth engine for your practice. No pitch. Just strategy.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left — What we'll cover */}
          <div>
            <h2 className="text-2xl font-black text-neuro-navy mb-6">On this call, we&apos;ll cover:</h2>
            <div className="space-y-4">
              {[
                { icon: Target, text: "Where your practice stands right now with new patient acquisition" },
                { icon: Users, text: "How doctors are getting 10-20 new patients/month from one Saturday morning" },
                { icon: Zap, text: "The 3-Build Philosophy — why most screenings fail and what works" },
                { icon: Star, text: "Whether the Screening Intensive (May 22-24) is the right fit for you" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-neuro-orange/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-neuro-orange" />
                  </div>
                  <p className="text-sm text-gray-700 font-medium pt-2">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-neuro-navy rounded-2xl p-6 text-white">
              <p className="text-sm font-bold mb-2">The math:</p>
              <p className="text-sm text-gray-300">4 new patients from one screening at $2,500 avg case value = <span className="text-neuro-orange font-black">$10,000</span>. A $497 investment pays for itself from one Saturday morning.</p>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800"><strong>This is NOT a sales pitch.</strong> It&apos;s 15 minutes to see if screenings make sense for your practice. If it&apos;s not a fit, Dr. Ray will tell you.</p>
            </div>
          </div>

          {/* Right — Form or Calendly redirect */}
          <div>
            {!submitted ? (
              <div className="bg-white rounded-2xl border-2 border-neuro-orange/20 p-8 shadow-lg">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-neuro-orange/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Phone className="w-7 h-7 text-neuro-orange" />
                  </div>
                  <h3 className="text-xl font-black text-neuro-navy">Book Your Free Call</h3>
                  <p className="text-sm text-gray-500 mt-1">Enter your info, then pick a time that works.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name *</label>
                    <input
                      type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. Jane Smith"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email *</label>
                    <input
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@practice.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone (optional)</label>
                    <input
                      type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange"
                    />
                  </div>
                  <button
                    type="submit" disabled={submitting}
                    className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl text-base hover:bg-neuro-orange/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue to Pick a Time <ArrowRight className="w-5 h-5" /></>}
                  </button>
                  <p className="text-[10px] text-gray-400 text-center">15 minutes. No obligation. No pitch.</p>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-green-200 p-8 shadow-lg text-center">
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-black text-neuro-navy mb-2">You&apos;re In!</h3>
                <p className="text-gray-500 mb-6">Now pick a time for your 15-minute strategy call with Dr. Ray.</p>
                <a
                  href="https://calendly.com/drray-neurochirodirectory/screening-strategy-call-neurochiro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl text-base hover:bg-neuro-orange/90 transition-all"
                >
                  <Calendar className="w-5 h-5" /> Pick Your Time on Calendly
                </a>
                <p className="text-xs text-gray-400 mt-4">Can&apos;t find a time? Email drray@neurochirodirectory.com</p>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-3">While you wait, check out the full event details:</p>
                  <Link href="/screening-weekend" className="text-sm font-bold text-neuro-orange hover:underline">
                    View the Screening Intensive →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
