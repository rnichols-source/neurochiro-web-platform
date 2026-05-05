"use client";

import { useState } from "react";
import { Check, ArrowRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import LeadCaptureInline from "@/components/leads/LeadCaptureInline";

export default function StudentPricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const price = billingCycle === "monthly" ? "12" : "10";
  const annualTotal = "$120/yr";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          Launch Your <span className="text-neuro-orange">Career.</span>
        </h1>
        <p className="text-gray-500 mt-4 text-lg max-w-lg mx-auto">
          One plan. Everything included. $12/mo.
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
          Annual <span className="text-green-500 text-xs font-black">(Save 17%)</span>
        </span>
      </div>

      {/* Single pricing card */}
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border-2 border-neuro-orange p-8 shadow-xl shadow-neuro-orange/10">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-neuro-orange/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-7 h-7 text-neuro-orange" />
            </div>
            <h3 className="text-xl font-black text-neuro-navy">Student Membership</h3>
            <div className="flex items-baseline justify-center gap-1 mt-2">
              <span className="text-lg text-gray-400">$</span>
              <span className="text-5xl font-black text-neuro-navy">{price}</span>
              <span className="text-gray-400 font-bold">/mo</span>
            </div>
            {billingCycle === "annual" && <p className="text-xs text-green-500 font-bold mt-1">Billed at {annualTotal}</p>}
          </div>

          <div className="space-y-3 mb-8">
            {[
              "Profile + job applications",
              "Full job board access",
              "Seminar calendar & registration",
              "Academy courses",
              "Direct messaging with doctors",
              "Interview Prep — 20 real questions with scripts",
              "Contract Lab — analyze any associate agreement",
              "Financial Planner — model salary, loans, budget",
              "Techniques Library — compare 18 techniques",
              "Command Center",
              "Priority in talent drops",
              "Transition to Doctor account at graduation",
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <Link
            href="/register?role=student"
            className="w-full py-4 bg-neuro-orange text-white font-black uppercase tracking-wider text-sm rounded-xl text-center flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-all shadow-lg shadow-neuro-orange/20"
          >
            Join Now — ${price}/mo <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-center text-xs text-gray-400 mt-3">Cancel anytime. No lock-in contracts.</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h3 className="font-bold text-neuro-navy text-center mb-6">Common Questions</h3>
        <div className="space-y-4">
          {[
            { q: "What do I get for $12/month?", a: "Everything. Job board, seminars, academy, messaging, interview prep, contract lab, financial planner, technique explorer, and command center. All included in one plan." },
            { q: "What happens when I graduate?", a: "You can transition your account to a Doctor account and get listed in the directory. Your student data is preserved." },
            { q: "Can I cancel anytime?", a: "Yes. Cancel anytime from your dashboard. No lock-in contracts." },
            { q: "Is there a free trial?", a: "We offer a 30-day money-back guarantee. If it's not for you, we'll refund you — no questions asked." },
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
