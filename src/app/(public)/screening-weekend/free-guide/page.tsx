"use client";

import { useState } from "react";
import { Target, CheckCircle, ArrowRight, Calendar, Download, Zap, TrendingUp, Loader2, Star } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/landing/Footer";

export default function FreeGuidePage() {
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
          source: "screening_lead_magnet",
          role: "doctor",
          location: phone.trim() || undefined,
        }),
        headers: { "Content-Type": "application/json" },
      });
    } catch {}

    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-dvh bg-[#fafbfc]">
        <section className="bg-neuro-navy pt-32 pb-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white mb-4">Your Screening Cheat Sheet is Ready</h1>
            <p className="text-gray-400 text-lg mb-8">Download it below, then book a free strategy call with Dr. Ray.</p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-16">
          {/* The Lead Magnet Content — displayed directly */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden mb-10">
            <div className="bg-neuro-navy p-8 text-center">
              <p className="text-neuro-orange text-xs font-black uppercase tracking-widest mb-2">Free Resource</p>
              <h2 className="text-2xl font-heading font-black text-white">The Screening ROI Calculator + Cheat Sheet</h2>
            </div>

            <div className="p-8 space-y-8">
              {/* ROI Calculator */}
              <div>
                <h3 className="text-lg font-black text-neuro-navy mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-neuro-orange" /> Your Screening ROI</h3>
                <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center border border-gray-100">
                      <p className="text-3xl font-black text-neuro-navy">30-50</p>
                      <p className="text-xs text-gray-500 mt-1">People screened per event</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center border border-gray-100">
                      <p className="text-3xl font-black text-neuro-navy">8-15</p>
                      <p className="text-xs text-gray-500 mt-1">Book consults same day</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center border border-gray-100">
                      <p className="text-3xl font-black text-neuro-navy">4-6</p>
                      <p className="text-xs text-gray-500 mt-1">Start care</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center border border-neuro-orange/20 bg-neuro-orange/5">
                      <p className="text-3xl font-black text-neuro-orange">$10K+</p>
                      <p className="text-xs text-gray-500 mt-1">Revenue per screening</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center pt-2">Based on $2,500 average patient value. Do this twice a month = <strong className="text-neuro-navy">$240,000/year</strong> in new patient revenue.</p>
                </div>
              </div>

              {/* The 60-Second Framework */}
              <div>
                <h3 className="text-lg font-black text-neuro-navy mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-neuro-orange" /> The 60-Second Screening Conversation</h3>
                <div className="space-y-3">
                  {[
                    { step: "1", title: "The Hook (5 sec)", desc: "\"Hi! We're doing free nervous system stress checks today. Takes 30 seconds. Want to see how stressed your nervous system is?\"" },
                    { step: "2", title: "The Scan (20 sec)", desc: "Quick assessment — posture check, palpation, or HRV reading. Make it visual. Make it tangible." },
                    { step: "3", title: "The Reveal (15 sec)", desc: "\"See this? This tells me your nervous system is running in stress mode. That affects your sleep, energy, everything.\"" },
                    { step: "4", title: "The Bridge (10 sec)", desc: "\"The good news — this is exactly what we specialize in. We help people get their nervous system back to normal.\"" },
                    { step: "5", title: "The Close (10 sec)", desc: "\"I have a few spots this week for a full evaluation — $97 instead of the usual $250. Want me to book you in?\"" },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-neuro-orange text-white flex items-center justify-center font-black text-sm flex-shrink-0">{s.step}</div>
                      <div>
                        <p className="font-bold text-neuro-navy text-sm">{s.title}</p>
                        <p className="text-sm text-gray-600 mt-1 italic">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">This is just the framework. The full system — with role-play practice, objection handling, and follow-up sequences — is taught at the Screening Intensive.</p>
              </div>

              {/* 3-Build Preview */}
              <div>
                <h3 className="text-lg font-black text-neuro-navy mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-neuro-orange" /> The 3-Build Philosophy (Preview)</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="font-black text-green-700 text-sm mb-1">Build 1: Patient Base</p>
                    <p className="text-xs text-gray-600">Get 4-6 new patients per screening using the 60-second framework above.</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="font-black text-blue-700 text-sm mb-1">Build 2: Network Base</p>
                    <p className="text-xs text-gray-600">Leave every event with 1-2 NEW event bookings. Never run out of screenings.</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="font-black text-purple-700 text-sm mb-1">Build 3: Vendor Base</p>
                    <p className="text-xs text-gray-600">Get local businesses to sponsor and co-host your events. Screenings pay for themselves.</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">Most doctors only know Build 1. The full system is taught at the Screening Intensive — May 22-24.</p>
              </div>

              {/* Quick Checklist */}
              <div>
                <h3 className="text-lg font-black text-neuro-navy mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-neuro-orange" /> Pre-Screening Checklist</h3>
                <div className="grid md:grid-cols-2 gap-2">
                  {[
                    "Choose a high-traffic location (farmers market, gym, church)",
                    "Confirm setup logistics (table, banner, power)",
                    "Prep 50 intake forms / findings cards",
                    "Load follow-up text templates on your phone",
                    "Practice the 60-second conversation 5x",
                    "Bring a deposit collection system (Square, cash)",
                    "Identify 2-3 nearby businesses to approach",
                    "Set up your post-event follow-up sequence",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 p-2">
                      <div className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA to book call + register */}
          <div className="grid md:grid-cols-2 gap-6">
            <a
              href="https://calendly.com/drray-neurochirodirectory/screening-strategy-call-neurochiro"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-neuro-navy rounded-2xl p-8 text-center hover:bg-neuro-navy/90 transition-colors group"
            >
              <Calendar className="w-10 h-10 text-neuro-orange mx-auto mb-3" />
              <h3 className="text-lg font-black text-white mb-2">Book a Free Strategy Call</h3>
              <p className="text-sm text-gray-400 mb-4">15 minutes with Dr. Ray. No pitch.</p>
              <span className="inline-flex items-center gap-2 text-neuro-orange font-bold text-sm group-hover:gap-3 transition-all">
                Pick a Time <ArrowRight className="w-4 h-4" />
              </span>
            </a>
            <Link
              href="/screening-weekend"
              className="bg-neuro-orange rounded-2xl p-8 text-center hover:bg-neuro-orange/90 transition-colors group"
            >
              <Target className="w-10 h-10 text-white mx-auto mb-3" />
              <h3 className="text-lg font-black text-white mb-2">View the Screening Intensive</h3>
              <p className="text-sm text-white/70 mb-4">May 22-24. 40 seats. Full details.</p>
              <span className="inline-flex items-center gap-2 text-white font-bold text-sm group-hover:gap-3 transition-all">
                See the Event <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#fafbfc]">
      {/* Hero */}
      <section className="bg-neuro-navy pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-20 right-10 w-96 h-96 bg-neuro-orange rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full mb-6 uppercase tracking-wider border border-green-500/20">
            <Download className="w-3.5 h-3.5" />
            Free Download — No Credit Card Required
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-black mb-4 leading-tight">
            <span className="text-white">The Screening</span><br />
            <span className="text-neuro-orange">ROI Calculator + Cheat Sheet</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-4">
            The exact framework that turns a 3-hour Saturday morning into $10,000+ in new patient revenue. Free.
          </p>
        </div>
      </section>

      {/* Form + What You Get */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left — What's inside */}
          <div>
            <h2 className="text-2xl font-black text-neuro-navy mb-6">What&apos;s Inside:</h2>
            <div className="space-y-4">
              {[
                { title: "Screening ROI Calculator", desc: "See exactly how much revenue one screening generates based on your patient value" },
                { title: "The 60-Second Conversation Framework", desc: "The 5-step script that books patients on the spot — not \"call us Monday\"" },
                { title: "The 3-Build Philosophy Preview", desc: "Why screenings fail and the 3 things top producers do at every event" },
                { title: "Pre-Screening Checklist", desc: "Everything you need before, during, and after your event" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-neuro-navy">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-neuro-navy rounded-2xl p-6 text-white">
              <p className="text-sm font-bold mb-2">Why am I giving this away?</p>
              <p className="text-sm text-gray-300">Because once you see the math and the framework, you&apos;ll want the full system. That&apos;s taught at the Screening Intensive (May 22-24). But the cheat sheet alone is enough to run a better screening than 90% of chiropractors.</p>
            </div>
          </div>

          {/* Right — Form */}
          <div>
            <div className="bg-white rounded-2xl border-2 border-neuro-orange/20 p-8 shadow-lg sticky top-24">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-neuro-orange/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Download className="w-7 h-7 text-neuro-orange" />
                </div>
                <h3 className="text-xl font-black text-neuro-navy">Get Your Free Cheat Sheet</h3>
                <p className="text-sm text-gray-500 mt-1">Instant access. No spam.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Jane Smith" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email *</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@practice.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone (optional)</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange" />
                </div>
                <button type="submit" disabled={submitting} className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl text-base hover:bg-neuro-orange/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" /> Get Free Cheat Sheet</>}
                </button>
                <p className="text-[10px] text-gray-400 text-center">Free. No credit card. Unsubscribe anytime.</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
