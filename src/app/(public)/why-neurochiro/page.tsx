import Link from "next/link";
import {
  ArrowRight,
  Globe,
  TrendingUp,
  Users,
  ShieldCheck,
  BarChart3,
  Zap,
  MessageSquare,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Quote,
} from "lucide-react";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "Why NeuroChiro? | For Doctors",
  description:
    "Join the global network of nervous system chiropractors. Get listed, grow your practice, and connect with patients who are specifically looking for your expertise.",
};

const benefits = [
  {
    icon: Globe,
    title: "Global Directory Listing",
    desc: "Your verified profile is visible to patients worldwide who are searching specifically for nervous system chiropractic care. No more competing with generalists on Google.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Patient Base",
    desc: "Patients who find you through NeuroChiro are already searching for nervous system care. They understand your approach before they walk through the door.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Badge",
    desc: "Stand out with a verified clinician badge. Every profile is reviewed by our team before it goes live in the directory.",
  },
  {
    icon: Users,
    title: "Doctor-to-Doctor Referrals",
    desc: "Send and receive patient referrals from other nervous system specialists. When a patient relocates, their care continues seamlessly.",
  },
  {
    icon: BarChart3,
    title: "ROI Analytics Dashboard",
    desc: "Track your profile views, appointment requests, and referrals. See exactly how NeuroChiro is growing your practice.",
  },
  {
    icon: GraduationCap,
    title: "Recruit Students",
    desc: "Post job listings and connect with chiropractic students who want to specialize in nervous system care. Find your next associate.",
  },
  {
    icon: Calendar,
    title: "Host Seminars",
    desc: "List your seminars and workshops on the platform. Reach an audience of doctors and students who are hungry to learn.",
  },
  {
    icon: MessageSquare,
    title: "Direct Messaging",
    desc: "Communicate securely with other doctors, students, and patients through the built-in messaging system.",
  },
];

const doctorTestimonials = [
  {
    quote: "Patients who find me through NeuroChiro already understand what nervous system chiropractic is. I don't have to convince them — they came looking for me.",
    name: "Network Doctor",
    location: "United States",
  },
  {
    quote: "I was tired of being lumped in with every general chiropractor on Google. NeuroChiro puts me in front of the right patients.",
    name: "Network Doctor",
    location: "Australia",
  },
  {
    quote: "The referral network is what sold me. When a patient moves, I can send them to another nervous system specialist in the network.",
    name: "Network Doctor",
    location: "Canada",
  },
];

export default function WhyNeuroChiroPage() {
  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-60 h-60 bg-neuro-orange rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-4">
            For Doctors
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight leading-tight mb-6 text-white">
            Stop Competing with <br />
            <span className="text-neuro-orange">Generalists.</span>
          </h1>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            You specialize in the nervous system. Your patients should be able to find you.
            NeuroChiro is the only directory built specifically for practitioners like you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=doctor"
              className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors inline-flex items-center justify-center gap-2"
            >
              Join the Network <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing/doctors"
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-black text-neuro-navy mb-6">
            The Problem You Know Too Well
          </h2>
          <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
            <p>
              You&apos;ve spent years mastering nervous system chiropractic. But when patients search for you online, they find generic chiropractic directories that don&apos;t distinguish what makes you different.
            </p>
            <p>
              Your ideal patients &mdash; the ones who specifically want nervous system care &mdash; can&apos;t find you. They end up at a generalist down the street, or worse, they give up looking entirely.
            </p>
            <p className="font-bold text-neuro-navy">
              NeuroChiro changes that.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 px-6 bg-neuro-cream">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-3">
              Everything You Need
            </p>
            <h2 className="text-3xl font-heading font-black text-neuro-navy">
              One Membership. Full Access.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all"
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-neuro-orange/10 flex items-center justify-center flex-shrink-0">
                    <b.icon className="w-6 h-6 text-neuro-orange" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neuro-navy text-lg mb-2">{b.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-neuro-navy">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-3">
              From Our Network
            </p>
            <h2 className="text-3xl font-heading font-black text-white">
              Hear from Doctors Like You
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {doctorTestimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
              >
                <Quote className="w-6 h-6 text-neuro-orange/40 mb-4" />
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-bold text-white">{t.name}</p>
                  <p className="text-gray-400 text-sm">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-heading font-black text-neuro-navy mb-12">
            Get Started in 3 Minutes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create Your Account", desc: "Sign up and choose your membership plan." },
              { step: "2", title: "Complete Your Profile", desc: "Add your bio, specialties, photos, and clinic details. Our AI can help write your bio." },
              { step: "3", title: "Go Live", desc: "Your verified listing goes live in the global directory. Patients start finding you." },
            ].map((item) => (
              <div key={item.step}>
                <div className="w-12 h-12 rounded-xl bg-neuro-orange/10 text-neuro-orange font-black text-lg flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-neuro-navy mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-neuro-cream">
        <div className="max-w-2xl mx-auto text-center">
          <Zap className="w-10 h-10 text-neuro-orange mx-auto mb-4" />
          <h2 className="text-3xl font-heading font-black text-neuro-navy mb-4">
            Ready to Grow Your Practice?
          </h2>
          <p className="text-gray-500 mb-8">
            Join the growing network of nervous system specialists. Your patients are already looking for you.
          </p>
          <Link
            href="/register?role=doctor"
            className="inline-flex items-center gap-2 px-10 py-5 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors shadow-xl shadow-neuro-orange/20"
          >
            Join NeuroChiro Today <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
