"use client";

import { CheckCircle2, Calendar, FileText, DollarSign, ArrowRight, Shield, Zap, Clock, Phone } from "lucide-react";
import Link from "next/link";

const BENEFITS = [
  {
    icon: FileText,
    title: "Custom Care Plans Built for Your Practice",
    description: "Dr. Ray builds your specific care plans, pricing tiers, and recommended visit schedules based on how you practice. Not templates. Your plans.",
  },
  {
    icon: DollarSign,
    title: "Pricing and Scripts Done for You",
    description: "Your fee schedules, payment options, and patient presentation scripts are built during the calls. You walk away ready to present care plans confidently.",
  },
  {
    icon: Shield,
    title: "Use It with Patients Immediately",
    description: "After the two setup calls, your Care Plan Closer is live. Pull it up during a report of findings and walk patients through their plan on screen.",
  },
  {
    icon: Clock,
    title: "Edits Anytime",
    description: "Need to add a service, change pricing, or adjust visit frequency? Just let us know and we'll update it. Your practice evolves, your care plans evolve with it.",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Book Your Setup Calls", description: "Two 45-minute calls with Dr. Ray to build your care plans." },
  { step: "2", title: "We Build Everything", description: "Your care plans, pricing, scripts, and presentation flow are built during the calls." },
  { step: "3", title: "Start Using It", description: "Pull it up during report of findings. Walk patients through their plan on screen." },
];

export default function CarePlanCloserPage() {
  // Placeholder — replace with actual Calendly or checkout link
  const BOOKING_URL = "https://calendly.com/neurochiro/care-plan-closer";

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-neuro-orange font-semibold mb-1">Add-On</p>
        <h1 className="text-2xl font-bold text-white">Care Plan Closer</h1>
        <p className="text-white/40 text-sm mt-2 leading-relaxed max-w-xl">
          Stop winging your report of findings. We build your care plans, pricing, and presentation scripts so you close more cases with confidence.
        </p>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-neuro-orange/15 to-neuro-orange/5 border border-neuro-orange/30 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-2">Done for You</p>
            <h2 className="text-xl font-bold text-white mb-2">Dr. Ray Builds Your Care Plans</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Two 45-minute calls. Your specific plans, pricing, and scripts. Built and ready to use with patients.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-neuro-orange" />
                <span className="text-sm text-white/60">2 x 45-min calls</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-neuro-orange" />
                <span className="text-sm text-white/60">Ready same week</span>
              </div>
            </div>
          </div>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-neuro-orange text-white font-black rounded-xl text-sm uppercase tracking-wider shadow-lg shadow-neuro-orange/20 hover:bg-neuro-orange/90 transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            <Calendar className="w-4 h-4" />
            Book Setup Calls
          </a>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6">
        <h3 className="text-sm font-bold text-white mb-5">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="p-4 rounded-xl bg-white/[0.03]">
              <div className="w-8 h-8 rounded-lg bg-neuro-orange/20 flex items-center justify-center text-neuro-orange font-black text-sm mb-3">
                {item.step}
              </div>
              <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
              <p className="text-[12px] text-white/40 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div>
        <h3 className="text-sm font-bold text-white mb-4">What You Get</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BENEFITS.map((benefit, i) => (
            <div key={i} className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-xl border border-white/[0.08] p-5">
              <benefit.icon className="w-5 h-5 text-neuro-orange mb-3" />
              <p className="text-sm font-semibold text-white mb-1">{benefit.title}</p>
              <p className="text-[12px] text-white/40 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-neuro-orange/10 border border-neuro-orange/20 rounded-2xl p-6 text-center">
        <p className="text-white font-bold text-base mb-2">Ready to close more care plans?</p>
        <p className="text-white/40 text-sm mb-4">Setup fee + small monthly for ongoing access and edits.</p>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm hover:bg-neuro-orange/90 transition-all shadow-lg shadow-neuro-orange/20"
        >
          Book Your Setup Calls <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
