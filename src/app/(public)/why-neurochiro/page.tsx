import Link from "next/link";
import {
  ArrowRight, Check, X, ShieldCheck, BarChart3, Users, Briefcase,
  Award, DollarSign, Shuffle, Star, MapPin, Calendar, TrendingUp,
  MessageSquare, Zap, Eye, Heart,
} from "lucide-react";
import Footer from "@/components/landing/Footer";

const comparison = [
  { feature: "Directory listing", neurochiro: true, others: true },
  { feature: "Nervous system focused audience", neurochiro: true, others: false },
  { feature: "AI practice insights & weekly reports", neurochiro: true, others: false },
  { feature: "Patient lead pipeline (CRM)", neurochiro: true, others: false },
  { feature: "Salary transparency data", neurochiro: true, others: false },
  { feature: "CE credit tracking + certificates", neurochiro: true, others: false },
  { feature: "Residency-style matching (ChiroMatch)", neurochiro: true, others: false },
  { feature: "Full ATS hiring system", neurochiro: true, others: false },
  { feature: "Seminar platform with reviews", neurochiro: true, others: false },
  { feature: "Vendor marketplace", neurochiro: true, others: false },
  { feature: "Instagram promotion", neurochiro: true, others: false },
  { feature: "Spotlight interviews", neurochiro: true, others: false },
  { feature: "Doctor-to-doctor referral network", neurochiro: true, others: false },
  { feature: "Practice management tools", neurochiro: true, others: false },
  { feature: "Competitive ranking in your city", neurochiro: true, others: false },
];

const features = [
  { icon: Eye, title: "Get Found by Patients", desc: "Patients searching for nervous system care find YOU — not generalists competing for the same keywords." },
  { icon: BarChart3, title: "AI Practice Intelligence", desc: "Weekly AI insights, competitive ranking, revenue intelligence, and smart action items — your practice consultant that never sleeps." },
  { icon: Users, title: "Patient Lead Pipeline", desc: "Track every lead from first contact to converted patient. Notes, stages, conversion rates — a CRM built for chiropractors." },
  { icon: Shuffle, title: "ChiroMatch", desc: "The first residency-style matching system for chiropractic. Students rank practices. Practices rank candidates. Algorithm matches." },
  { icon: DollarSign, title: "Salary Transparency", desc: "Real compensation data by state, role, and specialty. Know what the market pays before you make an offer." },
  { icon: Award, title: "CE Credit Tracking", desc: "QR check-in at seminars. Verified certificates generated instantly. All hours tracked in one dashboard." },
  { icon: Briefcase, title: "Full Hiring System", desc: "7-stage ATS pipeline, ChiroScore candidate ratings, interview prep, offer letters, email templates." },
  { icon: Star, title: "Seminar Reviews", desc: "Verified attendee reviews on every seminar. The Yelp for chiropractic education." },
  { icon: Calendar, title: "Instagram Promotion", desc: "Growth members get monthly Instagram features. Pro members get weekly promotion + Spotlight interviews." },
  { icon: Heart, title: "Vendor Marketplace", desc: "Trusted products with exclusive member discounts. Reviews, product showcases, and direct contact." },
];

export default function WhyNeuroChiroPage() {
  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-4">Why NeuroChiro</p>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-6 leading-tight">
            Other Directories List You.<br />
            <span className="text-neuro-orange">NeuroChiro Grows Your Practice.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            NeuroChiro isn&apos;t a directory. It&apos;s the operating system for nervous system chiropractors — AI insights, hiring tools, CE tracking, salary data, and a marketplace all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/get-started" className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors inline-flex items-center gap-2">
              Get Listed Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/pricing" className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
              View Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="bg-neuro-navy-dark border-t border-white/5">
        <div className="max-w-3xl mx-auto flex justify-center divide-x divide-white/10">
          {[
            { number: "140+", label: "Verified Doctors" },
            { number: "30+", label: "States" },
            { number: "4", label: "Countries" },
            { number: "Free", label: "To Join" },
          ].map((stat) => (
            <div key={stat.label} className="flex-1 text-center py-5">
              <div className="text-2xl font-black text-neuro-orange">{stat.number}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-heading font-black text-neuro-navy mb-3">NeuroChiro vs Everyone Else</h2>
          <p className="text-gray-500">See what you get that no other platform offers.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 gap-0 border-b border-gray-100">
            <div className="p-4 font-bold text-neuro-navy text-sm">Feature</div>
            <div className="p-4 text-center font-bold text-neuro-orange text-sm bg-neuro-orange/5">NeuroChiro</div>
            <div className="p-4 text-center font-bold text-gray-400 text-sm">Other Directories</div>
          </div>
          {/* Rows */}
          {comparison.map((row, i) => (
            <div key={i} className="grid grid-cols-3 gap-0 border-b border-gray-50 last:border-0">
              <div className="p-3 text-sm text-gray-600">{row.feature}</div>
              <div className="p-3 text-center bg-neuro-orange/5">
                <Check className="w-5 h-5 text-green-500 mx-auto" />
              </div>
              <div className="p-3 text-center">
                {row.others ? (
                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                ) : (
                  <X className="w-5 h-5 text-gray-300 mx-auto" />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-neuro-navy py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-black text-white mb-3">Everything You Need. One Platform.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <f.icon className="w-6 h-6 text-neuro-orange mb-3" />
                <h3 className="font-bold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotion */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-heading font-black text-neuro-navy mb-3">We Promote You</h2>
          <p className="text-gray-500">Every member gets visibility. Paid members get even more.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-sm font-bold text-neuro-orange mb-1">Free</p>
            <p className="text-lg font-black text-neuro-navy mb-2">Instagram Highlights</p>
            <p className="text-xs text-gray-500">Your practice featured in our Instagram highlights for followers to discover.</p>
          </div>
          <div className="bg-white rounded-2xl border-2 border-neuro-orange p-6 text-center">
            <p className="text-sm font-bold text-neuro-orange mb-1">Growth</p>
            <p className="text-lg font-black text-neuro-navy mb-2">Monthly Instagram Feature</p>
            <p className="text-xs text-gray-500">1 dedicated post + story per month featuring your practice to our entire audience.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-sm font-bold text-neuro-orange mb-1">Pro</p>
            <p className="text-lg font-black text-neuro-navy mb-2">Spotlight Interview</p>
            <p className="text-xs text-gray-500">We interview you on camera. Featured on our channels + weekly Instagram promotion.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neuro-navy py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-heading font-black text-white mb-4">Ready to Get Found?</h2>
          <p className="text-gray-400 mb-8">Join 140+ nervous system chiropractors. Free to start. No credit card required.</p>
          <Link href="/get-started" className="px-10 py-5 bg-neuro-orange text-white font-bold rounded-xl text-lg inline-flex items-center gap-2 hover:bg-neuro-orange/90 transition-colors shadow-lg shadow-neuro-orange/20">
            Get Listed Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
