"use client";

import { Loader2, Eye, Users, DollarSign, MapPin, Briefcase, Calendar, Bell, Mail, ArrowRight, Copy, CheckCircle2, Gift } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  getDoctorDashboardStats,
  getDoctorActivityFeed,
  getPracticeHealthScore,
  getCompetitiveIntelligence,
  getSmartActionItems,
  getRevenueIntelligence,
  getLeadPipelineStages,
} from "./actions";
import { formatDistanceToNow } from "date-fns";
import { getOrCreateReferralCode, getReferralStats } from "@/app/actions/referral-program";
import { createClient } from "@/lib/supabase";
import WhatsNew from "@/components/common/WhatsNew";
import PracticeHealthGauge from "./practice-health";
import ActionItems from "./action-items";
import LeadPipelineWidget from "./lead-pipeline-widget";
import CompetitiveIntelWidget from "./competitive-intel-widget";
import RevenueWidget from "./revenue-widget";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
};

function delay(d: number) { return { ...fadeUp, transition: { ...fadeUp.transition, delay: d } }; }

export default function DoctorDashboard() {
  const [data, setData] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [intel, setIntel] = useState<any>(null);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState(0);

  // Referral state
  const [referralCode, setReferralCode] = useState("");
  const [referralStats, setReferralStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      getDoctorDashboardStats(),
      getPracticeHealthScore(),
      getCompetitiveIntelligence(),
      getSmartActionItems(),
      getRevenueIntelligence(),
      getLeadPipelineStages(),
      getDoctorActivityFeed(),
    ]).then(([statsRes, healthRes, intelRes, actionsRes, revenueRes, pipelineRes, activityRes]) => {
      if (statsRes) setData(statsRes);
      if (healthRes) setHealth(healthRes);
      if (intelRes) setIntel(intelRes);
      setActionItems(actionsRes || []);
      if (revenueRes) setRevenue(revenueRes);
      if (pipelineRes) setPipeline(pipelineRes);
      setActivity(activityRes || []);
      setLoading(false);
    });

    // Get live views count
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("doctors").select("profile_views").eq("user_id", user.id).single().then(({ data }) => {
          if (data) setViews(data.profile_views || 0);
        });
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neuro-orange animate-spin" />
      </div>
    );
  }

  const doctorName = data?.profile?.full_name?.split(" ")[0] || "Doctor";
  const clinicName = data?.doctor?.clinic_name || "";
  const slug = data?.doctor?.slug;
  const stats = data?.stats || [];
  const profileViews = views || parseInt(stats[0]?.value || "0");
  const patientLeads = parseInt(stats[1]?.value || "0");

  const iconMap: Record<string, any> = { job: Briefcase, seminar: Calendar, referral: Users, message: Mail, system: Bell };

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-6xl mx-auto space-y-6">
      <WhatsNew />

      {/* Top Banner: Greeting + Practice Health Score */}
      <motion.div {...delay(0)} className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neuro-orange font-semibold mb-1">Practice Command Center</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, Dr. {doctorName}
            </h1>
            {clinicName && <p className="text-white/30 text-sm mt-1">{clinicName}</p>}
            {slug && (
              <Link href={`/directory/${slug}`} target="_blank" className="text-xs text-neuro-orange hover:underline mt-2 inline-flex items-center gap-1">
                View Public Profile <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          {health && <PracticeHealthGauge data={health} />}
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div {...delay(0.05)} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl border border-blue-100 p-5">
          <Eye className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-black text-neuro-navy">{profileViews}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profile Views</p>
        </div>
        <div className="bg-gradient-to-b from-emerald-50 to-white rounded-2xl border border-emerald-100 p-5">
          <Users className="w-5 h-5 text-emerald-500 mb-2" />
          <p className="text-2xl font-black text-neuro-navy">{patientLeads}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient Leads</p>
        </div>
        <div className="bg-gradient-to-b from-violet-50 to-white rounded-2xl border border-violet-100 p-5">
          <DollarSign className="w-5 h-5 text-violet-500 mb-2" />
          <p className="text-2xl font-black text-neuro-navy">${(revenue?.estimatedMonthlyRevenue || 0).toLocaleString()}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Est. Revenue</p>
        </div>
        <div className="bg-gradient-to-b from-orange-50 to-white rounded-2xl border border-orange-100 p-5">
          <MapPin className="w-5 h-5 text-neuro-orange mb-2" />
          <p className="text-2xl font-black text-neuro-navy">{intel ? `#${intel.cityRank}` : '—'}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{intel ? `in ${intel.city}` : 'Directory Rank'}</p>
        </div>
      </motion.div>

      {/* Smart Action Items */}
      <motion.div {...delay(0.1)}>
        <p className="text-[10px] uppercase tracking-[0.2em] text-neuro-orange font-semibold mb-3">Action Items</p>
        <ActionItems items={actionItems} />
      </motion.div>

      {/* Two-Column: Pipeline + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...delay(0.15)}>
          <LeadPipelineWidget stages={pipeline || { new: 0, contacted: 0, scheduled: 0, converted: 0 }} />
        </motion.div>

        <motion.div {...delay(0.15)} className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recent Activity</h3>
            <Link href="/doctor/notifications" className="text-[10px] font-bold text-neuro-orange hover:underline">View All</Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-xs text-white/30">No recent activity yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 5).map((item: any, i: number) => {
                const Icon = iconMap[item.type] || Bell;
                return (
                  <Link key={i} href={item.link || '#'} className="flex items-start gap-3 group">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-white/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60 group-hover:text-neuro-orange transition-colors truncate">{item.title}</p>
                      <p className="text-[10px] text-white/20">{formatDistanceToNow(new Date(item.time), { addSuffix: true })}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Two-Column: Revenue + Competitive Intel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {revenue && (
          <motion.div {...delay(0.2)}>
            <RevenueWidget {...revenue} />
          </motion.div>
        )}
        {intel && (
          <motion.div {...delay(0.2)}>
            <CompetitiveIntelWidget {...intel} />
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <motion.div {...delay(0.25)}>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Edit Profile", href: "/doctor/profile", icon: "👤" },
            { label: "Post a Job", href: "/doctor/jobs", icon: "💼" },
            { label: "Browse Students", href: "/doctor/students", icon: "🎓" },
            { label: "Marketplace", href: "/marketplace", icon: "🛒" },
          ].map((action) => (
            <Link key={action.href} href={action.href} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center hover:border-neuro-orange/20 hover:bg-neuro-orange/5 transition-all">
              <span className="text-2xl block mb-2">{action.icon}</span>
              <p className="text-xs font-bold text-white/50">{action.label}</p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Referral Program */}
      <motion.div {...delay(0.3)} className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-neuro-orange" />
          <h3 className="text-sm font-bold text-white">Referral Program</h3>
        </div>
        <p className="text-xs text-white/30 mb-4">Invite doctors to NeuroChiro and earn free months on your membership.</p>
        {referralCode ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm font-mono text-neuro-orange">
              neurochiro.co/join?ref={referralCode}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(`https://neurochiro.co/join?ref=${referralCode}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="p-2.5 bg-neuro-orange text-white rounded-lg hover:bg-neuro-orange/90"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <button
            onClick={async () => { const result = await getOrCreateReferralCode(); if (result && typeof result === 'object' && 'code' in result) setReferralCode((result as any).code); else if (typeof result === 'string') setReferralCode(result); }}
            className="px-4 py-2 bg-neuro-orange text-white text-xs font-bold rounded-lg hover:bg-neuro-orange/90"
          >
            Generate Referral Link
          </button>
        )}
      </motion.div>
    </div>
  );
}
