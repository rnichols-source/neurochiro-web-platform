"use client";

import { useState } from "react";
import { Check, X, ArrowRight, GraduationCap, Crown } from "lucide-react";
import Link from "next/link";
import LeadCaptureInline from "@/components/leads/LeadCaptureInline";

export default function StudentPricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const proPrice = billingCycle === "monthly" ? "29" : "25";
  const proAnnualTotal = "$300/yr";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          Launch Your <span className="text-neuro-orange">Career.</span>
        </h1>
        <p className="text-gray-500 mt-4 text-lg max-w-lg mx-auto">
          Join free. Access the job board, seminars, and academy. Upgrade to Pro for advanced career tools.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-neuro-navy' : 'text-gray-400'}`}>Monthly</span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
          className="relative w-14 h-7 bg-neuro-navy rounded-full transition-colors"
        >
          <div className={`absolute top-0.5 w-6 h-6 bg-neuro-orange rounded-full transition-all ${billingCycle === 'annual' ? 'left-7' : 'left-0.5'}`} />
        </button>
        <span className={`text-sm font-bold ${billingCycle === 'annual' ? 'text-neuro-navy' : 'text-gray-400'}`}>
          Annual <span className="text-green-500 text-xs font-black">(Save 15%)</span>
        </span>
      </div>

      {/* 2 Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FREE */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-black text-neuro-navy">Free</h3>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-black text-neuro-navy">$0</span>
            <span className="text-gray-400 font-bold">/forever</span>
          </div>
          <p className="text-sm text-gray-500 mb-8">Get started on your career</p>

          <div className="space-y-3 mb-8">
            {[
              { name: "Profile + job applications", included: true },
              { name: "Job board access", included: true },
              { name: "Seminars browsing", included: true },
              { name: "Academy (basic modules)", included: true },
              { name: "Messages", included: true },
              { name: "Interview Prep", included: false },
              { name: "Contract Lab", included: false },
              { name: "Financial Planner", included: false },
              { name: "Techniques Library", included: false },
              { name: "Priority in talent drops", included: false },
            ].map((f, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${f.included ? 'text-gray-700' : 'text-gray-300'}`}>
                {f.included ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> : <X className="w-4 h-4 text-gray-200 flex-shrink-0" />}
                {f.name}
              </div>
            ))}
          </div>

          <Link
            href="/register?role=student"
            className="w-full py-4 bg-gray-100 text-neuro-navy font-bold rounded-xl text-sm text-center flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
          >
            Join Free
          </Link>
        </div>

        {/* STUDENT PRO */}
        <div className="bg-white rounded-2xl border-2 border-neuro-orange p-8 relative shadow-xl shadow-neuro-orange/10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-neuro-orange rounded-full text-[10px] font-black text-white uppercase tracking-widest">
            Recommended
          </div>
          <div className="flex items-center gap-2 mb-4 mt-1">
            <Crown className="w-5 h-5 text-neuro-orange" />
            <h3 className="text-lg font-black text-neuro-navy">Student Pro</h3>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-lg text-gray-400">$</span>
            <span className="text-5xl font-black text-neuro-navy">{proPrice}</span>
            <span className="text-gray-400 font-bold">/mo</span>
          </div>
          {billingCycle === "annual" && <p className="text-xs text-green-500 font-bold mb-2">Billed at {proAnnualTotal}</p>}
          <p className="text-sm text-gray-500 mb-8">Everything to launch your career</p>

          <div className="space-y-3 mb-8">
            {[
              "Everything in Free",
              "Interview Prep",
              "Contract Lab",
              "Financial Planner",
              "Techniques Library",
              "Command Center",
              "Priority in talent drops",
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <Link
            href="/register?role=student&billing=pro"
            className="w-full py-4 bg-neuro-orange text-white font-black uppercase tracking-wider text-sm rounded-xl text-center flex items-center justify-center gap-2 hover:bg-neuro-orange-light transition-all shadow-lg shadow-neuro-orange/20"
          >
            <Crown className="w-4 h-4" /> Start with Student Pro
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h3 className="font-bold text-neuro-navy text-center mb-6">Common Questions</h3>
        <div className="space-y-4">
          {[
            { q: "Is the free plan really free?", a: "Yes. Your profile, job applications, academy access, and seminars browsing are free forever. No credit card required." },
            { q: "Can I start free and upgrade later?", a: "Yes. Most students start free and upgrade to Pro when they're ready for advanced career tools like Interview Prep and the Contract Lab." },
            { q: "What happens when I graduate?", a: "You can transition your account to a Doctor account and get listed in the directory. Your student data is preserved." },
            { q: "Can I cancel Pro anytime?", a: "Yes. Cancel anytime from your dashboard. Your free features stay even if you cancel Pro." },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="font-bold text-neuro-navy text-sm">{item.q}</p>
              <p className="text-gray-500 text-sm mt-2">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Capture */}
      <div className="max-w-md mx-auto mt-12">
        <LeadCaptureInline
          source="pricing_students"
          role="student"
          headline="Not ready to sign up?"
          description="Get career tips and job alerts sent to your inbox."
          buttonText="Subscribe"
          variant="card"
        />
      </div>
    </div>
  );
}
