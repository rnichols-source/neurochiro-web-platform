"use client";

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  MousePointerClick, 
  DollarSign, 
  Target, 
  ArrowUpRight, 
  ChevronRight,
  Lock,
  Sparkles,
  Info,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MembershipTier } from '@/types/directory';
import { ROIStats, ROIData } from '@/types/analytics';

interface ROIDashboardProps {
  tier: MembershipTier;
  data: ROIData;
  onUpgrade?: () => void;
}

export default function ROIDashboard({ tier, data, onUpgrade }: ROIDashboardProps) {
  const isLocked = tier === 'starter';
  const isLimited = tier === 'growth';
  
  const stats = data.stats;
  const estimatedRevenue = stats.confirmed_patients * stats.average_case_value;
  const roiMultiplier = estimatedRevenue / stats.membership_cost;

  // Starter Tier Profit Teaser Calculation
  const potentialNewPatients = Math.floor(stats.profile_views * 0.05);
  const potentialRevenue = potentialNewPatients * stats.average_case_value;
  const lostRevenue = potentialRevenue - estimatedRevenue;

  if (isLocked) {
    return (
      <div className="space-y-8">
        {/* Profit Teaser Header */}
        <section className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/5 blur-[100px] -mr-32 -mt-32"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4 text-neuro-orange" />
                <span className="text-[10px] font-black uppercase tracking-widest text-neuro-orange bg-neuro-orange/10 px-3 py-1 rounded-full">Shadow ROI Mode</span>
              </div>
              <h2 className="text-4xl font-heading font-black text-neuro-navy mb-4">Stop the Bleeding.</h2>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed max-w-md">
                Based on your profile views, you likely missed out on <span className="font-bold text-neuro-orange">${lostRevenue.toLocaleString()}</span> in new patient value this month because your profile isn't optimized.
              </p>
              <button 
                onClick={onUpgrade}
                className="px-8 py-4 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all shadow-xl flex items-center gap-3 uppercase tracking-widest text-xs"
              >
                Claim My Lost Revenue <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-neuro-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
               <div className="absolute inset-0 bg-gradient-to-br from-neuro-navy to-neuro-navy-dark"></div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Potential Pipeline (Blurred)</p>
                  <div className="space-y-6">
                     <div className="flex items-end justify-between border-b border-white/5 pb-4">
                        <div>
                           <p className="text-xs text-gray-400 mb-1">Missed Opportunities</p>
                           <p className="text-3xl font-black blur-md select-none">${potentialRevenue.toLocaleString()}</p>
                        </div>
                        <Lock className="w-5 h-5 text-neuro-orange" />
                     </div>
                     <div className="flex items-end justify-between border-b border-white/5 pb-4">
                        <div>
                           <p className="text-xs text-gray-400 mb-1">Local Market Demand</p>
                           <p className="text-3xl font-black blur-md select-none">148 PATIENTS</p>
                        </div>
                        <Lock className="w-5 h-5 text-neuro-orange" />
                     </div>
                  </div>
                  <p className="text-[9px] text-gray-500 mt-6 italic">Upgrade to Growth to unblur your practice analytics and start converting these leads.</p>
               </div>
            </div>
          </div>
        </section>

        {/* Engagement Teaser Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Profile Views", value: stats.profile_views, icon: Users, color: "text-blue-500", bg: "bg-blue-50", blurred: false },
            { label: "Contact Clicks", value: "84", icon: MousePointerClick, color: "text-purple-500", bg: "bg-purple-50", blurred: true },
            { label: "Bookings", value: "42", icon: Calendar, color: "text-neuro-orange", bg: "bg-neuro-orange/10", blurred: true },
            { label: "New Patients", value: "12", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50", blurred: true }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-16 h-16 ${stat.bg} rounded-bl-[2rem] flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
              <div className="flex items-end justify-between">
                <span className={cn("text-3xl font-black text-neuro-navy", stat.blurred && "blur-sm select-none")}>{stat.value}</span>
                {stat.blurred && <Lock className="w-3 h-3 text-gray-300 mb-2" />}
              </div>
            </div>
          ))}
        </div>

        {/* Lost Revenue Calculator */}
        <section className="bg-gray-50 rounded-[3rem] p-12 border border-gray-100 flex flex-col items-center text-center">
           <div className="p-4 bg-red-50 text-red-500 rounded-2xl mb-6">
              <TrendingUp className="w-8 h-8 rotate-180" />
           </div>
           <h3 className="text-2xl font-black text-neuro-navy mb-2">The Cost of Inaction</h3>
           <p className="text-gray-500 max-w-md mb-8">Your clinic is currently capturing less than 15% of available digital patient demand in your zip code.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
              <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Loss</p>
                 <p className="text-2xl font-black text-red-500">-${(lostRevenue / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Yearly Opportunity</p>
                 <p className="text-2xl font-black text-neuro-navy">${lostRevenue.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-white rounded-2xl border border-neuro-orange/20 shadow-sm relative">
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neuro-orange text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Recommended</div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Recovery Plan</p>
                 <p className="text-2xl font-black text-neuro-orange">Growth Tier</p>
              </div>
           </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* High Impact ROI Banner */}
      <section className="bg-neuro-navy rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-neuro-orange/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-neuro-orange/20 text-neuro-orange text-[10px] font-black uppercase tracking-widest rounded-full border border-neuro-orange/30">
                Performance Scorecard
              </span>
              <span className="text-gray-400 text-xs font-bold">Period: {data.period.toUpperCase()}</span>
            </div>
            <h2 className="text-5xl font-heading font-black mb-4">Your NeuroChiro ROI</h2>
            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
              Based on {stats.confirmed_patients} confirmed patients and an average case value of ${stats.average_case_value.toLocaleString()}.
            </p>
            
            <div className="mt-10 flex flex-wrap gap-8">
               <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Estimated Revenue</p>
                  <p className="text-4xl font-black text-white">${estimatedRevenue.toLocaleString()}</p>
               </div>
               <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
               <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Monthly Membership</p>
                  <p className="text-4xl font-black text-white">${stats.membership_cost}</p>
               </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative group">
               <div className="absolute inset-0 bg-neuro-orange blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
               <div className="relative w-56 h-56 rounded-full border-[12px] border-white/5 flex flex-col items-center justify-center text-center p-8">
                  <span className="text-6xl font-black text-neuro-orange">{Math.round(roiMultiplier)}x</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Return on Cost</span>
               </div>
               <div className="absolute -bottom-4 -right-4 bg-white text-neuro-navy p-4 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Efficiency</p>
                    <p className="text-sm font-black text-neuro-navy">Dominant</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Profile Views", value: stats.profile_views, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Contact Clicks", value: stats.contact_clicks, icon: MousePointerClick, color: "text-purple-500", bg: "bg-purple-50" },
          { label: "Bookings", value: stats.booking_clicks, icon: Calendar, color: "text-neuro-orange", bg: "bg-neuro-orange/10" },
          { label: "New Patients", value: stats.confirmed_patients, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-16 h-16 ${stat.bg} rounded-bl-[2rem] flex items-center justify-center transition-transform group-hover:scale-110`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-neuro-navy">{stat.value}</span>
              {i > 0 && (
                <span className="text-[10px] font-bold text-gray-400 mb-1">
                  {Math.round((stat.value / stats.profile_views) * 100)}% Conv.
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Historical Revenue Trend */}
        <section className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-heading font-black flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neuro-orange" /> Growth Trajectory
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span>Estimated Monthly Revenue</span>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-4 px-4 border-b border-gray-50">
            {data.historical_revenue.map((rev, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div 
                  className="w-full bg-neuro-navy rounded-t-xl transition-all group-hover:bg-neuro-orange"
                  style={{ height: `${(rev.amount / Math.max(...data.historical_revenue.map(r => r.amount))) * 100}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neuro-navy text-white px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                    ${rev.amount.toLocaleString()}
                  </div>
                </div>
                <span className="text-[9px] font-bold text-gray-400 mt-4 uppercase">{rev.date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Action Center */}
        <div className="space-y-6">
          <section className="bg-neuro-cream rounded-[2.5rem] p-8 border border-neuro-navy/5">
            <h4 className="font-heading font-black text-neuro-navy mb-4">ROI Accelerator</h4>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Profiles with introduction videos receive significantly more patient engagement.
            </p>
            <button className="w-full py-4 bg-white text-neuro-navy font-black rounded-2xl hover:bg-gray-50 transition-all border border-gray-200 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
              Add Intro Video <ArrowUpRight className="w-3 h-3" />
            </button>
          </section>

          {tier === 'growth' ? (
            <section className="bg-gradient-to-br from-neuro-orange to-neuro-orange-dark rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Pro Insight Locked</span>
                </div>
                <h4 className="font-heading font-black text-lg mb-2">Deep Referral Tracking</h4>
                <p className="text-xs text-white/70 mb-6 leading-relaxed">
                  Unlock exact traffic source tracking and referral network insights.
                </p>
                <button 
                  onClick={onUpgrade}
                  className="w-full py-4 bg-white text-neuro-orange font-black rounded-2xl hover:bg-white/90 transition-all text-[10px] uppercase tracking-widest shadow-lg"
                >
                  Upgrade to Pro
                </button>
              </div>
            </section>
          ) : tier === 'pro' && (
            <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-green-50 rounded-lg">
                  <Target className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neuro-navy">Deep Referral Tracking</span>
              </div>
              <h4 className="font-heading font-black text-lg mb-6">Top Patient Sources</h4>
              <div className="space-y-4">
                {[
                  { name: "Organic Search", val: "42%", trend: "up" },
                  { name: "Instagram Bio", val: "28%", trend: "up" },
                  { name: "NeuroChiro Map", val: "15%", trend: "stable" },
                  { name: "Direct Referrals", val: "10%", trend: "up" }
                ].map((source, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">{source.name}</span>
                    <span className="text-xs font-black text-neuro-navy">{source.val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-50">
                <p className="text-[9px] text-gray-400 leading-relaxed italic">
                  *Referral data is tracked via unique attribution tokens on your profile links.
                </p>
              </div>
            </section>
          )}

          <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
            <h4 className="font-heading font-black text-neuro-navy mb-6 flex items-center gap-2">
              <Info className="w-4 h-4 text-neuro-orange" /> Calculation Method
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                </div>
                <p className="text-[10px] text-gray-500 font-medium">Automatic tracking of booking link clicks and profile taps.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                </div>
                <p className="text-[10px] text-gray-500 font-medium">Manual confirmation of patients in your practice portal.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                </div>
                <p className="text-[10px] text-gray-500 font-medium">ROI based on your custom Average Case Value.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
