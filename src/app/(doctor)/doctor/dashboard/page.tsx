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
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getDoctorDashboardStats } from "./actions";
import OnboardingTracker from "@/components/doctor/OnboardingTracker";
import ProductTutorial from "@/components/dashboard/ProductTutorial";
import VerifiedBadge from "@/components/doctor/VerifiedBadge";
import AnnouncementsFeed from "@/components/dashboard/AnnouncementsFeed";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [isBoosting, setIsBoosting] = useState(false);
  const [boosted, setBoosted] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDoctorDashboardStats();
        if (data) {
          setDashboardData(data);
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
      <div className="min-h-dvh flex items-center justify-center bg-neuro-cream">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
      </div>
    );
  }

  return (
    <>
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy leading-tight">
            Practice Command Center
          </h1>
          <div className="text-neuro-gray mt-2 text-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Welcome back, <span className="font-bold text-neuro-orange">{dashboardData?.profile?.name || "Doctor"}</span>.</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Link href="/doctor/profile" className="bg-neuro-navy text-white px-6 py-4 rounded-2xl shadow-lg hover:bg-neuro-navy-light transition-all flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-neuro-orange" />
            <span className="font-black uppercase tracking-widest text-[10px]">Edit Profile</span>
          </Link>
          <Link href="/doctor/seminars" className="bg-neuro-orange text-white px-6 py-4 rounded-2xl shadow-lg hover:bg-neuro-orange-light transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="font-black uppercase tracking-widest text-[10px]">Post a Seminar</span>
          </Link>
        </div>
      </header>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Profile Views", value: dashboardData?.stats?.[0]?.value || "0", trend: dashboardData?.stats?.[0]?.trend || "0%", icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Patient Leads", value: dashboardData?.stats?.[1]?.value || "0", trend: dashboardData?.stats?.[1]?.trend || "0%", icon: UserPlus, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Seminar Clicks", value: dashboardData?.stats?.[2]?.value || "0", trend: dashboardData?.stats?.[2]?.trend || "0%", icon: MousePointerClick, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Job Applications", value: dashboardData?.stats?.[3]?.value || "0", trend: dashboardData?.stats?.[3]?.trend || "0%", icon: Briefcase, color: "text-green-600", bg: "bg-green-50" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-neuro-orange/30 transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                 <stat.icon className="w-6 h-6" />
              </div>
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
           <section className="bg-neuro-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[80px] -mr-32 -mt-32"></div>
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-neuro-orange" />
                    <span className="text-xs font-black uppercase tracking-widest text-neuro-orange">Account Status</span>
                 </div>
                 <h3 className="text-2xl font-bold mb-2 text-white">Your profile is currently active on the global directory.</h3>
                 <p className="text-gray-400 mb-6 max-w-lg">
                    Ensure your clinic details, techniques, and specialties are up to date to maximize your visibility to patients and students.
                 </p>
                 <Link 
                    href="/doctor/profile"
                    className="inline-flex px-8 py-4 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all transform hover:scale-105 flex items-center gap-3 shadow-xl shadow-neuro-orange/20 uppercase tracking-widest text-xs"
                 >
                    Update Profile <ArrowRight className="w-4 h-4" />
                 </Link>
              </div>
           </section>

           {/* Quick Actions Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/doctor/directory" className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:border-neuro-orange transition-all group">
                 <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Globe className="w-6 h-6" />
                 </div>
                 <h4 className="text-lg font-black text-neuro-navy mb-2">Global Directory</h4>
                 <p className="text-sm text-gray-500">Search for other doctors, send referrals, and manage your network.</p>
              </Link>
              <Link href="/doctor/seminars" className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:border-neuro-orange transition-all group">
                 <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Calendar className="w-6 h-6" />
                 </div>
                 <h4 className="text-lg font-black text-neuro-navy mb-2">Seminar Hub</h4>
                 <p className="text-sm text-gray-500">Post upcoming events, seminars, or workshops for the NeuroChiro community.</p>
              </Link>
           </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
           <AnnouncementsFeed audience="doctor" />

           {/* Quick Stats Card */}
           <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h3 className="font-heading font-black text-lg text-neuro-navy mb-6">Clinic Performance</h3>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between mb-2 text-xs font-bold">
                       <span className="text-neuro-navy">Profile Views</span>
                       <span className="text-neuro-orange">{dashboardData?.stats?.[0]?.value || "0"}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-neuro-orange" style={{ width: '100%' }}></div>
                    </div>
                 </div>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
                    Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                 </p>
              </div>
           </section>
        </div>
      </div>
    </>
  );
}
