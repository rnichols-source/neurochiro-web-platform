"use client";

import { useState, useEffect } from "react";
import { Zap, Flame, Search, Heart, BookOpen, Activity, ArrowRight, Loader2, Dumbbell, Calendar, TrendingUp, Apple, Lightbulb } from "lucide-react";
import Link from "next/link";
import { getPatientDashboardData } from "./actions";
import { isPremiumMember, createPremiumCheckout } from "../premium-actions";

// Daily tip — auto-rotates based on day of year
let todaysTip: any = null;
try {
  const { getTodaysTip } = require("../daily-tips-data");
  todaysTip = getTodaysTip();
} catch {};

export default function PatientDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState(false);

  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      getPatientDashboardData(),
      isPremiumMember().catch(() => false),
    ])
      .then(([d, p]) => { setData(d); setPremium(p); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-neuro-orange animate-spin" /></div>;
  if (error) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><p className="text-red-500 font-bold">Something went wrong.</p><button onClick={() => window.location.reload()} className="px-4 py-2 bg-neuro-navy text-white rounded-xl text-sm font-bold">Retry</button></div>;

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-heading font-black text-neuro-navy">Hi, {data?.name || 'there'}</h1>

      {/* Premium Quick Actions */}
      {premium && (
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "Check In", href: "/portal/track", icon: Activity, bg: "bg-blue-50", iconColor: "text-blue-500" },
            { label: "Exercises", href: "/portal/exercises", icon: Dumbbell, bg: "bg-orange-50", iconColor: "text-neuro-orange" },
            { label: "Learn", href: "/portal/learn", icon: BookOpen, bg: "bg-green-50", iconColor: "text-green-500" },
            { label: "My Journey", href: "/portal/journey", icon: Calendar, bg: "bg-purple-50", iconColor: "text-purple-500" },
            { label: "Nutrition", href: "/portal/supplements", icon: Apple, bg: "bg-red-50", iconColor: "text-red-500" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${item.bg} rounded-2xl p-4 text-center hover:shadow-md transition-all active:scale-95`}
            >
              <item.icon className={`w-7 h-7 ${item.iconColor} mx-auto mb-1.5`} />
              <p className="text-[11px] font-bold text-neuro-navy">{item.label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Onboarding for new patients */}
      {!data?.todayLogged && (!data?.streak || data.streak === 0) && (
        <div className="bg-white rounded-2xl border border-neuro-orange/20 p-6">
          <h2 className="font-black text-neuro-navy mb-1">Welcome to NeuroChiro</h2>
          <p className="text-gray-500 text-sm mb-4">Here&apos;s how to get started:</p>
          <div className="space-y-3">
            <Link href="/portal/track" className="flex items-center gap-4 p-4 rounded-xl border bg-gray-50 border-gray-100 hover:border-neuro-orange/30 transition-all">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-black">1</div>
              <div>
                <p className="text-sm font-bold text-neuro-navy">Log your first check-in</p>
                <p className="text-xs text-gray-400">Track your energy, pain, and sleep in 30 seconds</p>
              </div>
            </Link>
            <Link href="/directory" className="flex items-center gap-4 p-4 rounded-xl border bg-gray-50 border-gray-100 hover:border-neuro-orange/30 transition-all">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-black">2</div>
              <div>
                <p className="text-sm font-bold text-neuro-navy">Find a doctor near you</p>
                <p className="text-xs text-gray-400">Search the global directory of verified specialists</p>
              </div>
            </Link>
            <Link href="/portal/saved" className="flex items-center gap-4 p-4 rounded-xl border bg-gray-50 border-gray-100 hover:border-neuro-orange/30 transition-all">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-black">3</div>
              <div>
                <p className="text-sm font-bold text-neuro-navy">Save your favorites</p>
                <p className="text-xs text-gray-400">Bookmark doctors to compare and revisit later</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Daily Check-in Card — THE primary action */}
      {data?.todayLogged ? (
        <div className="bg-white rounded-2xl border border-green-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-green-600">Today&apos;s Check-in</p>
            <Link href="/portal/track" className="text-xs font-bold text-neuro-orange hover:underline">Update</Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-black text-neuro-navy">{data.todaysLog.energy_level}</p>
              <p className="text-xs text-gray-400">Energy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-neuro-navy">{data.todaysLog.pain_level}</p>
              <p className="text-xs text-gray-400">Pain</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-neuro-navy">{data.todaysLog.sleep_quality}</p>
              <p className="text-xs text-gray-400">Sleep</p>
            </div>
          </div>
        </div>
      ) : (
        <Link href="/portal/track" className="block bg-neuro-navy rounded-2xl p-8 text-center group hover:bg-neuro-navy/90 transition-colors">
          <Zap className="w-10 h-10 text-neuro-orange mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">How are you feeling today?</h2>
          <p className="text-gray-400 text-sm mb-4">Log your energy, pain, and sleep in 30 seconds.</p>
          <span className="inline-flex items-center gap-2 px-6 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm group-hover:gap-3 transition-all">
            Start Check-in <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      )}

      {/* Streak */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className={`w-6 h-6 ${data?.streak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
            <div>
              <p className="font-bold text-neuro-navy">
                {data?.streak > 0 ? `${data.streak} day streak` : 'No streak yet'}
              </p>
              <p className="text-xs text-gray-400">
                {data?.streak > 0 ? 'Keep it going!' : 'Start your first check-in to begin tracking.'}
              </p>
            </div>
          </div>
        </div>

        {/* Mini trend — last 7 days */}
        {data?.last7Days && data.last7Days.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400 mr-2">Last 7 days</p>
            {data.last7Days.map((day: any, i: number) => {
              const dayName = new Date(day.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).charAt(0);
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      day.energy === null ? 'bg-gray-100 text-gray-300' :
                      day.energy >= 7 ? 'bg-green-100 text-green-600' :
                      day.energy >= 4 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}
                    title={`${day.date}: ${day.energy !== null ? `Energy ${day.energy}` : 'No log'}`}
                  >
                    {day.energy !== null ? day.energy : '·'}
                  </div>
                  <span className="text-[9px] text-gray-400">{dayName}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Health Tip */}
      {todaysTip && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-neuro-orange/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{todaysTip.emoji}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-neuro-orange" />
                <span className="text-[10px] font-bold text-neuro-orange uppercase tracking-widest">Today&apos;s Tip</span>
                <span className="text-[10px] text-gray-400 ml-auto">{todaysTip.category}</span>
              </div>
              <h3 className="font-bold text-neuro-navy text-sm mb-1">{todaysTip.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{todaysTip.body}</p>
              <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                <p className="text-xs text-green-700"><strong>Today&apos;s action:</strong> {todaysTip.actionStep}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Card */}
      {!premium && (
        <div className="bg-neuro-navy rounded-2xl p-6">
          <h3 className="text-white font-black text-lg mb-1">Your Health, Between Visits</h3>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            Track your progress, get daily exercises, and understand what&apos;s happening in your body &mdash; all in one place.
          </p>
          <p className="text-gray-300 text-xs font-bold mb-4">$9/month &middot; Cancel anytime</p>
          <button
            onClick={async () => {
              const result = await createPremiumCheckout();
              if (result.url) {
                window.location.href = result.url;
              } else {
                alert(result.error || 'Something went wrong');
              }
            }}
            className="px-5 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm hover:bg-neuro-orange/90 transition-all"
          >
            Start Free Trial &mdash; 7 Days Free
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Find a Doctor", href: "/directory", icon: Search },
          { label: "Saved", href: "/portal/saved", icon: Heart },
          { label: "Learn", href: "/portal/learn", icon: BookOpen },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-md hover:border-gray-200 transition-all"
          >
            <item.icon className="w-5 h-5 text-neuro-orange mx-auto mb-2" />
            <p className="text-xs font-bold text-neuro-navy">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
