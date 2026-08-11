"use client";

import { Video, Clock, Play, ExternalLink } from "lucide-react";
import Link from "next/link";

// Static schedule — Dr. Ray updates this when he picks a day/time
const LIVE_SCHEDULE = {
  day: "Wednesday",
  time: "12:00 PM EST",
  platforms: ["Instagram Live", "YouTube Live"],
};

// Past recordings — add new ones at the top as they happen
const PAST_LIVES: { title: string; date: string; youtubeUrl?: string; igUrl?: string }[] = [
  // { title: "Nervous System Chiropractic in the South", date: "2026-08-06", youtubeUrl: "https://youtube.com/watch?v=..." },
];

function getNextLiveDate() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const targetDay = days.indexOf(LIVE_SCHEDULE.day);
  const now = new Date();
  const currentDay = now.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntil);
  return nextDate;
}

export default function LivesPage() {
  const nextLive = getNextLiveDate();
  const now = new Date();
  const daysUntil = Math.ceil((nextLive.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-neuro-orange font-semibold mb-1">Weekly Lives</p>
        <h1 className="text-2xl font-bold text-white">Live with Dr. Ray</h1>
        <p className="text-white/40 text-sm mt-1">Every week, Dr. Ray goes live to promote member practices, discuss nervous system chiropractic, and send patients to the directory.</p>
      </div>

      {/* Next Live Card */}
      <div className="bg-gradient-to-r from-neuro-orange/20 to-neuro-orange/5 border border-neuro-orange/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-neuro-orange/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Video className="w-7 h-7 text-neuro-orange" />
          </div>
          <div className="flex-1">
            <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-1">Next Live</p>
            <h2 className="text-xl font-bold text-white">
              {LIVE_SCHEDULE.day} at {LIVE_SCHEDULE.time}
            </h2>
            <p className="text-white/50 text-sm mt-1">
              {daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`} — {nextLive.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
            <div className="flex items-center gap-3 mt-3">
              {LIVE_SCHEDULE.platforms.map((p) => (
                <span key={p} className="px-3 py-1 bg-white/[0.08] rounded-full text-[11px] font-bold text-white/60">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* What Happens on Lives */}
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6">
        <h3 className="text-sm font-bold text-white mb-4">What Happens on the Lives</h3>
        <div className="space-y-3">
          {[
            { text: "Dr. Ray shouts out member practices by name and location" },
            { text: "Viewers get directed to the NeuroChiro directory to find you" },
            { text: "Nervous system chiropractic education and patient stories" },
            { text: "Live Q&A with member doctors" },
            { text: "Clips from each live are chopped into reels for your social" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-neuro-orange flex-shrink-0" />
              <span className="text-sm text-white/60">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Past Recordings */}
      <div>
        <h3 className="text-sm font-bold text-white mb-4">Past Recordings</h3>
        {PAST_LIVES.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
            <Clock className="w-8 h-8 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No recordings yet. Check back after the first live!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {PAST_LIVES.map((live, i) => (
              <div key={i} className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-xl border border-white/[0.08] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{live.title}</p>
                    <p className="text-[11px] text-white/30">{new Date(live.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {live.youtubeUrl && (
                    <a href={live.youtubeUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> YouTube
                    </a>
                  )}
                  {live.igUrl && (
                    <a href={live.igUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-500/20 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Instagram
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
