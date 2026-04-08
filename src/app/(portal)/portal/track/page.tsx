"use client";

import { useState, useEffect } from "react";
import { Activity, Sun, Moon, Zap, CheckCircle2, TrendingUp, TrendingDown, Minus, Flame } from "lucide-react";
import { submitDailyLog, getLast30DaysLogs, getTodaysLog } from "./actions";

type DailyLog = {
  id: string;
  energy_level: number | null;
  pain_level: number | null;
  sleep_quality: number | null;
  notes: string | null;
  log_date: string | null;
};

function cn(...inputs: any[]) { return inputs.filter(Boolean).join(" "); }

function SliderInput({ label, icon: Icon, value, onChange, color, invertScale }: {
  label: string; icon: any; value: number; onChange: (v: number) => void; color: string; invertScale?: boolean;
}) {
  const displayColor = invertScale
    ? (value <= 3 ? 'text-green-500' : value <= 6 ? 'text-orange-500' : 'text-red-500')
    : (value >= 7 ? 'text-green-500' : value >= 4 ? 'text-orange-500' : 'text-red-500');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-bold text-neuro-navy">{label}</span>
        </div>
        <span className={cn("text-3xl font-black", displayColor)}>{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-neuro-orange [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-neuro-orange [&::-webkit-slider-thumb]:shadow-md touch-pan-x"
      />
      <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
        <span>{invertScale ? 'None' : 'Low'}</span>
        <span>{invertScale ? 'Severe' : 'High'}</span>
      </div>
    </div>
  );
}

export default function TrackPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [todayLogged, setTodayLogged] = useState(false);

  const [energy, setEnergy] = useState(5);
  const [pain, setPain] = useState(3);
  const [sleep, setSleep] = useState(5);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Promise.all([getLast30DaysLogs(), getTodaysLog()]).then(([logsData, today]) => {
      setLogs(logsData as DailyLog[]);
      if (today) {
        setTodayLogged(true);
        setEnergy((today as any).energy_level || 5);
        setPain((today as any).pain_level || 3);
        setSleep((today as any).sleep_quality || 5);
        setNotes((today as any).notes || "");
      }
      setLoading(false);
    });
  }, []);

  const handleSubmit = async () => {
    setSaving(true);
    const result = await submitDailyLog({ energyLevel: energy, painLevel: pain, sleepQuality: sleep, notes });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTodayLogged(true);
      const updatedLogs = await getLast30DaysLogs();
      setLogs(updatedLogs as DailyLog[]);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const recentLogs = logs.slice(-7);
  const olderLogs = logs.slice(-14, -7);

  const avg = (arr: DailyLog[], key: keyof DailyLog) => {
    const vals = arr.map(l => l[key] as number).filter(v => v != null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const energyTrend = avg(recentLogs, 'energy_level') - avg(olderLogs, 'energy_level');
  const painTrend = avg(recentLogs, 'pain_level') - avg(olderLogs, 'pain_level');
  const sleepTrend = avg(recentLogs, 'sleep_quality') - avg(olderLogs, 'sleep_quality');

  // Calculate streak: consecutive days backwards from today with a log
  const streak = (() => {
    if (logs.length === 0) return 0;
    const logDates = new Set(logs.map((l) => l.log_date));
    let count = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (logDates.has(key)) {
        count++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  })();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-2xl font-heading font-black text-neuro-navy uppercase tracking-tight">Health Tracker</h1>
        <p className="text-gray-500 mt-1">Log how you feel each day to see trends over time.</p>
      </header>

      {streak > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-100 rounded-xl w-fit">
          <Flame className="w-5 h-5 text-neuro-orange" />
          <span className="font-bold text-neuro-navy">{streak} day streak</span>
        </div>
      )}

      {/* Daily Check-in */}
      <section className="bg-neuro-cream rounded-2xl border border-gray-100 p-8 shadow-sm">
        <h2 className="text-xl font-black text-neuro-navy mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-neuro-orange" />
          {todayLogged ? "Today's Check-in (Update)" : "Daily Check-in"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SliderInput label="Energy Level" icon={Zap} value={energy} onChange={setEnergy} color="bg-yellow-50 text-yellow-500" />
          <SliderInput label="Pain Level" icon={Activity} value={pain} onChange={setPain} color="bg-red-50 text-red-500" invertScale />
          <SliderInput label="Sleep Quality" icon={Moon} value={sleep} onChange={setSleep} color="bg-blue-50 text-blue-500" />
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about today? (optional)"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange resize-none h-20 mb-4"
        />

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-3 bg-neuro-navy text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-neuro-navy/90 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : saving ? 'Saving...' : todayLogged ? 'Update Check-in' : 'Log Today'}
        </button>
      </section>

      {/* 30-Day Trends */}
      {logs.length > 0 ? (
        <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h2 className="text-xl font-black text-neuro-navy mb-6">30-Day Trends</h2>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Energy', value: avg(recentLogs, 'energy_level').toFixed(1), trend: energyTrend, good: 'up' as const },
              { label: 'Pain', value: avg(recentLogs, 'pain_level').toFixed(1), trend: painTrend, good: 'down' as const },
              { label: 'Sleep', value: avg(recentLogs, 'sleep_quality').toFixed(1), trend: sleepTrend, good: 'up' as const },
            ].map((item) => {
              const isGood = item.good === 'up' ? item.trend > 0 : item.trend < 0;
              const isBad = item.good === 'up' ? item.trend < 0 : item.trend > 0;
              return (
                <div key={item.label} className="bg-gray-50 rounded-2xl p-5 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{item.label} (7-day avg)</p>
                  <p className="text-3xl font-black text-neuro-navy">{item.value}</p>
                  <div className={cn("flex items-center justify-center gap-1 mt-1 text-xs font-bold",
                    isGood ? "text-green-500" : isBad ? "text-red-500" : "text-gray-400"
                  )}>
                    {isGood ? <TrendingUp className="w-3 h-3" /> : isBad ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {Math.abs(item.trend).toFixed(1)} vs prior week
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bar Chart */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Daily Energy (last 30 days)</p>
            <div className="flex items-end gap-1 h-32">
              {logs.map((log, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full bg-neuro-orange/80 rounded-t-sm min-h-[2px] transition-all hover:bg-neuro-orange"
                    style={{ height: `${((log.energy_level || 0) / 10) * 100}%` }}
                    title={`${log.log_date}: Energy ${log.energy_level}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{logs[0]?.log_date}</span>
              <span>{logs[logs.length - 1]?.log_date}</span>
            </div>
          </div>

          {/* Recent Entries */}
          <div className="mt-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Recent Entries</p>
            <div className="space-y-2">
              {logs.slice(-7).reverse().map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl text-sm">
                  <span className="text-gray-400 text-xs font-mono w-20">{log.log_date}</span>
                  <span className="font-bold text-yellow-600">E:{log.energy_level}</span>
                  <span className="font-bold text-red-500">P:{log.pain_level}</span>
                  <span className="font-bold text-blue-500">S:{log.sleep_quality}</span>
                  {log.notes && <span className="text-gray-500 text-xs truncate flex-1">{log.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
          <Sun className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-400 mb-2">No tracking data yet</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Start your daily check-in above to track how your energy, pain, and sleep change over time.
          </p>
        </section>
      )}
    </div>
  );
}
