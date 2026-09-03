"use client";

import { Megaphone, Star, Users, Calendar, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

// Dr. Ray adds announcements here — newest first
const ANNOUNCEMENTS: { date: string; title: string; body: string; link?: string; linkText?: string; type: "announcement" | "spotlight" | "event" }[] = [
  {
    date: "2026-08-11",
    title: "Welcome to the NeuroChiro Community",
    body: "This is your hub for announcements, member spotlights, and network updates. Every week I'll post here with what's new, who's getting featured, and what's coming next. Stay tuned.",
    type: "announcement",
  },
];

const TYPE_CONFIG = {
  announcement: { icon: Megaphone, color: "text-neuro-orange", bg: "bg-neuro-orange/10", label: "Announcement" },
  spotlight: { icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Member Spotlight" },
  event: { icon: Calendar, color: "text-blue-400", bg: "bg-blue-400/10", label: "Event" },
};

export default function CommunityPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-neuro-orange font-semibold mb-1">Community</p>
        <h1 className="text-2xl font-bold text-white">Network Feed</h1>
        <p className="text-white/40 text-sm mt-1">Announcements, member spotlights, and updates from Dr. Ray.</p>
      </div>

      {/* Network Stats */}
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-5">
        <div className="flex items-center gap-3 mb-3">
          <Users className="w-5 h-5 text-neuro-orange" />
          <h3 className="text-sm font-bold text-white">The Network</h3>
        </div>
        <p className="text-white/40 text-sm leading-relaxed">
          You're part of the only network built exclusively for nervous system chiropractors. Every member gets personally onboarded, promoted weekly, and supported by Dr. Ray.
        </p>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {ANNOUNCEMENTS.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
            <Megaphone className="w-8 h-8 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No announcements yet. Check back soon!</p>
          </div>
        ) : (
          ANNOUNCEMENTS.map((post, i) => {
            const config = TYPE_CONFIG[post.type];
            return (
              <div key={i} className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center`}>
                    <config.icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${config.color}`}>{config.label}</span>
                    <p className="text-[11px] text-white/25">{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{post.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{post.body}</p>
                {post.link && (
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-neuro-orange hover:underline"
                  >
                    {post.linkText || "Learn more"} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Coming Soon */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center">
        <p className="text-white/20 text-xs font-bold uppercase tracking-widest mb-2">Coming Soon</p>
        <p className="text-white/40 text-sm">Member wins, discussion threads, and peer networking. This space will grow as the community grows.</p>
      </div>
    </div>
  );
}
