import Link from "next/link";
import { Briefcase, Heart, ArrowRight } from "lucide-react";

export default function CareersPage() {
  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20">
      {/* Hero */}
      <section className="pt-12 pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] block border border-neuro-orange/20 px-4 py-1.5 rounded-full w-max mx-auto">
            Careers
          </span>
          <h1 className="text-5xl font-heading font-black text-neuro-navy leading-tight">
            Careers in Chiropractic
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto">
            Browse open positions at nervous system chiropractic clinics.
            Whether you are an experienced CA or exploring a new career path,
            find your next opportunity here.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-3 px-8 py-4 bg-neuro-navy text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl hover:bg-neuro-navy-light transition-all"
          >
            <Briefcase className="w-5 h-5" />
            Browse Open Positions
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CA Section */}
      <section className="py-24 px-6 bg-white border-y border-gray-100">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="w-16 h-16 bg-neuro-orange/10 rounded-2xl flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-neuro-orange" />
          </div>
          <h2 className="text-3xl font-heading font-black text-neuro-navy">
            Looking for a Career Change?
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto">
            Chiropractic clinics hire patients who understand the philosophy.
            If you believe in nervous-system-first healthcare, you may be
            the perfect fit for a Chiropractic Assistant role. Browse open
            positions to get started.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-3 px-8 py-4 bg-neuro-orange text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl hover:bg-neuro-orange-light transition-all"
          >
            View Open Positions
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
