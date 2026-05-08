"use client";

import { useEffect, useState } from "react";
import { Shuffle, ArrowRight, Users, List, Calendar, CheckCircle2, GraduationCap, Briefcase, Target } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/landing/Footer";

export default function ChiroMatchPublicPage() {
  const [nextCycle, setNextCycle] = useState<any>(null);

  useEffect(() => {
    fetch("/api/chiromatch-cycle")
      .then(r => r.json())
      .then(d => { if (d.cycle) setNextCycle(d.cycle); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-80 h-80 bg-neuro-orange rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neuro-orange/10 border border-neuro-orange/20 rounded-full mb-6">
            <Shuffle className="w-4 h-4 text-neuro-orange" />
            <span className="text-neuro-orange text-xs font-bold uppercase tracking-widest">The Future of Chiropractic Hiring</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-heading font-black text-white mb-6 leading-tight">
            ChiroMatch
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10">
            The first residency-style matching system for chiropractic. Students rank practices. Practices rank candidates. Our algorithm finds the perfect match.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=student" className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors inline-flex items-center gap-2">
              Join as Student <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/register?role=doctor" className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-colors inline-flex items-center gap-2">
              Join as Doctor <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Countdown */}
          {nextCycle && (
            <div className="mt-12 inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full">
              <Calendar className="w-4 h-4 text-neuro-orange" />
              <span className="text-sm text-gray-300">
                <strong className="text-white">{nextCycle.name}</strong> — Match Day {new Date(nextCycle.match_day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-neuro-orange font-black uppercase tracking-[0.3em] text-[10px] mb-3">How It Works</p>
          <h2 className="text-3xl font-heading font-black text-neuro-navy">Three Steps to Your Perfect Match</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center relative">
            <div className="w-10 h-10 bg-neuro-orange text-white font-black rounded-full flex items-center justify-center mx-auto mb-4 text-lg">1</div>
            <h3 className="text-xl font-heading font-black text-neuro-navy mb-3">Rank Your Preferences</h3>
            <p className="text-gray-500 text-sm">Students rank their top 10 practices. Doctors rank their top candidates. Rankings are confidential.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-10 h-10 bg-neuro-orange text-white font-black rounded-full flex items-center justify-center mx-auto mb-4 text-lg">2</div>
            <h3 className="text-xl font-heading font-black text-neuro-navy mb-3">Algorithm Matches</h3>
            <p className="text-gray-500 text-sm">Our proven Gale-Shapley algorithm finds stable matches — the same math used in medical residencies for 70 years.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-10 h-10 bg-neuro-orange text-white font-black rounded-full flex items-center justify-center mx-auto mb-4 text-lg">3</div>
            <h3 className="text-xl font-heading font-black text-neuro-navy mb-3">Match Day</h3>
            <p className="text-gray-500 text-sm">Results are released simultaneously. Both sides know instantly. No more guessing, ghosting, or negotiation games.</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-neuro-navy py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-heading font-black text-white">Why ChiroMatch?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Students */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-2 mb-6">
                <GraduationCap className="w-5 h-5 text-neuro-orange" />
                <h3 className="text-lg font-heading font-black text-white">For Students</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Browse positions from verified practices nationwide",
                  "Your ChiroScore helps practices see your strengths",
                  "Rank up to 10 practices — your preferences are confidential",
                  "No awkward salary negotiations — offers are transparent",
                  "Unmatched? The Jobs board has immediate opportunities",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* For Doctors */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-2 mb-6">
                <Briefcase className="w-5 h-5 text-neuro-orange" />
                <h3 className="text-lg font-heading font-black text-white">For Doctors</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Access the largest pool of nervous system chiropractic talent",
                  "ChiroScore gives you objective candidate data",
                  "See which students are genuinely interested in your practice",
                  "Reduce bad hires — structured matching works",
                  "Matched candidates transition directly into your hiring pipeline",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <Target className="w-10 h-10 text-neuro-orange mx-auto mb-4" />
          <h2 className="text-3xl font-heading font-black text-neuro-navy mb-4">Ready to Find Your Match?</h2>
          <p className="text-gray-500 mb-8">Join NeuroChiro to participate in the next ChiroMatch cycle. All paid members are eligible.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=student" className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">
              Student Sign Up — $12/mo
            </Link>
            <Link href="/pricing" className="px-8 py-4 bg-neuro-navy text-white font-bold rounded-xl hover:bg-neuro-navy-light transition-colors">
              Doctor Plans
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
