import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const benefits = [
  "Get your seminar listed in front of thousands of chiropractic students and doctors",
  "Dedicated event page with description, dates, location, and registration link",
  "Analytics dashboard to track page views and registration clicks",
  "Reach a global audience of nervous-system-first chiropractors",
];

export default function HostLandingPage() {
  return (
    <div className="min-h-dvh bg-[#0B1118] text-white pt-32 pb-40">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-8 text-center space-y-8 mb-24">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange">
          <span className="w-2 h-2 rounded-full bg-neuro-orange animate-pulse" />
          Educator Network
        </span>

        <h1 className="text-5xl font-heading font-black tracking-tight leading-tight">
          Host a Seminar
        </h1>

        <p className="text-gray-400 text-xl leading-relaxed max-w-2xl mx-auto">
          Share your clinical expertise with the NeuroChiro community. List your
          seminar on the marketplace and connect with students and doctors who
          are ready to learn.
        </p>
      </section>

      {/* Benefits */}
      <section className="max-w-3xl mx-auto px-8 mb-24">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 space-y-6">
          <h2 className="text-2xl font-heading font-black mb-6">
            What You Get
          </h2>
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 text-neuro-orange mt-0.5 shrink-0" />
              <p className="text-gray-300 font-medium">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-8 text-center">
        <Link
          href="/register?role=doctor"
          className="inline-flex items-center gap-3 px-12 py-6 bg-neuro-orange text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-neuro-orange-light transition-all shadow-2xl shadow-neuro-orange/30"
        >
          Create Your Seminar
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/doctor/seminars"
            className="text-neuro-orange hover:underline"
          >
            Manage your seminars
          </Link>
        </p>
      </section>
    </div>
  );
}
