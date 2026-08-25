"use client";

import { Video, Clock, Play, ExternalLink, MessageSquare, Users, Calendar, Mic2 } from "lucide-react";
import Link from "next/link";

// Show details
const SHOW_NAME = "The Weekly Adjustment";
const SHOW_DAY = "Thursday";
const SHOW_TIME = "8:00 PM EST";
const SHOW_TAGLINE = "Real questions. Real doctors. Every Thursday.";

// Next guest — update weekly
const NEXT_GUEST = {
  name: "", // e.g. "Dr. Sarah Johnson"
  city: "", // e.g. "Charlotte, NC"
};

// Past episodes — add new ones at the top
const PAST_EPISODES: { episode: number; date: string; guest: string; city: string; youtubeUrl?: string }[] = [
  // { episode: 1, date: "2026-09-04", guest: "Dr. Sarah Johnson", city: "Charlotte, NC", youtubeUrl: "https://youtube.com/watch?v=..." },
];

function getNextShowDate() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const targetDay = days.indexOf(SHOW_DAY);
  const now = new Date();
  let daysUntil = targetDay - now.getDay();
  if (daysUntil < 0) daysUntil += 7;
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntil);
  return nextDate;
}

export default function WeeklyAdjustmentPage() {
  const nextShow = getNextShowDate();
  const now = new Date();
  const daysUntil = Math.ceil((nextShow.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-1">Live Show</p>
        <h1 className="text-2xl font-bold text-white">{SHOW_NAME}</h1>
        <p className="text-white/40 text-sm mt-1">{SHOW_TAGLINE}</p>
      </div>

      {/* Next Episode Card */}
      <div className="bg-gradient-to-r from-neuro-orange/20 to-neuro-orange/5 border border-neuro-orange/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-neuro-orange/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Video className="w-7 h-7 text-neuro-orange" />
          </div>
          <div className="flex-1">
            <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-1">Next Episode</p>
            <h2 className="text-xl font-bold text-white">
              {SHOW_DAY} at {SHOW_TIME}
            </h2>
            <p className="text-white/50 text-sm mt-1">
              {daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`} — {nextShow.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
            {NEXT_GUEST.name && (
              <div className="mt-3 bg-white/[0.06] rounded-xl px-4 py-3 inline-flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-neuro-orange" />
                <span className="text-sm text-white/70">This week's guest: <strong className="text-white">{NEXT_GUEST.name}</strong> from {NEXT_GUEST.city}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Show Format */}
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6">
        <h3 className="text-sm font-bold text-white mb-5">How the Show Works</h3>
        <div className="space-y-4">
          {[
            { time: "8:00", icon: Video, title: "Open", desc: "Dr. Ray opens the show with what's new at NeuroChiro" },
            { time: "8:05", icon: Mic2, title: "Featured Doctor", desc: "This week's guest doctor joins. Quick intro about their practice." },
            { time: "8:07", icon: MessageSquare, title: "Your Questions", desc: "Dr. Ray and the guest answer 5-7 real patient questions collected during the week." },
            { time: "8:25", icon: Users, title: "Live Q&A", desc: "Open it up to the live audience. Drop your questions in the comments." },
            { time: "8:35", icon: Calendar, title: "Find Your Doctor", desc: "Patients drop their city in the comments. Dr. Ray pulls up the directory and finds them a chiropractor." },
            { time: "8:45", icon: Users, title: "Member Shoutouts", desc: "Quick round of 5-10 member doctors. Name, city, go find them." },
            { time: "8:50", icon: Video, title: "Close", desc: "\"You've been adjusted.\" See you next Thursday." },
          ].map((segment, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-12 text-right flex-shrink-0">
                <span className="text-[11px] text-white/25 font-mono">{segment.time}</span>
              </div>
              <div className="w-8 h-8 bg-white/[0.06] rounded-lg flex items-center justify-center flex-shrink-0">
                <segment.icon className="w-4 h-4 text-neuro-orange" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/80">{segment.title}</p>
                <p className="text-xs text-white/30 mt-0.5">{segment.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit a Question */}
      <div className="bg-neuro-orange/10 border border-neuro-orange/20 rounded-2xl p-6 text-center">
        <MessageSquare className="w-8 h-8 text-neuro-orange mx-auto mb-3" />
        <p className="text-white font-bold text-base mb-2">Got a question for the show?</p>
        <p className="text-white/40 text-sm mb-4">DM @neurochiro on Instagram or drop it in the story question sticker. Best questions get answered live on air.</p>
        <a
          href="https://instagram.com/neurochiro"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm hover:bg-neuro-orange/90 transition-all"
        >
          Submit a Question
        </a>
      </div>

      {/* Past Episodes */}
      <div>
        <h3 className="text-sm font-bold text-white mb-4">Past Episodes</h3>
        {PAST_EPISODES.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
            <Clock className="w-8 h-8 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">First episode coming soon. Check back after {SHOW_DAY}!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {PAST_EPISODES.map((ep, i) => (
              <div key={i} className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-xl border border-white/[0.08] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neuro-orange/10 rounded-lg flex items-center justify-center">
                    <span className="text-neuro-orange font-black text-sm">{ep.episode}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">EP {ep.episode}: {ep.guest}</p>
                    <p className="text-[11px] text-white/30">{ep.city} — {new Date(ep.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                {ep.youtubeUrl && (
                  <a href={ep.youtubeUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 flex items-center gap-1">
                    <Play className="w-3 h-3" /> Watch
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
