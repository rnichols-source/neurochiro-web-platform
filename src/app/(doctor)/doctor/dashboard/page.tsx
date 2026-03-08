"use client";

import { 
  Users, 
  Search, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  MapPin,
  Lock,
  Eye,
  Plus,
  BarChart3,
  MousePointerClick,
  Globe,
  UserPlus,
  Tag,
  ChevronRight,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useDoctorTier } from "@/context/DoctorTierContext";
import { getDoctorDashboardStats } from "./actions";
import OnboardingTracker from "@/components/doctor/OnboardingTracker";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DoctorDashboard() {
  const { tier, isGrowth, isPro } = useDoctorTier();
  const [isBoosting, setIsBoosting] = useState(false);
  const [boosted, setBoosted] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDoctorDashboardStats();
        // Even if data is null, we want a base object to prevent UI crashes if some checks fail
        setDashboardData(data || { 
          profile: { name: "Doctor", clinicName: "Practice", isMember: false },
          stats: [],
          marketPerformance: { completeness: 0, reviews: 0, engagement: 0 }
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setDashboardData({
          profile: { name: "Doctor", clinicName: "Practice", isMember: false },
          stats: [],
          marketPerformance: { completeness: 0, reviews: 0, engagement: 0 }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Consider a doctor "isMember" if they are Growth or Pro for general dashboard access
  const isMember = dashboardData?.profile?.isMember || isGrowth;

  const handleBoost = () => {
    setIsBoosting(true);
    setTimeout(() => {
      setIsBoosting(false);
      setBoosted(true);
    }, 1500);
  };

  const vendorOffers = [
    {
      vendor: "NeuralPulse Technologies",
      title: "20% off Neuro scanning equipment",
      code: "NEUROPRO20",
      link: "#"
    },
    {
      vendor: "ChiroFlow EHR",
      title: "3 months free practice software",
      code: "FLOW3FREE",
      link: "#"
    },
    {
      vendor: "GrowthSpine Marketing",
      title: "$500 off onboarding",
      code: "GROW500",
      link: "#"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neuro-cream">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10">
      {/* Welcome & Global Stats */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy leading-tight">
            {isMember ? "Practice Command Center" : "Doctor Dashboard"}
          </h1>
          <p className="text-neuro-gray mt-2 text-lg">
            {isMember ? (
              <>Live insights for <span className="font-bold text-neuro-orange">{dashboardData?.profile?.clinicName || "West Side Neuro-Life"}</span>.</>
            ) : (
              "Non-Member Portal • Practice Visibility: Limited"
            )}
          </p>
        </div>
        
        {isMember ? (
          <div className="flex flex-wrap gap-4">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Visibility</span>
              <span className="text-2xl font-black text-neuro-navy">Top 5%</span>
            </div>
            <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Opt Score</span>
              <span className="text-2xl font-black text-neuro-orange">98/100</span>
            </div>
          </div>
        ) : (
          <Link href="/pricing" className="bg-neuro-navy text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-neuro-navy-light transition-all transform hover:scale-105 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-neuro-orange" />
            <span className="font-black uppercase tracking-widest text-sm">Become a Member</span>
          </Link>
        )}
      </header>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Profile Views", value: dashboardData?.stats?.[0]?.value || "1,245", trend: dashboardData?.stats?.[0]?.trend || "+24%", icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Patient Leads", value: dashboardData?.stats?.[1]?.value || "42", trend: dashboardData?.stats?.[1]?.trend || "+12%", icon: UserPlus, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Seminar Clicks", value: dashboardData?.stats?.[2]?.value || "856", trend: dashboardData?.stats?.[2]?.trend || "+5%", icon: MousePointerClick, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Job Applications", value: dashboardData?.stats?.[3]?.value || "8", trend: dashboardData?.stats?.[3]?.trend || "0%", icon: Briefcase, color: "text-green-600", bg: "bg-green-50" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-neuro-orange/30 transition-all relative overflow-hidden">
            {!isMember && i > 0 && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-4">
                <Lock className="w-5 h-5 text-gray-300 mb-2" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">Member<br />Only</p>
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                 <stat.icon className="w-6 h-6" />
              </div>
              {isMember && (
                <span className="text-xs font-black text-green-500 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                   <TrendingUp className="w-3 h-3" /> {stat.trend}
                </span>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-neuro-navy">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed / Insights */}
        <div className="lg:col-span-2 space-y-8">
           {!isMember ? (
             <section className="bg-gradient-to-br from-neuro-navy to-neuro-navy-dark rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[100px] -mr-32 -mt-32"></div>
               <div className="relative z-10">
                 <h2 className="text-3xl font-heading font-black mb-4 leading-tight">Unlock the Full <span className="text-neuro-orange">NeuroChiro</span> Experience.</h2>
                 <p className="text-gray-300 mb-8 text-lg max-w-xl">
                   Join the global network of elite chiropractic clinics. List your practice, connect with top student talent, and access advanced clinical analytics.
                 </p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                   {[
                     "Public Directory Listing",
                     "Verified Doctor Badge",
                     "Unlimited Student Messaging",
                     "Advanced Job Matching",
                     "Discounted Seminar Promotion"
                   ].map((benefit, i) => (
                     <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                       <Sparkles className="w-4 h-4 text-neuro-orange" /> {benefit}
                     </div>
                   ))}
                 </div>
                 <Link href="/pricing" className="inline-block px-10 py-4 bg-white text-neuro-navy font-black rounded-2xl hover:bg-neuro-orange hover:text-white transition-all transform hover:scale-105 shadow-xl">
                   Apply for Membership
                 </Link>
               </div>
             </section>
           ) : (
             <>
               {/* New Onboarding Tracker */}
               <OnboardingTracker />

               {/* Smart Recommendations */}
               <section className="bg-neuro-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[80px] -mr-32 -mt-32"></div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-neuro-orange" />
                        <span className="text-xs font-black uppercase tracking-widest text-neuro-orange">Smart Recommendation</span>
                     </div>
                     <h3 className="text-2xl font-bold mb-2">Boost your Associate listing visibility.</h3>
                     <p className="text-gray-400 mb-6 max-w-lg">
                        {boosted 
                          ? "Listing successfully boosted! Your job is now appearing at the top of the student marketplace."
                          : "Applications for your 'Associate Chiropractor' role have slowed this week. Promoting this job could increase applicants by 3x."
                        }
                     </p>
                     <button 
                        onClick={handleBoost}
                        disabled={isBoosting || boosted}
                        className={cn(
                          "px-6 py-3 text-white font-black rounded-xl transition-all shadow-lg flex items-center gap-2",
                          boosted ? "bg-green-600 cursor-default" : "bg-neuro-orange hover:bg-neuro-orange-light active:scale-95"
                        )}
                     >
                        {isBoosting ? (
                          <>Boosting... <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                        ) : boosted ? (
                          <>Boost Active <ShieldCheck className="w-4 h-4" /></>
                        ) : (
                          <>Boost Job Listing <ArrowRight className="w-4 h-4" /></>
                        )}
                     </button>
                  </div>
               </section>

               {/* Weekly Engagement Insights (FOMO Hook) */}
               <section className="bg-gradient-to-br from-neuro-navy to-[#1a2634] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                     <Users className="w-32 h-32 text-white" />
                  </div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-6 text-neuro-orange">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Weekly Practice Pulse</span>
                     </div>
                     
                     <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-end gap-8">
                           <div className="space-y-1">
                              <p className="text-5xl font-black text-white">42</p>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">Patient Search Appearances</p>
                           </div>
                           <div className="h-12 w-px bg-white/10 hidden md:block mb-1"></div>
                           <div className="flex-1">
                              <p className="text-sm text-gray-300 font-medium leading-relaxed mb-4">
                                 Your profile was a <span className="font-bold text-neuro-orange underline underline-offset-4">Top 3 Result</span> for local patients this week.
                              </p>
                           </div>
                        </div>

                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
                           <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-gray-300">3 Student Profile Views</p>
                              <Link href="/pricing" className="text-[10px] font-black text-neuro-orange uppercase tracking-widest hover:underline">See who viewed you</Link>
                           </div>
                           <div className="flex -space-x-3">
                              {[1,2,3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-neuro-navy bg-gray-800 flex items-center justify-center text-[10px] font-black text-gray-500">
                                   ST
                                </div>
                              ))}
                              <div className="w-10 h-10 rounded-full border-2 border-neuro-navy bg-neuro-orange flex items-center justify-center text-[10px] font-black text-white">
                                 +Pro
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </section>

               {/* Geographic Traffic */}
               <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="font-heading font-black text-lg text-neuro-navy flex items-center gap-2">
                        <Globe className="w-5 h-5 text-gray-400" /> Patient Discovery Map
                     </h3>
                     <Link href="/doctor/analytics" className="text-xs font-bold text-neuro-orange hover:underline">View Full Report</Link>
                  </div>
                  <div className="aspect-[2/1] bg-neuro-navy rounded-3xl border border-gray-100 flex items-center justify-center relative overflow-hidden group">
                     {/* Dynamic Map Mockup */}
                     <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-98,38,3,0/800x400?access_token=MOCK')] bg-cover bg-center opacity-40"></div>
                     
                     {/* Animated Hotspots */}
                     <div className="absolute inset-0 z-10">
                        {[
                          { t: '30%', l: '40%', s: 1.2 },
                          { t: '50%', l: '60%', s: 0.8 },
                          { t: '45%', l: '25%', s: 1.5 },
                          { t: '65%', l: '45%', s: 1.0 },
                        ].map((pos, i) => (
                          <div 
                            key={i} 
                            className="absolute w-4 h-4 bg-neuro-orange rounded-full"
                            style={{ top: pos.t, left: pos.l, transform: `scale(${pos.s})` }}
                          >
                            <div className="absolute inset-0 bg-neuro-orange rounded-full animate-ping opacity-75"></div>
                            <div className="absolute -inset-4 bg-neuro-orange/20 rounded-full blur-xl"></div>
                          </div>
                        ))}
                     </div>

                     <div className="relative z-20 text-center bg-neuro-navy/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 group-hover:scale-105 transition-transform duration-500">
                        <p className="text-sm font-bold text-white mb-1">Live Patient Traffic</p>
                        <p className="text-[10px] text-neuro-orange font-black uppercase tracking-[0.2em]">Regional Density Mode</p>
                        <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/10 transition-all">
                           Switch to Heatmap
                        </button>
                     </div>
                  </div>
               </section>

               {/* Weekly Engagement Insights (FOMO Trigger) */}
               <section className="bg-gradient-to-br from-white to-gray-50 rounded-[2.5rem] border border-neuro-orange/20 p-8 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                     <Users className="w-32 h-32 text-neuro-navy" />
                  </div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-6">
                        <div className="px-3 py-1 bg-neuro-orange text-white text-[9px] font-black uppercase tracking-widest rounded-full">New Insight</div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Week of March 1st</span>
                     </div>
                     
                     <div className="flex flex-col md:flex-row md:items-end gap-8">
                        <div className="space-y-1">
                           <p className="text-4xl font-black text-neuro-navy">42</p>
                           <p className="text-sm font-bold text-gray-500 uppercase tracking-tight">Patient Search Appearances</p>
                        </div>
                        <div className="h-12 w-px bg-gray-200 hidden md:block mb-1"></div>
                        <div className="flex-1">
                           <p className="text-sm text-neuro-navy font-medium leading-relaxed mb-4">
                              Your profile was a <span className="font-bold text-neuro-orange">Top 3 Result</span> for patients searching in <span className="underline decoration-neuro-orange/30">West Los Angeles</span>.
                           </p>
                           {!isPro ? (
                              <Link href="/pricing" className="inline-flex items-center gap-2 text-xs font-black text-neuro-orange uppercase tracking-widest group/link">
                                 Upgrade to Pro to see who viewed you <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </Link>
                           ) : (
                              <Link href="/doctor/analytics" className="inline-flex items-center gap-2 text-xs font-black text-neuro-navy uppercase tracking-widest group/link">
                                 View Detailed Patient Personas <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </Link>
                           )}
                        </div>
                     </div>
                  </div>
               </section>

               {/* Exclusive Vendor Discounts Section */}
               <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="font-heading font-black text-lg text-neuro-navy flex items-center gap-2">
                        <Tag className="w-5 h-5 text-neuro-orange" /> Exclusive Vendor Discounts
                     </h3>
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pro Tier Benefit</span>
                  </div>

                  {!isPro && (
                     <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center mt-16">
                        <div className="w-12 h-12 bg-neuro-navy text-neuro-orange rounded-full flex items-center justify-center mb-4 shadow-lg">
                           <Lock className="w-6 h-6" />
                        </div>
                        <h4 className="text-xl font-black text-neuro-navy mb-2">Partner Benefits Locked</h4>
                        <p className="text-sm text-gray-500 max-w-md mb-6">Upgrade to the Pro Tier to unlock thousands of dollars in exclusive discounts on software, equipment, and services.</p>
                        <Link href="/pricing" className="px-6 py-3 bg-neuro-orange text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Upgrade to Pro</Link>
                     </div>
                  )}

                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${!isPro ? 'blur-[4px] grayscale pointer-events-none' : ''}`}>
                     {vendorOffers.map((offer, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col">
                           <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{offer.vendor}</h4>
                           <p className="text-base font-bold text-neuro-navy mb-4 flex-1">{offer.title}</p>
                           <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-center mb-4 shadow-sm">
                              <span className="text-sm font-mono font-black text-neuro-orange">{offer.code}</span>
                           </div>
                           <Link href={offer.link} className="w-full py-2 bg-neuro-navy text-white rounded-lg text-[10px] font-black uppercase tracking-widest text-center hover:bg-neuro-navy-light transition-colors">
                              Redeem Offer
                           </Link>
                        </div>
                     ))}
                  </div>
               </section>
             </>
           )}
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
           {/* Performance Comparison */}
           <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h3 className="font-heading font-black text-lg text-neuro-navy mb-6">Market Performance</h3>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between mb-2 text-xs font-bold">
                       <span className="text-neuro-navy">Profile Completeness</span>
                       <span className="text-green-500">Top 1%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500 w-[99%]"></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between mb-2 text-xs font-bold">
                       <span className="text-neuro-navy">Patient Reviews</span>
                       <span className="text-neuro-orange">Top 10%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-neuro-orange w-[90%]"></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between mb-2 text-xs font-bold">
                       <span className="text-neuro-navy">Student Engagement</span>
                       <span className="text-blue-500">Top 15%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 w-[85%]"></div>
                    </div>
                 </div>
              </div>
           </section>

           {/* Quick Actions */}
           <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h3 className="font-heading font-black text-lg text-neuro-navy mb-4">Command Center Actions</h3>
              <div className="space-y-3">
                 <Link href="/doctor/students" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                       <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-neuro-navy">Find Associate Talent</span>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest">Student Network</span>
                    </div>
                 </Link>
                 <Link href="/doctor/jobs" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-neuro-orange/10 flex items-center justify-center text-neuro-orange group-hover:bg-neuro-orange group-hover:text-white transition-colors">
                       <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-neuro-navy">Post New Job</span>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest">Recruiting</span>
                    </div>
                 </Link>
                 <Link href="/doctor/directory" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                       <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-neuro-navy">Send Patient Referral</span>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest">Global Directory</span>
                    </div>
                 </Link>
                 <Link href="/doctor/seminars" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                       <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-neuro-navy">Host a Seminar</span>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest">Event Management</span>
                    </div>
                 </Link>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
