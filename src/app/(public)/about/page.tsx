"use client";

import { motion } from "framer-motion";
import { Users, Heart, Target, Sparkles, ShieldCheck, Globe } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/landing/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-neuro-cream">
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Founder Story */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] block mb-4">Our Story</span>
            <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy mb-8">
              Built by a Chiropractor,<br /><span className="text-neuro-orange">for Chiropractors.</span>
            </h1>
          </motion.div>

          <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-12 shadow-sm mb-16">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                <img src="/raymond-nichols.jpg" alt="Raymond Nichols, Founder of NeuroChiro" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-neuro-navy mb-1">Raymond Nichols</h2>
                <p className="text-neuro-orange font-bold text-sm mb-4">Founder, NeuroChiro &middot; Chiropractor &middot; Practice Owner</p>
                <div className="text-gray-600 space-y-4 leading-relaxed">
                  <p>
                    I started NeuroChiro because I saw a gap in the chiropractic world. Doctors who specialize in the nervous system have a fundamentally different approach to care &mdash; but patients have no way to find them. They search Google and end up with generalists, or worse, they give up.
                  </p>
                  <p>
                    Meanwhile, the doctors themselves are invisible. They&apos;re doing incredible work but competing with every chiropractor on the block for the same generic search results. That&apos;s not right.
                  </p>
                  <p>
                    NeuroChiro is the fix. A dedicated directory where nervous system specialists can be found by the patients who need them most. No noise, no generalists &mdash; just the best practitioners in the world, verified and visible.
                  </p>
                  <p>
                    We&apos;re a small team building something we believe in. If you have questions, feedback, or just want to talk, I&apos;m reachable at{" "}
                    <a href="mailto:support@neurochirodirectory.com" className="text-neuro-orange font-bold hover:underline">support@neurochirodirectory.com</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {[
              { icon: Users, title: "Community First", desc: "We exist to serve the nervous system chiropractic community \u2014 doctors, students, and patients." },
              { icon: Heart, title: "Patient Safety", desc: "Every doctor on the platform is reviewed before their profile goes live. We take verification seriously." },
              { icon: Target, title: "Clinical Focus", desc: "We only list doctors who specialize in nervous system chiropractic. No generalists, no dilution." },
              { icon: ShieldCheck, title: "Transparency", desc: "We\u2019re upfront about what we are, who we are, and how we operate. No hidden agendas." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm"
              >
                <div className="w-12 h-12 bg-neuro-orange/10 rounded-2xl flex items-center justify-center text-neuro-orange mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-neuro-navy mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* How We Verify */}
          <div className="bg-neuro-navy rounded-2xl p-8 md:p-12 text-white mb-16">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-6 h-6 text-neuro-orange" />
              <h2 className="text-2xl font-black">How We Verify Doctors</h2>
            </div>
            <p className="text-gray-400 mb-8">
              The &ldquo;Verified Clinician&rdquo; badge on NeuroChiro is not automatic. Here&apos;s what it means:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Application Review", desc: "Every doctor submits their credentials, license information, and practice details when they join." },
                { step: "2", title: "Manual Verification", desc: "Our team reviews each application. We confirm the practice exists and the doctor is who they say they are." },
                { step: "3", title: "Ongoing Monitoring", desc: "Profiles are subject to patient feedback and periodic review. We remove doctors who don\u2019t meet our standards." },
              ].map((item) => (
                <div key={item.step} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-neuro-orange/20 text-neuro-orange font-black flex items-center justify-center mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-bold mb-2 text-white">{item.title}</h3>
                  <p className="text-gray-300 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-gray-500 mb-4">Have questions? We&apos;d love to hear from you.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
