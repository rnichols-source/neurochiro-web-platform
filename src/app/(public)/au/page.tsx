import Link from "next/link";
import { ArrowRight, MapPin, GraduationCap, Stethoscope, Users, Globe2, Zap, CheckCircle2 } from "lucide-react";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "NeuroChiro Australia | The Home for Nervous System Chiropractors",
  description: "Join the global directory for nervous system chiropractors. Australian doctors and students — get listed, get found, get connected.",
};

const doctorFeatures = [
  "Get listed in the global directory — patients find you",
  "Job board with ChiroMatch scoring",
  "Salary Transparency Engine for your market",
  "Seminar network and CE tracker",
  "Messaging with students and colleagues",
  "Analytics on your profile views and leads",
];

const studentFeatures = [
  "Career Readiness Score and pipeline",
  "6 Academy courses built for students",
  "Job matching with ChiroMatch",
  "Interview Playbook — 100+ questions",
  "Contract Lab with AI analysis",
  "Financial Planner for your first years",
];

const auCities = [
  "Sydney", "Melbourne", "Brisbane", "Perth", "Gold Coast",
  "Adelaide", "Canberra", "Newcastle", "Hobart", "Darwin",
];

export default function AustraliaLandingPage() {
  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-20 left-40 w-80 h-80 bg-neuro-orange rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-20 w-60 h-60 bg-blue-500 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-2 mb-8">
            <Globe2 className="w-4 h-4 text-neuro-orange" />
            <span className="text-xs font-black uppercase tracking-widest text-white/60">Now in Australia</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tight leading-[1.1] mb-6">
            The Home Base for{" "}
            <span className="text-neuro-orange">Nervous System</span>{" "}
            Chiropractors
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            NeuroChiro is the global directory and platform for chiropractors who lead with the nervous system.
            We&apos;re expanding into Australia — and we want you in from day one.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=doctor&region=AU"
              className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-neuro-orange/20 text-lg"
            >
              <Stethoscope className="w-5 h-5" /> Join as a Doctor
            </Link>
            <Link
              href="/register?role=student&region=AU"
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20 inline-flex items-center justify-center gap-2 text-lg"
            >
              <GraduationCap className="w-5 h-5" /> Join as a Student
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {[
              { label: "Free to list" },
              { label: "200+ doctors worldwide" },
              { label: "100% verified network" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-neuro-orange" />
                <span className="text-sm font-bold">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Australia */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-3">Why Now</p>
          <h2 className="text-3xl md:text-4xl font-heading font-black text-neuro-navy mb-6">
            Australia&apos;s nervous system chiropractors deserve their own platform.
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            There&apos;s no global directory that filters for your approach. No job board that matches on philosophy.
            No community built around how you actually practise. Until now.
          </p>
        </div>
      </section>

      {/* Two Columns: Doctors + Students */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Doctor Card */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 flex flex-col">
            <div className="w-12 h-12 bg-neuro-orange/10 rounded-xl flex items-center justify-center mb-4">
              <Stethoscope className="w-6 h-6 text-neuro-orange" />
            </div>
            <h3 className="text-2xl font-heading font-black text-neuro-navy mb-2">For Doctors</h3>
            <p className="text-gray-500 text-sm mb-6">List your practice. Get found by patients in Australia and globally.</p>

            <div className="space-y-3 mb-8 flex-1">
              {doctorFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-neuro-orange mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-700">{f}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-6 mb-6">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black text-neuro-navy">Free</span>
                <span className="text-gray-400 text-sm">to list</span>
              </div>
              <p className="text-xs text-gray-400">Upgrade anytime for premium tools and analytics.</p>
            </div>

            <Link
              href="/register?role=doctor&region=AU"
              className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl text-center hover:bg-neuro-orange/90 transition-colors inline-flex items-center justify-center gap-2"
            >
              Get Listed <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Student Card */}
          <div className="bg-white rounded-2xl border-2 border-neuro-orange shadow-lg shadow-neuro-orange/10 p-8 flex flex-col relative">
            <div className="absolute -top-3 left-6 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Popular
            </div>
            <div className="w-12 h-12 bg-neuro-orange/10 rounded-xl flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6 text-neuro-orange" />
            </div>
            <h3 className="text-2xl font-heading font-black text-neuro-navy mb-2">For Students</h3>
            <p className="text-gray-500 text-sm mb-6">Everything you need to launch your career in chiropractic.</p>

            <div className="space-y-3 mb-8 flex-1">
              {studentFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-neuro-orange mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-700">{f}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-6 mb-6">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black text-neuro-navy">Free</span>
                <span className="text-gray-400 text-sm">to join</span>
              </div>
              <p className="text-xs text-gray-400">Upgrade anytime for full access to premium tools.</p>
            </div>

            <Link
              href="/register?role=student&region=AU"
              className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl text-center hover:bg-neuro-orange/90 transition-colors inline-flex items-center justify-center gap-2"
            >
              Join Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Australian Cities */}
      <section className="bg-neuro-navy py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-3">Coming Soon to</p>
          <h2 className="text-2xl md:text-3xl font-heading font-black text-white mb-8">
            Every City in Australia
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {auCities.map((city) => (
              <div key={city} className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-full px-5 py-2.5">
                <MapPin className="w-3.5 h-3.5 text-neuro-orange" />
                <span className="text-sm font-bold text-white/80">{city}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm mt-8">
            Be the first chiropractor listed in your city. Early listings get priority placement.
          </p>
        </div>
      </section>

      {/* Social Proof / Quote */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-neuro-orange/10 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-neuro-orange" />
          </div>
          <blockquote className="text-2xl md:text-3xl font-heading font-black text-neuro-navy leading-snug mb-6">
            &ldquo;The chiropractors doing the best work had no platform that represented them. So we built one.&rdquo;
          </blockquote>
          <p className="text-neuro-orange font-bold">Dr. Raymond Nichols</p>
          <p className="text-gray-400 text-sm">Founder, NeuroChiro</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-neuro-navy py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-heading font-black text-white mb-4">
            Ready to join?
          </h2>
          <p className="text-gray-400 mb-8">
            Free for doctors and students. Takes 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=doctor&region=AU"
              className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors inline-flex items-center justify-center gap-2"
            >
              I&apos;m a Doctor <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/register?role=student&region=AU"
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20 inline-flex items-center justify-center gap-2"
            >
              I&apos;m a Student <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
