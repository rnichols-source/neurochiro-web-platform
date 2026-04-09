"use client";

import { useState, useEffect } from "react";
import { Zap, Flame, Search, Heart, BookOpen, Activity, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { getPatientDashboardData } from "./actions";

export default function PatientDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatientDashboardData().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-neuro-orange animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-heading font-black text-neuro-navy">Hi, {data?.name || 'there'}</h1>

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
