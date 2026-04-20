"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Target,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Phone,
  MessageSquare,
  Award,
  TrendingUp,
  X,
  ChevronDown,
} from "lucide-react";
import { Suspense } from "react";
import Footer from "@/components/landing/Footer";
import { createWeekendCheckout } from "./actions";

// ---------------------------------------------------------------------------
// Registration Form
// ---------------------------------------------------------------------------

function RegistrationForm({
  tier,
  onClose,
}: {
  tier: "intensive" | "vip";
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const label = tier === "vip" ? "VIP + 90-Day Coaching" : "Weekend Intensive";
  const price = tier === "vip" ? "$4,997" : "$1,997";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);

    const result = await createWeekendCheckout(tier, name.trim(), email.trim());
    if (result.url) {
      window.location.href = result.url;
    } else {
      alert(result.error || "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-neuro-orange/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-neuro-orange" />
          </div>
          <h3 className="text-xl font-black text-neuro-navy">{label}</h3>
          <p className="text-2xl font-black text-neuro-orange mt-1">{price}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Jane Smith"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@practice.com"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
              submitting
                ? "bg-gray-300 text-gray-500 cursor-wait"
                : "bg-neuro-orange text-white hover:bg-neuro-orange/90 active:scale-[0.98]"
            }`}
          >
            {submitting ? "Processing..." : `Reserve My Seat — ${price}`}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Secure checkout powered by Stripe. Limited to 15 seats.
          </p>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success Banner
// ---------------------------------------------------------------------------

function SuccessBanner() {
  return (
    <div className="bg-green-600 text-white text-center py-4 px-6">
      <div className="flex items-center justify-center gap-2">
        <CheckCircle className="w-5 h-5" />
        <span className="font-bold">You&apos;re registered! Check your email for confirmation and next steps.</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Content
// ---------------------------------------------------------------------------

function WeekendContent() {
  const searchParams = useSearchParams();
  const [registerTier, setRegisterTier] = useState<"intensive" | "vip" | null>(null);
  const registered = searchParams.get("registered") === "true";
  const pricingRef = useRef<HTMLDivElement>(null);

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-dvh bg-[#fafbfc]">
      {registered && <SuccessBanner />}
      {registerTier && (
        <RegistrationForm tier={registerTier} onClose={() => setRegisterTier(null)} />
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* HERO */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="bg-neuro-navy text-white pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-96 h-96 bg-neuro-orange rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-neuro-orange/20 text-neuro-orange text-xs font-bold rounded-full mb-6 uppercase tracking-wider">
            <Target className="w-3.5 h-3.5" />
            Live Weekend Event
          </div>

          <h1 className="text-4xl md:text-6xl font-heading font-black mb-6 leading-tight">
            Screening Mastery<br />
            <span className="text-neuro-orange">Weekend Intensive</span>
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-4">
            3 days. Complete transformation. Walk in with zero screening experience. Walk out with your first event booked, scripts memorized, and a system that fills your schedule every month.
          </p>

          <p className="text-gray-500 mb-8">
            Limited to 15 doctors per cohort. Next dates announced soon.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToPricing}
              className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl text-lg hover:bg-neuro-orange/90 transition-all active:scale-[0.98] flex items-center gap-2"
            >
              Reserve Your Seat <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              Only 15 seats available
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-14">
            <div>
              <div className="text-3xl font-black text-neuro-orange">3</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Days</div>
            </div>
            <div>
              <div className="text-3xl font-black text-neuro-orange">15</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Max Seats</div>
            </div>
            <div>
              <div className="text-3xl font-black text-neuro-orange">$240K</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Annual Potential</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* THE PROBLEM */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-neuro-navy mb-6">
            You know screenings work.<br />You just don&apos;t have a system.
          </h2>
          <div className="text-left space-y-4 text-gray-600 leading-relaxed">
            <p>
              You&apos;ve seen other doctors crushing it with community screenings — getting 10, 15, 20 new patients a month from events. You&apos;ve maybe even tried a screening or two yourself. But without a proven system, it felt awkward, disorganized, and you left wondering if it was worth your Saturday.
            </p>
            <p>
              Here&apos;s what nobody tells you: <strong className="text-neuro-navy">the screening itself is only 1/3 of the opportunity.</strong> Most doctors show up, screen some spines, hand out cards, and hope people call. That&apos;s like fishing with no hook.
            </p>
            <p>
              The doctors who build $20K-$40K/month practices from screenings alone are doing three things at every single event that you&apos;re not. And in one weekend, you&apos;re going to learn all three.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* THE 3-BUILD PHILOSOPHY */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-neuro-orange mb-2">The Framework</p>
            <h2 className="text-3xl font-black text-neuro-navy">The 3-Build Philosophy</h2>
            <p className="text-gray-500 mt-2">What separates a one-time screening from a patient-generating machine</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
              <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center font-black text-xl mb-4">1</div>
              <h3 className="font-black text-neuro-navy text-lg mb-2">Build Your Patient Base</h3>
              <p className="text-sm text-gray-600">
                The complete 6-step screening flow: greet, intake, screen, adjust, offer, book. Every script. Every objection handler. You&apos;ll practice until it&apos;s muscle memory.
              </p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xl mb-4">2</div>
              <h3 className="font-black text-neuro-navy text-lg mb-2">Build Your Network Base</h3>
              <p className="text-sm text-gray-600">
                Before you leave any event, you should have 1-2 NEW screening bookings. We teach you exactly how to approach venue owners, event organizers, and nearby businesses to book your next event FROM this one.
              </p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-xl mb-4">3</div>
              <h3 className="font-black text-neuro-navy text-lg mb-2">Build Your Vendor Base</h3>
              <p className="text-sm text-gray-600">
                Every event has other vendors — massage therapists, supplement companies, trainers. They&apos;re pre-qualified referral partners. We give you the scripts to start relationships on the spot.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-neuro-navy rounded-2xl p-6 text-center text-white">
            <p className="text-sm text-gray-400 mb-1">The compound effect</p>
            <p className="text-lg font-bold">
              2 screenings/month. Each one books 2 more. Within 90 days, you have screenings every week.
              <span className="text-neuro-orange"> That&apos;s $240,000/year in new patient revenue from screenings alone.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* WEEKEND SCHEDULE */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-neuro-orange mb-2">The Weekend</p>
            <h2 className="text-3xl font-black text-neuro-navy">3 Days That Change Everything</h2>
          </div>

          {/* Friday */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-neuro-orange rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-neuro-navy text-lg">Friday Evening</h3>
                <p className="text-sm text-gray-400">6:00 PM - 9:00 PM</p>
              </div>
              <span className="ml-auto px-3 py-1 bg-neuro-orange/10 text-neuro-orange text-xs font-bold rounded-full uppercase">The Foundation</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
              <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">The 3-Build Philosophy — the mindset shift that changes how you see every event</span></div>
              <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">Why 90% of screenings fail (and the 3 mistakes you&apos;re making)</span></div>
              <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">Planning your first screening — everyone picks a date and venue THAT NIGHT</span></div>
              <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">Meet your accountability partner (paired for 30-day follow-up)</span></div>
            </div>
          </div>

          {/* Saturday */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-neuro-navy rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-neuro-navy text-lg">Saturday Full Day</h3>
                <p className="text-sm text-gray-400">9:00 AM - 5:00 PM</p>
              </div>
              <span className="ml-auto px-3 py-1 bg-neuro-navy/10 text-neuro-navy text-xs font-bold rounded-full uppercase">The System</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-neuro-orange uppercase tracking-wider mb-3">Morning Session</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">The complete 6-step screening flow — every script taught line by line</span></div>
                    <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">Live role-play in pairs — greeter + patient, doctor + patient</span></div>
                    <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">The $97 offer and close — practice until it&apos;s natural</span></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-neuro-orange uppercase tracking-wider mb-3">Afternoon Session</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">Objection handling bootcamp — every excuse, every response</span></div>
                    <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">Network Builder — practice approaching venue owners and businesses</span></div>
                    <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">Vendor Connect — how to start referral partnerships on the spot</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sunday */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-neuro-navy text-lg">Sunday Morning</h3>
                <p className="text-sm text-gray-400">9:00 AM - 1:00 PM</p>
              </div>
              <span className="ml-auto px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full uppercase">The Launch</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
              <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">Follow-up systems — set up your text templates and automation</span></div>
              <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">ROI tracking — know your numbers from day one</span></div>
              <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">Hot seat coaching — present your plan, get direct feedback</span></div>
              <div className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-sm text-gray-700">30-day accountability pairing — weekly check-ins to keep you executing</span></div>
              <div className="flex items-start gap-3"><Zap className="w-4 h-4 text-neuro-orange mt-1 flex-shrink-0" /><span className="text-sm text-gray-700 font-bold">Walk out with your first screening booked for next week</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* WHAT YOU LEAVE WITH */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-neuro-navy">What You Leave With</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Your first screening booked for the following week",
              "Every script memorized — not just read, PRACTICED",
              "All materials printed and ready to go",
              "The complete Screening Event Mastery Kit ($149 value)",
              "Follow-up text sequences loaded on your phone",
              "A network of 15 doctors doing the same thing",
              "Your accountability partner for 30 days",
              "30 days of direct text access to Dr. Ray",
              "ROI tracker and conversion benchmarks",
              "The 3-Build Philosophy burned into your brain",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-neuro-navy">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* PRICING */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section ref={pricingRef} className="py-20 px-6" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-neuro-orange mb-2">Investment</p>
            <h2 className="text-3xl font-black text-neuro-navy">Choose Your Level</h2>
            <p className="text-gray-500 mt-2">Both include the full weekend. VIP adds 90 days of personal coaching.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Intensive */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-black text-neuro-navy mb-1">Weekend Intensive</h3>
                <p className="text-sm text-gray-500">The full 3-day experience</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-neuro-navy">$1,997</span>
              </div>
              <div className="space-y-3 flex-1 mb-8">
                {[
                  "Full Friday-Sunday program",
                  "Complete Screening Mastery Kit included",
                  "Live role-play and practice sessions",
                  "All scripts, forms, and trackers",
                  "Accountability partner pairing",
                  "30-day group chat access",
                  "Event recordings for review",
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setRegisterTier("intensive")}
                className="w-full py-4 bg-neuro-navy text-white font-bold rounded-xl text-base hover:bg-neuro-navy/90 transition-all active:scale-[0.98]"
              >
                Reserve My Seat
              </button>
            </div>

            {/* VIP */}
            <div className="bg-white rounded-2xl border-2 border-neuro-orange p-8 flex flex-col relative shadow-lg ring-1 ring-neuro-orange/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-neuro-orange text-white text-xs font-black uppercase tracking-widest rounded-full">
                Most Popular
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-black text-neuro-navy mb-1">VIP + 90-Day Coaching</h3>
                <p className="text-sm text-gray-500">The full weekend + personal coaching</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-neuro-navy">$4,997</span>
              </div>
              <div className="space-y-3 flex-1 mb-8">
                {[
                  "Everything in Weekend Intensive",
                  "90 days of 1-on-1 coaching with Dr. Ray",
                  "Weekly check-in calls (30 min each)",
                  "Direct text/call access for 90 days",
                  "Screening debrief after every event",
                  "Custom screening strategy for your market",
                  "Priority seating at future events",
                  "Lifetime access to recordings + updates",
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-neuro-orange flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setRegisterTier("vip")}
                className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl text-base hover:bg-neuro-orange/90 transition-all active:scale-[0.98]"
              >
                Reserve My VIP Seat
              </button>
            </div>
          </div>

          {/* Value Justification */}
          <div className="mt-10 bg-gray-50 rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              <strong className="text-neuro-navy">The math:</strong> If you get just 4 new patients from your first screening at $2,500 avg case value, that&apos;s $10,000.
            </p>
            <p className="text-sm text-gray-600">
              Your investment pays for itself from <strong className="text-neuro-navy">one event</strong>. Everything after that is profit.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* FAQ */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-neuro-navy text-center mb-10">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "I've never done a screening before. Is this for me?",
                a: "This is ESPECIALLY for you. The weekend is designed so you walk in with zero experience and leave with a complete system, practiced scripts, and your first event booked. You'll role-play every scenario before you ever do it live.",
              },
              {
                q: "Is this in-person or virtual?",
                a: "We offer both options. In-person is recommended for the full experience (role-play is more effective face-to-face), but virtual attendees get the same content, recordings, and support.",
              },
              {
                q: "What if I can't attend one of the days?",
                a: "All sessions are recorded. You'll have access to the recordings within 24 hours. But we strongly recommend attending live — the role-play and hot seats are where the transformation happens.",
              },
              {
                q: "Do I need to bring my team?",
                a: "Your ticket covers you. If you want to bring a CA or office manager (highly recommended — they're half the screening team), add-on tickets are available at a reduced rate. Email us for details.",
              },
              {
                q: "What's the difference between the kit ($79) and the weekend ($1,997)?",
                a: "The kit gives you the WHAT — all the scripts, templates, and systems. The weekend gives you the HOW — live coaching, practice, role-play, accountability, and direct access to someone who's done this thousands of times. The kit is included with the weekend.",
              },
              {
                q: "When is the next weekend?",
                a: "Dates are announced to our waitlist first. Reserve your seat to get on the priority list and be the first to know when the next cohort opens.",
              },
            ].map((faq, i) => (
              <details key={i} className="group bg-gray-50 rounded-xl">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-bold text-neuro-navy text-sm pr-4">{faq.q}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* FINAL CTA */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-neuro-navy text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Stop guessing. Start screening.
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            In 3 days, you&apos;ll have the system, the skills, and the confidence to turn community screenings into the #1 growth engine for your practice.
          </p>
          <button
            onClick={scrollToPricing}
            className="px-10 py-4 bg-neuro-orange text-white font-bold rounded-xl text-lg hover:bg-neuro-orange/90 transition-all active:scale-[0.98] inline-flex items-center gap-2"
          >
            Reserve Your Seat <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Limited to 15 seats. Next cohort filling now.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export with Suspense wrapper
// ---------------------------------------------------------------------------

export default function ScreeningWeekendPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#fafbfc]" />}>
      <WeekendContent />
    </Suspense>
  );
}
