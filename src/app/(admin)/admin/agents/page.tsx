"use client";

import { useState, useEffect } from "react";
import { Bot, RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Send, Mail, UserCheck, Zap, TrendingUp, BarChart3, Trash2, ShieldCheck, Play, GraduationCap, Database, Search } from "lucide-react";
import { getAgentStatus, triggerAgent } from "./actions";

const AGENTS = [
  {
    id: "weekly-digest",
    name: "Weekly Digest",
    description: "Sends every doctor their weekly profile views and stats email",
    schedule: "Every Monday at 8 AM",
    icon: Mail,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    id: "follow-up-bot",
    name: "Follow-Up Bot",
    description: "Auto-sends follow-up emails to outreach prospects. Archives after 3 attempts.",
    schedule: "Every day at 7 AM",
    icon: Send,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    id: "profile-nudger",
    name: "Profile Nudger",
    description: "Nudges doctors missing photo, bio, or specialties to complete their profile",
    schedule: "Every day at 9 AM",
    icon: UserCheck,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    id: "onboarding-sequence",
    name: "Onboarding Sequence",
    description: "Sends timed emails to new members at Day 3, 7, 14, and 30",
    schedule: "Every day at 10 AM",
    icon: Zap,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    id: "upgrade-nudger",
    name: "Upgrade Nudger",
    description: "Sends milestone-based upgrade emails to free doctors (1st view, 25, 50, 100 views, 14 & 30 days)",
    schedule: "Every day at 11 AM",
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    id: "outreach-sender",
    name: "Outreach Sender",
    description: "Auto pre-builds profiles and sends initial emails to 10 new prospects daily",
    schedule: "Weekdays at 8 AM",
    icon: Send,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    id: "analytics-compiler",
    name: "Analytics Compiler",
    description: "Compiles and emails you the weekly platform report with all key metrics",
    schedule: "Every Monday at 7 AM",
    icon: BarChart3,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    id: "database-cleaner",
    name: "Database Cleaner",
    description: "Fixes broken slugs, cleans old queue items, reports data issues",
    schedule: "Every Sunday at 3 AM",
    icon: Database,
    color: "text-gray-400",
    bg: "bg-gray-500/10",
  },
  {
    id: "churn-preventer",
    name: "Churn Preventer",
    description: "Sends retention emails to doctors with payment issues or 30+ days inactive",
    schedule: "Every day at 6 AM",
    icon: ShieldCheck,
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    id: "spotlight-promoter",
    name: "Spotlight Promoter",
    description: "Auto-promotes new Spotlight episodes to all doctors and students via email",
    schedule: "Every Thursday at 10 AM",
    icon: Play,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    id: "student-opportunity",
    name: "Student Opportunity",
    description: "Sends weekly digest of new jobs and seminars to all students",
    schedule: "Every Wednesday at 9 AM",
    icon: GraduationCap,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    id: "vendor-outreach",
    name: "Vendor Outreach",
    description: "Auto-discovers emails and sends vendor directory pitch to 10 new vendor prospects daily",
    schedule: "Weekdays at 10 AM",
    icon: Send,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    id: "lead-nurture",
    name: "Lead Nurture",
    description: "Sends timed email sequences to captured leads — 4-step funnel converting cold leads to signups",
    schedule: "Weekdays at 9 AM",
    icon: Mail,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    id: "seminar-host-outreach",
    name: "Seminar Host Outreach",
    description: "Auto-discovers emails and pitches seminar hosts to list events on NeuroChiro marketplace",
    schedule: "Tue & Thu at 11 AM",
    icon: Send,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    id: "chiro-finder",
    name: "Chiropractor Finder",
    description: "Searches Google Maps for chiropractors state by state, scrapes contact info, auto-adds to outreach",
    schedule: "On demand (Run Now)",
    icon: Search,
    color: "text-lime-400",
    bg: "bg-lime-500/10",
  },
  {
    id: "daily-talent-drop",
    name: "Daily Talent Drop",
    description: "Sends top student matches to verified doctors via SMS and notification",
    schedule: "Every Tuesday at 8 AM",
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    id: "profile-reminders",
    name: "Profile Reminders",
    description: "Sends reminders to doctors with incomplete or outdated profiles",
    schedule: "Every day at 2 PM",
    icon: UserCheck,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
];

export default function AgentsPage() {
  const [statuses, setStatuses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  const fetchStatuses = async () => {
    setLoading(true);
    const result = await getAgentStatus();
    setStatuses(result);
    setLoading(false);
  };

  useEffect(() => { fetchStatuses(); }, []);

  const handleTrigger = async (agentId: string) => {
    if (!confirm(`Run "${AGENTS.find(a => a.id === agentId)?.name}" right now?`)) return;
    setTriggering(agentId);
    const result = await triggerAgent(agentId);
    setTriggering(null);
    if (result.success) {
      showToast(result.message || "Agent ran successfully");
      fetchStatuses();
    } else {
      showToast(result.error || "Failed to run agent", "error");
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-xl text-sm font-bold shadow-2xl ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">Agents</h1>
          <p className="text-gray-400 mt-1">Automated systems running in the background</p>
        </div>
        <button onClick={fetchStatuses} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/10 flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGENTS.map((agent) => {
          const status = statuses[agent.id];
          const lastRun = status?.lastRun;
          const lastResult = status?.lastResult;
          const hasError = lastResult?.status === 'failed';

          return (
            <div key={agent.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${agent.bg} flex items-center justify-center`}>
                    <agent.icon className={`w-5 h-5 ${agent.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{agent.name}</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{agent.schedule}</p>
                  </div>
                </div>
                {lastRun && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${hasError ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                    {hasError ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {hasError ? "Error" : "Running"}
                  </div>
                )}
                {!lastRun && !loading && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-500/10 text-gray-500">
                    <Clock className="w-3 h-3" /> Never run
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500">{agent.description}</p>

              {/* Last run info */}
              {lastRun && (
                <div className="bg-white/5 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Last Run</span>
                    <span className="text-xs text-gray-400">{new Date(lastRun).toLocaleString()}</span>
                  </div>
                  {lastResult?.metadata?.sent !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Emails Sent</span>
                      <span className="text-xs text-white font-bold">{lastResult.metadata.sent}</span>
                    </div>
                  )}
                  {lastResult?.metadata?.archived !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Archived</span>
                      <span className="text-xs text-white font-bold">{lastResult.metadata.archived}</span>
                    </div>
                  )}
                  {lastResult?.metadata?.recipients !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recipients</span>
                      <span className="text-xs text-white font-bold">{lastResult.metadata.recipients}</span>
                    </div>
                  )}
                  {hasError && lastResult?.event && (
                    <p className="text-xs text-red-400 mt-1">{lastResult.event}</p>
                  )}
                </div>
              )}

              {/* Manual trigger */}
              <button
                onClick={() => handleTrigger(agent.id)}
                disabled={triggering === agent.id}
                className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {triggering === agent.id ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Running...</>
                ) : (
                  <><Bot className="w-3 h-3" /> Run Now</>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
