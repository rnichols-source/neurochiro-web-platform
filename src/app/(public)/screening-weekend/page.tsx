"use client";

import { useState, useRef } from "react";
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
  Video,
  Monitor,
  Headphones,
} from "lucide-react";
import { Suspense } from "react";
import Footer from "@/components/landing/Footer";
import { createWeekendCheckout } from "./actions";

// ---------------------------------------------------------------------------
// Registration Form with Payment Plan Toggle
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
  const [paymentPlan, setPaymentPlan] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const label = tier === "vip" ? "VIP + 90-Day Coaching" : "Weekend Intensive";
  const fullPrice = tier === "vip" ? "$5,997" : "$2,997";
  const planPrice = tier === "vip" ? "$2,199" : "$1,099";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);

    const checkoutTier = paymentPlan ? `${tier}-plan` as any : tier;
    const result = await createWeekendCheckout(checkoutTier, name.trim(), email.trim());
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
        </div>

        {/* Payment Toggle */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          <button
            onClick={() => setPaymentPlan(false)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              !paymentPlan ? "bg-white text-neuro-navy shadow-sm" : "text-gray-500"
            }`}
          >
            Pay in Full — {fullPrice}
          </button>
          <button
            onClick={() => setPaymentPlan(true)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              paymentPlan ? "bg-white text-neuro-navy shadow-sm" : "text-gray-500"
            }`}
          >
            3 Payments — {planPrice}/mo
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Jane Smith" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@practice.com" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange" />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all ${
              submitting ? "bg-gray-300 text-gray-500 cursor-wait" : "bg-neuro-orange text-white hover:bg-neuro-orange/90 active:scale-[0.98]"
            }`}
          >
            {submitting ? "Processing..." : paymentPlan ? `Start Plan — ${planPrice} today` : `Reserve My Seat — ${fullPrice}`}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Secure checkout powered by Stripe. Limited to 15 seats.
            {paymentPlan && " 3 monthly payments, cancel anytime."}
          </p>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
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
      {/* Success Banner */}
      {registered && (
        <div className="bg-green-600 text-white text-center py-4 px-6">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">You&apos;re registered! Check your email for your Zoom link and weekend prep materials.</span>
          </div>
        </div>
      )}

      {registerTier && (
        <RegistrationForm tier={registerTier} onClose={() => setRegisterTier(null)} />
      )}

      {/* ═══ HERO ═══ */}
      <section className="bg-neuro-navy pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-20 left-10 w-96 h-96 bg-neuro-orange rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-neuro-orange text-xs font-bold rounded-full mb-6 uppercase tracking-wider border border-white/10">
            <Video className="w-3.5 h-3.5" />
            Live Virtual Weekend Event
          </div>

          <h1 className="text-4xl md:text-6xl font-heading font-black mb-6 leading-tight">
            <span className="text-white">Screening Mastery</span><br />
            <span className="text-neuro-orange">Weekend Intensive</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
            3 days on Zoom. Complete transformation. Walk in with zero screening experience. Walk out with your first event booked, scripts memorized, and a live operating system that fills your schedule every month.
          </p>

          <div className="inline-flex items-center gap-2 text-sm text-gray-500 mb-8 bg-white/5 px-4 py-2 rounded-full">
            <Monitor className="w-4 h-4" />
            Live on Zoom — attend from anywhere, recordings included
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToPricing}
              className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl text-lg hover:bg-neuro-orange/90 transition-all active:scale-[0.98] flex items-center gap-2"
            >
              Reserve Your Seat <ArrowRight className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-500">or 3 payments of $1,099</span>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-14">
            <div>
              <div className="text-3xl font-black text-white">3</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Days</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white">15</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Max Seats</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white">$240K+</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Annual Potential</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROBLEM ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-neuro-navy mb-6">
            You know screenings work.<br />You just don&apos;t have a system.
          </h2>
          <div className="text-left space-y-4 text-gray-600 leading-relaxed">
            <p>You&apos;ve seen other doctors getting 10, 15, 20 new patients a month from community events. You&apos;ve maybe tried a screening yourself. But without a proven system, it felt awkward and disorganized.</p>
            <p>Here&apos;s what nobody tells you: <strong className="text-neuro-navy">the screening itself is only 1/3 of the opportunity.</strong> Most doctors show up, screen some spines, hand out cards, and hope people call. That&apos;s fishing with no hook.</p>
            <p>The doctors building $20K-$40K/month from screenings are doing <strong className="text-neuro-navy">three things</strong> at every event that you&apos;re not. In one weekend, you&apos;re going to learn all three.</p>
          </div>
        </div>
      </section>

      {/* ═══ 3-BUILD PHILOSOPHY ═══ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-neuro-orange mb-2">The Framework Nobody Else Teaches</p>
            <h2 className="text-3xl font-black text-neuro-navy">The 3-Build Philosophy</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
              <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center font-black text-xl mb-4">1</div>
              <h3 className="font-black text-neuro-navy text-lg mb-2">Build Your Patient Base</h3>
              <p className="text-sm text-gray-600">The complete 6-step flow: greet, intake, screen, adjust, offer, book. Every script. Every objection handler. Practiced until it&apos;s muscle memory.</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xl mb-4">2</div>
              <h3 className="font-black text-neuro-navy text-lg mb-2">Build Your Network Base</h3>
              <p className="text-sm text-gray-600">Leave every event with 1-2 NEW screening bookings. We teach you how to approach venue owners, event organizers, and nearby businesses to book your next event FROM this one.</p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-xl mb-4">3</div>
              <h3 className="font-black text-neuro-navy text-lg mb-2">Build Your Vendor Base</h3>
              <p className="text-sm text-gray-600">Other vendors at events are pre-qualified referral partners. Massage therapists, supplement companies, trainers. We give you the scripts to start partnerships on the spot.</p>
            </div>
          </div>
          <div className="mt-8 bg-neuro-navy rounded-2xl p-6 text-center text-white">
            <p className="text-lg font-bold">2 screenings/month. Each one books 2 more. Within 90 days, you have screenings every week.<span className="text-neuro-orange"> That&apos;s $240,000/year in new patient revenue.</span></p>
          </div>
        </div>
      </section>

      {/* ═══ DETAILED CURRICULUM ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-neuro-orange mb-2">The Weekend</p>
            <h2 className="text-3xl font-black text-neuro-navy">3 Days. 11 Hours. Zero Filler.</h2>
            <p className="text-gray-500 mt-2">Live on Zoom with breakout rooms for practice. Every session recorded.</p>
          </div>

          {/* FRIDAY */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-neuro-orange rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5 text-white" /></div>
              <div><h3 className="font-black text-neuro-navy text-lg">Friday Evening</h3><p className="text-sm text-gray-400">6:00 - 8:30 PM EST</p></div>
              <span className="ml-auto px-3 py-1 bg-neuro-orange/10 text-neuro-orange text-xs font-bold rounded-full uppercase">The Foundation</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {[
                { time: "6:00-6:30", title: "Welcome + Introductions", desc: "Everyone shares: name, practice, city, biggest growth struggle. Personal, not a lecture." },
                { time: "6:30-7:15", title: "The 3-Build Philosophy", desc: "The mindset shift. Why most screenings fail and what the top performers do differently." },
                { time: "7:15-7:45", title: "Why Screenings Fail", desc: "The 5 fatal mistakes: hiding behind the booth, no offer, no follow-up, no deposit, no next-event booking." },
                { time: "7:45-8:15", title: "Plan Your First Event — NOW", desc: "Everyone picks a date, venue type, and target in the next 14 days. Nobody leaves Friday without a plan." },
                { time: "8:15-8:30", title: "Accountability Pairing", desc: "Paired up for 30-day weekly check-ins. Exchange numbers. Rules set." },
              ].map((s, i) => (
                <div key={i} className={`flex gap-4 p-4 ${i > 0 ? "border-t border-gray-50" : ""}`}>
                  <span className="text-xs font-mono text-gray-400 w-20 flex-shrink-0 pt-0.5">{s.time}</span>
                  <div><p className="font-bold text-neuro-navy text-sm">{s.title}</p><p className="text-xs text-gray-500 mt-0.5">{s.desc}</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* SATURDAY */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-neuro-navy rounded-xl flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
              <div><h3 className="font-black text-neuro-navy text-lg">Saturday Full Day</h3><p className="text-sm text-gray-400">9:00 AM - 3:00 PM EST</p></div>
              <span className="ml-auto px-3 py-1 bg-neuro-navy/10 text-neuro-navy text-xs font-bold rounded-full uppercase">The System</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {[
                { time: "9:00-9:15", title: "Energy Check + Recap", desc: "Quick recap of Friday. Today is about PRACTICE, not theory." },
                { time: "9:15-10:00", title: "Steps 1 & 2: Greet + Intake", desc: "Greeter scripts taught, then breakout rooms — practice in pairs, rotate 3 times. Coaching on eye contact, tonality, the hook." },
                { time: "10:00-10:15", title: "Break", desc: "Cameras off. Stand up. Move." },
                { time: "10:15-11:15", title: "Steps 3 & 4: Screen + Adjust", desc: "Live demo with a volunteer on camera. Then breakout rooms to practice the verbal flow — history, findings, the 'wow' moment." },
                { time: "11:15-12:00", title: "Step 5: The $97 Offer", desc: "The money session. Exact script, tonality, body language. Role-play in breakout rooms 3 times each. By lunch, everyone delivers it without thinking." },
                { time: "12:00-12:30", title: "Lunch Break", desc: "" },
                { time: "12:30-1:15", title: "Step 6: Book + Collect", desc: "Deposit collection, scheduling, findings card handoff. Role-play the handoff and common objections." },
                { time: "1:15-2:00", title: "Objection Handling Bootcamp", desc: "8 most common objections with scripted responses. Practice in breakout rooms until it's reflex." },
                { time: "2:00-2:15", title: "Break", desc: "" },
                { time: "2:15-2:45", title: "Network Builder", desc: "Build #2 — venue owner script, nearby business pitch, event organizer approach. Role-play each scenario." },
                { time: "2:45-3:00", title: "Vendor Connect", desc: "Build #3 — approaching other vendors, the exchange script, follow-up text. Identify 3 vendor types to target." },
              ].map((s, i) => (
                <div key={i} className={`flex gap-4 p-4 ${i > 0 ? "border-t border-gray-50" : ""} ${s.title === "Break" || s.title === "Lunch Break" ? "bg-gray-50" : ""}`}>
                  <span className="text-xs font-mono text-gray-400 w-20 flex-shrink-0 pt-0.5">{s.time}</span>
                  <div><p className={`font-bold text-sm ${s.title === "Break" || s.title === "Lunch Break" ? "text-gray-400" : "text-neuro-navy"}`}>{s.title}</p>{s.desc && <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SUNDAY */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
              <div><h3 className="font-black text-neuro-navy text-lg">Sunday Morning</h3><p className="text-sm text-gray-400">9:00 AM - 12:30 PM EST</p></div>
              <span className="ml-auto px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full uppercase">The Launch</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {[
                { time: "9:00-9:15", title: "Energy Check", desc: "Everyone shares one thing from Saturday that clicked." },
                { time: "9:15-10:00", title: "Follow-Up Systems", desc: "Complete sequence: same-day text, day-before reminder, warm lead, no-show recovery. Load templates into your phone NOW." },
                { time: "10:00-10:45", title: "ROI Tracking + Your Numbers", desc: "The metrics that matter. Walk through the Screening OS dashboard. Everyone sets up their account live." },
                { time: "10:45-11:00", title: "Break", desc: "" },
                { time: "11:00-11:30", title: "Screening OS — Live Setup", desc: "Events, Network, Vendors, Outreach tabs. See the pre-loaded events in YOUR area. Pick your top 5 and mark them 'To Contact.'" },
                { time: "11:30-12:00", title: "Hot Seat Coaching", desc: "Each doctor presents their plan: venue, date, who's coming, concerns. Direct feedback from Dr. Ray and the room." },
                { time: "12:00-12:15", title: "The 90-Day Game Plan", desc: "Write it down: screening dates, network targets, vendor targets, revenue goals. Accountability partner reviews." },
                { time: "12:15-12:30", title: "The Close", desc: "You have everything. Scripts practiced. System built. First event booked. Now go execute." },
              ].map((s, i) => (
                <div key={i} className={`flex gap-4 p-4 ${i > 0 ? "border-t border-gray-50" : ""} ${s.title === "Break" ? "bg-gray-50" : ""}`}>
                  <span className="text-xs font-mono text-gray-400 w-20 flex-shrink-0 pt-0.5">{s.time}</span>
                  <div><p className={`font-bold text-sm ${s.title === "Break" ? "text-gray-400" : "text-neuro-navy"}`}>{s.title}</p>{s.desc && <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ZOOM FORMAT BENEFITS ═══ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-neuro-navy">Why Zoom Actually Works Better</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Monitor, title: "Your laptop is right there", desc: "Set up the Screening OS live during the session. Not after. Not later. Right now." },
              { icon: Headphones, title: "Less self-conscious", desc: "Breakout room role-play is actually easier than practicing in front of a room of strangers." },
              { icon: Video, title: "Every session recorded", desc: "Lifetime access to all recordings. Rewatch the scripts, the role-plays, the coaching — anytime." },
            ].map((b, i) => (
              <div key={i} className="text-center p-5">
                <b.icon className="w-8 h-8 text-neuro-orange mx-auto mb-3" />
                <h3 className="font-bold text-neuro-navy text-sm mb-1">{b.title}</h3>
                <p className="text-xs text-gray-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHAT YOU LEAVE WITH ═══ */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-neuro-navy text-center mb-8">What You Leave With Sunday at 12:30</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              "Your first screening booked within 14 days",
              "Every script memorized — practiced, not just read",
              "The Screening Event Mastery Kit ($149 value)",
              "The Screening OS with 25-50 events pre-loaded in YOUR area",
              "Follow-up text sequences loaded on your phone",
              "A network of 15 doctors doing the same thing",
              "Your accountability partner for 30 days",
              "30 days of group chat access with Dr. Ray",
              "Lifetime access to all session recordings",
              "The 3-Build Philosophy burned into your brain",
              "ROI tracker and conversion benchmarks",
              "PDF workbook with all scripts and templates",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-neuro-navy">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SCREENING OS PREVIEW ═══ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-neuro-orange mb-2">Included With Your Seat</p>
            <h2 className="text-3xl font-black text-neuro-navy mb-2">The Screening OS</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Your live operating system for screening events. Track everything. Grow everything. Access it from your phone like an app.</p>
          </div>

          {/* Mock App Frame */}
          <div className="bg-neuro-navy rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {/* Tab Bar */}
            <div className="flex border-b border-white/10">
              {[
                { label: "Events", active: true },
                { label: "Network", active: false },
                { label: "Vendors", active: false },
                { label: "Outreach", active: false },
              ].map((tab) => (
                <div
                  key={tab.label}
                  className={`flex-1 text-center py-3 text-sm font-bold transition-colors ${
                    tab.active
                      ? "text-neuro-orange border-b-2 border-neuro-orange"
                      : "text-gray-500"
                  }`}
                >
                  {tab.label}
                </div>
              ))}
            </div>

            {/* Mock Events Tab Content */}
            <div className="p-5 md:p-8">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Total Events", value: "12", color: "text-white" },
                  { label: "Patients Booked", value: "47", color: "text-green-400" },
                  { label: "Revenue", value: "$117,500", color: "text-neuro-orange" },
                  { label: "Avg ROI", value: "38x", color: "text-blue-400" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 rounded-xl p-3 text-center">
                    <div className={`text-lg md:text-xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Mock Event Cards */}
              <div className="space-y-3">
                {[
                  { name: "Greenville Farmer's Market", date: "May 3, 2026", status: "Completed", screened: 18, booked: 11, revenue: "$27,500", statusColor: "bg-green-500" },
                  { name: "CrossFit Pelham Falls", date: "May 10, 2026", status: "Confirmed", screened: "—", booked: "—", revenue: "—", statusColor: "bg-blue-500" },
                  { name: "First Baptist Health Fair", date: "May 17, 2026", status: "Planned", screened: "—", booked: "—", revenue: "—", statusColor: "bg-yellow-500" },
                ].map((event, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
                    <div className={`w-2 h-10 rounded-full ${event.statusColor} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{event.name}</p>
                      <p className="text-gray-500 text-xs">{event.date}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-xs">
                      <div className="text-center"><div className="text-white font-bold">{event.screened}</div><div className="text-gray-600">Screened</div></div>
                      <div className="text-center"><div className="text-green-400 font-bold">{event.booked}</div><div className="text-gray-600">Booked</div></div>
                      <div className="text-center"><div className="text-neuro-orange font-bold">{event.revenue}</div><div className="text-gray-600">Revenue</div></div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white ${event.statusColor}`}>
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mock Outreach Preview */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outreach Pipeline — Pre-Loaded in Your Area</p>
                  <span className="text-xs text-neuro-orange font-bold">47 opportunities</span>
                </div>
                <div className="grid md:grid-cols-3 gap-2">
                  {[
                    { name: "Pelham Falls Farmer's Market", type: "Market", status: "To Contact" },
                    { name: "Greer Community Center", type: "Health Fair", status: "To Contact" },
                    { name: "F45 Training — Greenville", type: "Gym", status: "To Contact" },
                  ].map((opp, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3">
                      <p className="text-white text-xs font-semibold truncate">{opp.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-500">{opp.type}</span>
                        <span className="text-[10px] text-yellow-400 font-bold">{opp.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Caption */}
          <p className="text-center text-sm text-gray-400 mt-4">
            This is what YOUR dashboard looks like on Sunday. Events pre-loaded. Pipeline ready. Just start calling.
          </p>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section ref={pricingRef} className="py-20 px-6" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-neuro-orange mb-2">Investment</p>
            <h2 className="text-3xl font-black text-neuro-navy">Choose Your Level</h2>
            <p className="text-gray-500 mt-2">Both include the full weekend + Screening OS. VIP adds 90 days of personal coaching.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Intensive */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 flex flex-col">
              <h3 className="text-xl font-black text-neuro-navy mb-1">Weekend Intensive</h3>
              <p className="text-sm text-gray-500 mb-4">The full 3-day virtual experience</p>
              <div className="mb-1"><span className="text-4xl font-black text-neuro-navy">$2,997</span></div>
              <p className="text-sm text-gray-400 mb-6">or 3 payments of $1,099/mo</p>
              <div className="space-y-3 flex-1 mb-8">
                {["Full Friday-Sunday Zoom program", "Complete Screening Mastery Kit included", "Live role-play in breakout rooms", "All scripts, forms, and trackers", "Screening OS with events in your area", "Accountability partner pairing", "30-day group chat access", "Lifetime access to recordings", "PDF workbook"].map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /><span className="text-sm text-gray-700">{f}</span></div>
                ))}
              </div>
              <button onClick={() => setRegisterTier("intensive")} className="w-full py-4 bg-neuro-navy text-white font-bold rounded-xl text-base hover:bg-neuro-navy/90 transition-all active:scale-[0.98]">
                Reserve My Seat
              </button>
            </div>

            {/* VIP */}
            <div className="bg-white rounded-2xl border-2 border-neuro-orange p-8 flex flex-col relative shadow-lg ring-1 ring-neuro-orange/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-neuro-orange text-white text-xs font-black uppercase tracking-widest rounded-full">Most Popular</div>
              <h3 className="text-xl font-black text-neuro-navy mb-1">VIP + 90-Day Coaching</h3>
              <p className="text-sm text-gray-500 mb-4">Full weekend + personal coaching with Dr. Ray</p>
              <div className="mb-1"><span className="text-4xl font-black text-neuro-navy">$5,997</span></div>
              <p className="text-sm text-gray-400 mb-6">or 3 payments of $2,199/mo</p>
              <div className="space-y-3 flex-1 mb-8">
                {["Everything in Weekend Intensive", "90 days of 1-on-1 coaching with Dr. Ray", "Weekly 30-min coaching calls", "Direct text/call access for 90 days", "Screening debrief after every event", "Custom screening strategy for your market", "Priority seating at future events", "Lifetime access to recordings + updates", "VIP-only quarterly mastermind call"].map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5"><CheckCircle className="w-4 h-4 text-neuro-orange flex-shrink-0 mt-0.5" /><span className="text-sm text-gray-700">{f}</span></div>
                ))}
              </div>
              <button onClick={() => setRegisterTier("vip")} className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl text-base hover:bg-neuro-orange/90 transition-all active:scale-[0.98]">
                Reserve My VIP Seat
              </button>
            </div>
          </div>

          <div className="mt-10 bg-gray-50 rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-600"><strong className="text-neuro-navy">The math:</strong> 4 new patients from one screening at $2,500 avg = $10,000. Your investment pays for itself from <strong className="text-neuro-navy">one Saturday morning</strong>.</p>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-neuro-navy text-center mb-10">Common Questions</h2>
          <div className="space-y-3">
            {[
              { q: "I've never done a screening before. Is this for me?", a: "This is ESPECIALLY for you. You'll role-play every scenario in breakout rooms before you ever do it live. By Sunday you'll have practiced the scripts at least 3 times each." },
              { q: "How does Zoom work for role-play?", a: "Breakout rooms. We pair you up and you practice in private 2-person rooms. You rotate partners throughout the day. It's actually less intimidating than practicing in front of a big room — and just as effective." },
              { q: "What if I miss a session?", a: "Every session is recorded and available within 24 hours. But attend live if at all possible — the breakout room practice is where the transformation happens." },
              { q: "Can I bring my CA or office manager?", a: "Your ticket covers you. Team members can be added at a reduced rate — they're half the screening team, so it's highly recommended. Email us for details." },
              { q: "What's the Screening OS?", a: "A live dashboard inside NeuroChiro where you track all your screening events, network contacts, vendor relationships, and outreach pipeline. We pre-load 25-50 real events in YOUR area so you have a pipeline ready to go." },
              { q: "What's the difference between the $79 kit and the $2,997 weekend?", a: "The kit gives you the WHAT — scripts and templates. The weekend gives you the HOW — live coaching, breakout room practice, direct feedback, accountability, the Screening OS, and pre-loaded events in your area. The kit is included with the weekend." },
              { q: "Is there a payment plan?", a: "Yes. Both tiers offer 3 monthly payments. Intensive: $1,099/mo x 3. VIP: $2,199/mo x 3. First payment due at registration." },
              { q: "When is the next weekend?", a: "Dates are announced to registered attendees first. Reserve your seat to get on the priority list." },
            ].map((faq, i) => (
              <details key={i} className="group bg-white rounded-xl border border-gray-100">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-bold text-neuro-navy text-sm pr-4">{faq.q}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-20 px-6 bg-neuro-navy">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Stop guessing. Start screening.</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">In 3 days, you&apos;ll have the system, the skills, and the confidence to turn community screenings into the #1 growth engine for your practice.</p>
          <button onClick={scrollToPricing} className="px-10 py-4 bg-neuro-orange text-white font-bold rounded-xl text-lg hover:bg-neuro-orange/90 transition-all active:scale-[0.98] inline-flex items-center gap-2">
            Reserve Your Seat <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 mt-4">Limited to 15 seats. Payment plans available.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function ScreeningWeekendPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#fafbfc]" />}>
      <WeekendContent />
    </Suspense>
  );
}
