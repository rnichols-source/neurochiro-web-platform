"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, Users, Globe, Zap, ShieldCheck, BarChart3 } from "lucide-react";

const benefits = [
  {
    icon: Globe,
    title: "Global Visibility",
    desc: "Patients searching for nervous system care find you first.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Practice",
    desc: "Members report an average of 3+ new patients per month from the directory.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Credibility",
    desc: "A verified badge that tells patients you are the real deal.",
  },
  {
    icon: Users,
    title: "Referral Network",
    desc: "Send and receive patient referrals from doctors in the network.",
  },
  {
    icon: BarChart3,
    title: "ROI Dashboard",
    desc: "Track profile views, leads, and referrals with real analytics.",
  },
  {
    icon: Zap,
    title: "All-In-One Platform",
    desc: "Job postings, seminars, student recruiting, and messaging built in.",
  },
];

export default function DoctorValueProp() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-3">
            Built for Practitioners
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-black text-neuro-navy mb-4">
            Why Doctors Choose NeuroChiro
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Stop competing with generalists. Get listed where patients are specifically searching for nervous system chiropractic care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-neuro-orange/10 flex items-center justify-center mb-4">
                <b.icon className="w-5 h-5 text-neuro-orange" />
              </div>
              <h3 className="font-bold text-neuro-navy mb-1">{b.title}</h3>
              <p className="text-gray-500 text-sm">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/why-neurochiro"
            className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-navy text-white font-bold rounded-xl hover:bg-neuro-navy/90 transition-colors"
          >
            See Why Doctors Join <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
