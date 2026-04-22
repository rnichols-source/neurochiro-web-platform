"use client";

import {
  CheckCircle,
  Calendar,
  Clock,
  Monitor,
  Download,
  ArrowRight,
  Zap,
  Users,
  Target,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/landing/Footer";

export default function WelcomePage() {
  return (
    <div className="min-h-dvh bg-[#fafbfc]">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-black mb-3">
            Welcome to Screening Mastery
          </h1>
          <p className="text-gray-400 text-lg">
            You&apos;re registered for May 22-24, 2026. Here&apos;s everything you need to prepare.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Schedule Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-neuro-orange" />
            <h2 className="font-black text-neuro-navy text-lg">Your Weekend Schedule</h2>
          </div>
          <div className="space-y-3">
            {[
              { day: "Friday, May 22", time: "6:00 - 8:30 PM EST", label: "The Foundation", color: "bg-neuro-orange" },
              { day: "Saturday, May 23", time: "9:00 AM - 3:00 PM EST", label: "The System", color: "bg-neuro-navy" },
              { day: "Sunday, May 24", time: "9:00 AM - 12:30 PM EST", label: "The Launch", color: "bg-green-600" },
            ].map((s) => (
              <div key={s.day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className={`w-2 h-10 rounded-full ${s.color}`} />
                <div className="flex-1">
                  <p className="font-bold text-neuro-navy text-sm">{s.day}</p>
                  <p className="text-xs text-gray-500">{s.time}</p>
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zoom Link Card */}
        <div className="bg-neuro-navy rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="w-5 h-5 text-neuro-orange" />
            <h2 className="font-black text-lg">Zoom Link</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Your Zoom link will be sent to your email <strong className="text-white">48 hours before the event</strong> (Tuesday, May 20). Check your inbox — and your spam folder.
          </p>
          <p className="text-xs text-gray-500">
            Didn&apos;t receive it? Email support@neurochirodirectory.com
          </p>
        </div>

        {/* Prep Checklist */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-neuro-orange" />
            <h2 className="font-black text-neuro-navy text-lg">Pre-Weekend Checklist</h2>
          </div>
          <div className="space-y-3">
            {[
              { text: "Create your free NeuroChiro account (if you haven't already)", link: "/register", linkText: "Create Account" },
              { text: "Test your Zoom — make sure your camera and mic work", link: null, linkText: null },
              { text: "Block your calendar for all 3 sessions (no double-booking!)", link: null, linkText: null },
              { text: "Have a notebook or notes app ready — you'll want to write things down", link: null, linkText: null },
              { text: "Pick a date for your first screening in the next 14 days — you'll need this by Sunday", link: null, linkText: null },
              { text: "Think about 2-3 venues near you where a screening could work (farmer's market, gym, church, etc.)", link: null, linkText: null },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{item.text}</p>
                  {item.link && (
                    <Link href={item.link} className="text-xs text-neuro-orange font-bold hover:underline mt-1 inline-block">
                      {item.linkText} <ArrowRight className="w-3 h-3 inline" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What to Expect */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-neuro-orange" />
            <h2 className="font-black text-neuro-navy text-lg">What to Expect</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Users, title: "Breakout Room Practice", desc: "You'll practice scripts in pairs. It's the most valuable part — embrace it." },
              { icon: BookOpen, title: "Scripts & Templates", desc: "Every script is provided. You don't need to create anything from scratch." },
              { icon: Target, title: "You'll Book Your First Screening", desc: "By Sunday, you'll have a date, venue, and plan for your first event." },
              { icon: MessageSquare, title: "Small Group Energy", desc: "40 doctors all doing the same thing. The accountability alone is worth the investment." },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                <item.icon className="w-5 h-5 text-neuro-orange flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-neuro-navy text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="font-black text-neuro-navy text-lg mb-4">Quick Questions</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-bold text-neuro-navy">What if I miss a session?</p>
              <p className="text-gray-500 mt-1">All sessions are recorded. You&apos;ll get access within 24 hours. But attend live if at all possible — the breakout rooms are where the transformation happens.</p>
            </div>
            <div>
              <p className="font-bold text-neuro-navy">Do I need to bring anything?</p>
              <p className="text-gray-500 mt-1">Just yourself, a laptop or tablet (for Zoom), and something to take notes with. All materials are provided.</p>
            </div>
            <div>
              <p className="font-bold text-neuro-navy">Can I bring my CA or team member?</p>
              <p className="text-gray-500 mt-1">Your ticket covers you. Team add-ons are available at a reduced rate — email support@neurochirodirectory.com.</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm mb-2">Questions before the weekend?</p>
          <p className="text-neuro-navy font-bold">Email support@neurochirodirectory.com</p>
          <p className="text-xs text-gray-400 mt-4">See you May 22!</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
