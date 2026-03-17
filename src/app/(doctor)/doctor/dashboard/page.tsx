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
  Loader2,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useDoctorTier } from "@/context/DoctorTierContext";
import { getDoctorDashboardStats } from "./actions";
import OnboardingTracker from "@/components/doctor/OnboardingTracker";
import ProductTutorial from "@/components/dashboard/ProductTutorial";
import VerifiedBadge from "@/components/doctor/VerifiedBadge";
import AnnouncementsFeed from "@/components/dashboard/AnnouncementsFeed";
import UpgradeOverlay from "@/components/dashboard/UpgradeOverlay";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { tier, isMember, isGrowth: contextIsGrowth, isPro: contextIsPro } = useDoctorTier();
  const [isBoosting, setIsBoosting] = useState(false);
  const [boosted, setBoosted] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showHeatmapUpgrade, setShowHeatmapUpgrade] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDoctorDashboardStats();
        if (data) {
          setDashboardData(data);
          // 🛡️ AUTH LOOP: Redirect to Profile Editor if incomplete (< 20%)
          const completeness = data.marketPerformance?.completeness ?? 0;
          if (completeness < 20) {
            router.push('/doctor/profile?welcome=true');
          }
        } else {
          setDashboardData({ 
            profile: { name: "Doctor", clinicName: "Practice", isMember: false, isPro: false, isGrowth: false },
            stats: [],
            vendorOffers: [],
            marketPerformance: { completeness: 0, reviews: 0, engagement: 0 }
          });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setDashboardData({
          profile: { name: "Doctor", clinicName: "Practice", isMember: false, isPro: false, isGrowth: false },
          stats: [],
          vendorOffers: [],
          marketPerformance: { completeness: 85, reviews: 90, engagement: 75 }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasAccess = isMember || dashboardData?.profile?.isMember;
  const isPro = contextIsPro || dashboardData?.profile?.isPro;
  const isGrowth = contextIsGrowth || dashboardData?.profile?.isGrowth;
  const vendorOffers = dashboardData?.vendorOffers || [];

  const handleBoost = () => {
    setIsBoosting(true);
    setTimeout(() => {
      setIsBoosting(false);
      setBoosted(true);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neuro-cream">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <ProductTutorial />
      {/* Welcome & Global Stats */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy leading-tight">
            {hasAccess ? "Practice Command Center" : "Doctor Dashboard"}
          </h1>
          <div className="text-neuro-gray mt-2 text-lg">
            {hasAccess ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span>Live insights for <span className="font-bold text-neuro-orange">{dashboardData?.profile?.clinicName || "My Practice"}</span>.</span>
                <span className="px-3 py-1 bg-neuro-orange/10 text-neuro-orange text-[10px] font-black uppercase tracking-widest rounded-full border border-neuro-orange/20">
                  {tier} Tier Active
                </span>
              </div>
            ) : (
              "Non-Member Portal • Practice Visibility: Limited"
            )}
          </div>
        </div>
        
        {hasAccess ? (
          <div className="flex flex-wrap gap-4">
            <Link href="/host-a-seminar" className="bg-neuro-orange text-white px-6 py-4 rounded-2xl shadow-lg hover:bg-neuro-orange-light transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="font-black uppercase tracking-widest text-[10px]">List a Seminar</span>
            </Link>
            <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Visibility</span>
              <span className="text-2xl font-black text-neuro-navy">
                {tier === 'starter' ? 'Basic' : tier === 'growth' ? 'Enhanced' : 'Top 5%'}
              </span>
            </div>
            {tier !== 'starter' && (
              <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Opt Score</span>
                <span className="text-2xl font-black text-neuro-orange">98/100</span>
              </div>
            )}
            {tier !== 'pro' && (
              <Link href="/pricing" className="bg-neuro-navy text-white px-6 py-4 rounded-2xl shadow-lg hover:bg-neuro-navy-light transition-all flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-neuro-orange" />
                <span className="font-black uppercase tracking-widest text-[10px]">Upgrade to {tier === 'starter' ? 'Growth' : 'Pro'}</span>
              </Link>
            )}
          </div>
        ) : (
          <Link href="/pricing" className="bg-neuro-navy text-white px-6 md:px-8 py-4 rounded-2xl shadow-xl hover:bg-neuro-navy-light transition-all transform hover:scale-105 flex items-center gap-3 whitespace-nowrap">
            <Sparkles className="w-5 h-5 text-neuro-orange" />
            <span className="font-black uppercase tracking-widest text-xs md:text-sm">Become a Member</span>
          </Link>
        )}
      </header>

      {/* Trust & Authority Badge (Backlink Loop) */}
      {hasAccess && (
        <VerifiedBadge 
          doctorSlug={dashboardData?.profile?.slug || "profile"} 
          doctorName={dashboardData?.profile?.name || "Doctor"} 
          tier={tier}
        />
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Profile Views", 
            value: dashboardData?.stats?.[0]?.value || "0", 
            trend: dashboardData?.stats?.[0]?.trend || "0%", 
            icon: Eye, 
            color: "text-blue-600", 
            bg: "bg-blue-50",
            isPotential: dashboardData?.stats?.[0]?.value === "---"
          },
          { 
            label: "Patient Leads", 
            value: dashboardData?.stats?.[1]?.value || "0", 
            trend: dashboardData?.stats?.[1]?.trend || "0%", 
            icon: UserPlus, 
            color: "text-purple-600", 
            bg: "bg-purple-50",
            isPotential: dashboardData?.stats?.[1]?.value === "---"
          },
          { label: "Seminar Clicks", value: dashboardData?.stats?.[2]?.value || "0", trend: dashboardData?.stats?.[2]?.trend || "0%", icon: MousePointerClick, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Job Applications", value: dashboardData?.stats?.[3]?.value || "0", trend: dashboardData?.stats?.[3]?.trend || "0%", icon: Briefcase, color: "text-green-600", bg: "bg-green-50" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-neuro-orange/30 transition-all relative overflow-hidden">
            {!hasAccess && i > 0 && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-4">
                <Lock className="w-5 h-5 text-gray-300 mb-2" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">Member<br />Only</p>
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                 <stat.icon className="w-6 h-6" />
              </div>
              {hasAccess && (
                <span className="text-xs font-black text-green-500 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                   <TrendingUp className="w-3 h-3" /> {stat.trend}
                </span>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-neuro-navy">{stat.value}</p>
                {('isPotential' in stat && stat.isPotential) && (
                  <span className="text-[9px] font-black text-neuro-orange uppercase tracking-widest">Potential</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {('isPotential' in stat && stat.isPotential) 
                  ? "Average for optimized clinics" 
                  : "Last 30 days"
                }
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed / Insights */}
        <div className="lg:col-span-2 space-y-8">
           {!hasAccess ? (
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
               {/* Onboarding Tracker */}
               <OnboardingTracker />

               {/* Smart Recommendations */}
               <section className="bg-neuro-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[80px] -mr-32 -mt-32"></div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-neuro-orange" />
                        <span className="text-xs font-black uppercase tracking-widest text-neuro-orange">Smart Recommendation</span>
                     </div>
                     {(dashboardData?.marketPerformance?.completeness || 0) < 80 ? (
                        <>
                           <h3 className="text-2xl font-bold mb-2 text-white">Your profile is currently hidden from 85% of local searches.</h3>
                           <p className="text-gray-400 mb-6 max-w-lg">
                              Complete your "Conversion Engine" setup to start appearing in patient search results. Adding 3 clinic photos increases reach by 30%.
                           </p>
                           <Link 
                              href="/doctor/profile"
                              className="inline-flex px-8 py-4 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all transform hover:scale-105 flex items-center gap-3 shadow-xl shadow-neuro-orange/20 uppercase tracking-widest text-xs"
                           >
                              Fix Profile Now <ArrowRight className="w-4 h-4" />
                           </Link>
                        </>
                     ) : (
                        <>
                           <h3 className="text-2xl font-bold mb-2 text-white">Boost your Associate listing visibility.</h3>
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
                        </>
                     )}
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
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Pulse</span>
                     </div>
                     
                     <div className="flex flex-col md:flex-row md:items-end gap-8">
                        <div className="space-y-1">
                           <p className="text-4xl font-black text-neuro-navy">{dashboardData?.stats?.[1]?.value || "0"}</p>
                           <p className="text-sm font-bold text-gray-500 uppercase tracking-tight">Active Patient Leads</p>
                        </div>
                        <div className="h-12 w-px bg-gray-200 hidden md:block mb-1"></div>
                        <div className="flex-1">
                           {!isPro ? (
                              <div className="space-y-3">
                                 <p className="text-sm text-neuro-navy font-medium leading-relaxed">
                                    <span className="font-bold text-neuro-orange">14 People</span> in {dashboardData?.doctor?.city || "your city"} are currently looking for a Nervous System Specialist.
                                 </p>
                                 <Link href="/pricing" className="inline-flex items-center gap-2 text-[10px] font-black text-neuro-orange uppercase tracking-widest hover:underline group/bribe">
                                    <Zap className="w-3 h-3 fill-neuro-orange" /> Upgrade to Growth to appear at the top of their search <ChevronRight className="w-4 h-4 group-hover/bribe:translate-x-1 transition-transform" />
                                 </Link>
                              </div>
                           ) : (
                              <>
                                 <p className="text-sm text-neuro-navy font-medium leading-relaxed mb-4">
                                    Your practice is currently performing <span className="font-bold text-neuro-orange">above average</span> for your region. 
                                 </p>
                                 <Link href="/doctor/analytics" className="inline-flex items-center gap-2 text-xs font-black text-neuro-navy uppercase tracking-widest group/link">
                                    View Detailed Performance Reports <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                 </Link>
                              </>
                           )}
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
                     {/* Map Background */}
                     <div className="absolute inset-0 bg-[#0A0D14]">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                     </div>
                     
                     <div className="relative z-20 text-center bg-neuro-navy/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 group-hover:scale-105 transition-transform duration-500">
                        {showHeatmapUpgrade && !isPro ? (
                           <div className="animate-in fade-in zoom-in duration-300">
                              <p className="text-xs font-black text-neuro-orange uppercase tracking-widest mb-2">Pro Feature Required</p>
                              <Link href="/pricing?upgrade=pro" className="px-4 py-2 bg-neuro-orange text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">Upgrade to Elite Pro</Link>
                           </div>
                        ) : (
                           <>
                              <p className="text-sm font-bold text-white mb-1">Live Patient Traffic</p>
                              <p className="text-[10px] text-neuro-orange font-black uppercase tracking-[0.2em]">Regional Density Mode</p>
                              <button 
                                onClick={() => {
                                   if (!isPro) setShowHeatmapUpgrade(true);
                                   else window.location.href = '/doctor/analytics';
                                }}
                                className="inline-block mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/10 transition-all"
                              >
                                 Switch to Heatmap
                              </button>
                           </>
                        )}
                     </div>
                  </div>
               </section>

               {/* Exclusive Vendor Discounts Section */}
               <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="font-heading font-black text-lg text-neuro-navy flex items-center gap-2">
                        <Tag className="w-5 h-5 text-neuro-orange" /> Exclusive Vendor Discounts
                     </h3>
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Partner Rewards</span>
                  </div>

                  {!isPro && (
                     <UpgradeOverlay 
                        title="Partner Benefits Locked"
                        description="Upgrade to the Pro Tier to unlock thousands of dollars in exclusive discounts on software, equipment, and services."
                        tierRequired="pro"
                     />
                  )}

                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${!isPro ? 'blur-[4px] grayscale pointer-events-none' : ''}`}>
                     {vendorOffers.length > 0 ? vendorOffers.map((offer: any, i: number) => (
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
                     )) : (
                        // Mock UI for the blurred background if no data (SSR gated)
                        [1,2,3].map((_, i) => (
                           <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col opacity-50">
                              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                              <div className="h-6 w-full bg-gray-200 rounded mb-4"></div>
                              <div className="h-10 w-full bg-white rounded border border-gray-200 mb-4"></div>
                              <div className="h-10 w-full bg-gray-200 rounded"></div>
                           </div>
                        ))
                     )}
                  </div>
               </section>
             </>
           )}
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
           <AnnouncementsFeed audience="doctor" />

           {/* Market Performance */}
           <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h3 className="font-heading font-black text-lg text-neuro-navy mb-6">Market Performance</h3>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between mb-2 text-xs font-bold">
                       <span className="text-neuro-navy">Profile Completeness</span>
                       <span className="text-green-500">Top {100 - (dashboardData?.marketPerformance?.completeness || 0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500" style={{ width: `${dashboardData?.marketPerformance?.completeness || 0}%` }}></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between mb-2 text-xs font-bold">
                       <span className="text-neuro-navy">Patient Reviews</span>
                       <span className="text-neuro-orange">Top {100 - (dashboardData?.marketPerformance?.reviews || 0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-neuro-orange" style={{ width: `${dashboardData?.marketPerformance?.reviews || 0}%` }}></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between mb-2 text-xs font-bold">
                       <span className="text-neuro-navy">Student Engagement</span>
                       <span className="text-blue-500">Top {100 - (dashboardData?.marketPerformance?.engagement || 0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{ width: `${dashboardData?.marketPerformance?.engagement || 0}%` }}></div>
                    </div>
                 </div>
              </div>
           </section>

           {/* Quick Actions */}
           <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h3 className="font-heading font-black text-lg text-neuro-navy mb-4">Command Center Actions</h3>
              <div className="space-y-3">
                 <div className="relative">
                    {!isGrowth && (
                       <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-end pr-4 pointer-events-none">
                          <Lock className="w-3 h-3 text-gray-400" />
                       </div>
                    )}
                    <Link 
                       href={isGrowth ? "/doctor/students" : "/pricing?upgrade=growth"} 
                       className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-colors group",
                          isGrowth ? "hover:bg-gray-50" : "opacity-60 cursor-not-allowed"
                       )}
                    >
                       <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          isGrowth ? "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" : "bg-gray-100 text-gray-400"
                       )}>
                          <Search className="w-4 h-4" />
                       </div>
                       <div>
                         <span className="block text-sm font-bold text-neuro-navy">Find Associate Talent</span>
                         <span className="block text-[10px] text-gray-500 uppercase tracking-widest">
                            {isGrowth ? "Student Network" : "Growth Required"}
                         </span>
                       </div>
                    </Link>
                 </div>
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
                 <Link href="/host-a-seminar" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group">
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
