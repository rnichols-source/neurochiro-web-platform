"use client";

import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function StudentPricing() {
  const features = [
    "Browse and apply to job listings",
    "ChiroMatch (residency-style matching with top practices)",
    "Academy courses (6 courses, 28 modules)",
    "Interview Prep (100+ real questions with frameworks)",
    "Contract Lab (AI-powered contract review)",
    "Financial Planner (salary modeling, loans, budgeting)",
    "Full ChiroScore (7 categories, career readiness rating)",
    "Techniques Library (18 techniques with video)",
    "CE credit tracker + certificates",
    "Direct messaging with doctors and mentors",
    "Student profile visible to hiring practices",
  ];

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          Launch Your <span className="text-neuro-orange">Career.</span>
        </h1>
        <p className="text-gray-500 mt-3 max-w-lg mx-auto">
          Everything you need to land your first associate position. One plan. Everything included.
        </p>
      </div>

      {/* Single pricing card */}
      <div className="bg-white rounded-3xl border-2 border-neuro-orange shadow-2xl shadow-neuro-orange/10 p-10 relative overflow-hidden">
        <span className="absolute -top-0 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest rounded-b-xl">
          Student Premium
        </span>

        <div className="text-center mt-4 mb-8">
          <div className="text-6xl font-black text-neuro-navy">$12<span className="text-lg font-bold text-gray-400">/mo</span></div>
          <p className="text-sm text-neuro-orange font-bold mt-1">$120/yr billed annually. Save $24.</p>
        </div>

        <div className="space-y-3 mb-8">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-sm text-gray-700 leading-relaxed">{f}</span>
            </div>
          ))}
        </div>

        <Link
          href="/get-started?role=student"
          className="w-full py-4 bg-neuro-orange text-white font-black rounded-xl text-center text-sm uppercase tracking-wider hover:bg-neuro-orange/90 shadow-lg shadow-neuro-orange/20 transition-all flex items-center justify-center gap-2 block"
        >
          Start Your 7-Day Trial <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-center text-xs text-gray-400 mt-3">No credit card required. Cancel anytime.</p>
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-gray-500 font-bold">Graduate with a job offer, not just a degree.</p>
      </div>
    </div>
  );
}
