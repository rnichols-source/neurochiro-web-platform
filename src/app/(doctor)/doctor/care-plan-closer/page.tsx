"use client";

import { Calendar, FileText, DollarSign, ArrowRight, Shield, Zap, Clock, Phone } from "lucide-react";
import PageHeader from "@/components/portal/PageHeader";

const BENEFITS = [
  {
    icon: FileText,
    title: "Custom care plans built for your practice",
    description: "Dr. Ray builds your specific care plans, pricing tiers, and recommended visit schedules based on how you practice. Not templates. Your plans.",
  },
  {
    icon: DollarSign,
    title: "Pricing and scripts done for you",
    description: "Your fee schedules, payment options, and patient presentation scripts are built during the calls. You walk away ready to present care plans confidently.",
  },
  {
    icon: Shield,
    title: "Use it with patients immediately",
    description: "After the two setup calls, your Care Plan Closer is live. Pull it up during a report of findings and walk patients through their plan on screen.",
  },
  {
    icon: Clock,
    title: "Edits anytime",
    description: "Need to add a service, change pricing, or adjust visit frequency? Just let us know and we'll update it. Your practice evolves, your care plans evolve with it.",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Book your setup calls", description: "Two 45-minute calls with Dr. Ray to build your care plans." },
  { step: "2", title: "We build everything", description: "Your care plans, pricing, scripts, and presentation flow are built during the calls." },
  { step: "3", title: "Start using it", description: "Pull it up during report of findings. Walk patients through their plan on screen." },
];

const BOOKING_URL = "https://calendly.com/neurochiro/care-plan-closer";

export default function CarePlanCloserPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="Care Plan Closer"
        description="Stop winging your report of findings. We build your care plans, pricing, and presentation scripts so you close more cases with confidence."
      />

      <div className="bg-portal-accent-50 border border-portal-border rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-portal-accent text-sm font-bold mb-2">Done for you</p>
            <h2 className="text-xl font-bold text-portal-ink mb-2">Dr. Ray builds your care plans</h2>
            <p className="text-portal-ink-2 text-sm leading-relaxed">
              Two 45-minute calls. Your specific plans, pricing, and scripts. Built and ready to use with patients.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-portal-accent" />
                <span className="text-sm text-portal-ink-2">2 x 45-min calls</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-portal-accent" />
                <span className="text-sm text-portal-ink-2">Ready same week</span>
              </div>
            </div>
          </div>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 px-8 py-4 bg-portal-accent text-white font-bold rounded-xl text-sm hover:bg-portal-accent/90 transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            <Calendar className="w-4 h-4" />
            Book setup calls
          </a>
        </div>
      </div>

      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6">
        <h3 className="text-sm font-bold text-white mb-5">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="p-4 rounded-xl bg-white/[0.03]">
              <div className="w-8 h-8 rounded-lg bg-neuro-orange/20 flex items-center justify-center text-neuro-orange font-bold text-sm mb-3">
                {item.step}
              </div>
              <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
              <p className="text-sm text-white/80 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-portal-ink mb-4">What you get</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-xl border border-white/[0.08] p-5">
              <benefit.icon className="w-5 h-5 text-neuro-orange mb-3" />
              <p className="text-sm font-semibold text-white mb-1">{benefit.title}</p>
              <p className="text-sm text-white/80 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-portal-accent-50 border border-portal-border rounded-2xl p-6 text-center">
        <p className="text-portal-ink font-bold text-base mb-2">Ready to close more care plans?</p>
        <p className="text-portal-ink-2 text-sm mb-4">Setup fee plus a small monthly fee for ongoing access and edits.</p>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-11 inline-flex items-center gap-2 px-8 py-3 bg-portal-accent text-white font-bold rounded-xl text-sm hover:bg-portal-accent/90 transition-all"
        >
          Book your setup calls <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
