"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Search, 
  Users, 
  Calendar, 
  Briefcase, 
  User, 
  LogOut,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Star,
  BarChart3,
  Network,
  Lock,
  Store
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState } from "react";
import { useDoctorTier } from "@/context/DoctorTierContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type DoctorTier = "starter" | "growth" | "pro";

const navItems = [
  { name: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard, minTier: "starter" },
  { name: "Practice ROI", href: "/doctor/analytics", icon: BarChart3, minTier: "starter" },
  { name: "Referral Network", href: "/doctor/directory", icon: Network, minTier: "starter" },
  { name: "Tools & Partners", href: "/marketplace", icon: Store, minTier: "starter" },
  { name: "Talent Command", href: "/doctor/students", icon: Users, minTier: "growth" },
  { name: "Seminar Hub", href: "/doctor/seminars", icon: Calendar, minTier: "growth" },
  { name: "Recruiting", href: "/doctor/jobs", icon: Briefcase, minTier: "growth" },
  { name: "Practice Profile", href: "/doctor/profile", icon: User, minTier: "starter" },
];

const eliteItems = [
  { name: "The Mastermind", href: "https://www.neurochiromastermind.com", icon: Star, highlight: "text-purple-400" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { tier, setTier } = useDoctorTier();

  const tierWeight = { starter: 1, growth: 2, pro: 3 };

  return (
    <aside className="hidden md:flex w-64 h-screen bg-neuro-navy flex-col border-r border-white/10 shrink-0 relative overflow-y-auto">
      {/* Dev Toggle - Only visible on desktop or when sidebar is visible */}
      <div className="absolute -right-20 top-40 -rotate-90 origin-left z-50">
        <div className="bg-neuro-orange p-1 rounded-t-lg flex gap-1 border-x border-t border-white/20 shadow-2xl">
          {(["starter", "growth", "pro"] as DoctorTier[]).map((t) => (
            <button 
              key={t}
              onClick={() => setTier(t)}
              className={cn(
                "text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter transition-colors",
                tier === t ? "bg-white text-neuro-orange" : "text-white hover:bg-white/10"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neuro-orange flex items-center justify-center font-bold text-white text-xl">N</div>
          <span className="text-white font-heading font-bold text-xl tracking-tight">NeuroChiro</span>
        </Link>
      </div>

      <nav className="px-4 space-y-1">
        <div className="mb-4 px-2 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Doctor <span className="text-neuro-orange">{tier}</span>
          </span>
          {tierWeight[tier] >= 2 && <Zap className="w-3 h-3 text-neuro-orange fill-neuro-orange" />}
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isLocked = tierWeight[tier as DoctorTier] < tierWeight[item.minTier as DoctorTier];
          
          return (
            <div key={item.name} className="relative group">
              <Link
                href={isLocked ? "#" : item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-neuro-orange text-white" 
                    : isLocked 
                      ? "text-gray-600 cursor-not-allowed" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : isLocked ? "text-gray-700" : "text-gray-400 group-hover:text-neuro-orange-light")} />
                <span className="font-medium text-sm">{item.name}</span>
                {isLocked && <Lock className="w-3 h-3 ml-auto text-gray-700" />}
                {isActive && !isLocked && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
              
              {isLocked && (
                <div className="absolute left-full ml-2 top-0 bg-neuro-navy border border-white/10 p-3 rounded-xl shadow-2xl w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  <p className="text-[10px] font-bold text-white mb-1">Unlock {item.name}</p>
                  <p className="text-[9px] text-gray-400">Available on <span className="text-neuro-orange uppercase">{item.minTier}</span> tier and above.</p>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Elite Programs Section */}
      <nav className="mt-8 px-4 space-y-1">
        <div className="mb-4 px-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Elite Programs</span>
        </div>
        {eliteItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5"
          >
            <item.icon className={cn("w-5 h-5", item.highlight)} />
            <span className="font-medium text-sm">{item.name}</span>
            <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        {tier === "starter" ? (
          <div className="bg-gradient-to-br from-neuro-navy-light to-neuro-navy p-4 rounded-xl border border-white/10 shadow-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-neuro-orange/20 rounded-md">
                <Sparkles className="w-4 h-4 text-neuro-orange" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Upgrade Plan</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              List your clinic publicly and unlock full recruiting tools.
            </p>
            <button 
              onClick={() => setTier("growth")}
              className="w-full py-2 bg-neuro-orange hover:bg-neuro-orange-light text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Join Growth
            </button>
          </div>
        ) : (
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Profile Visibility</span>
              <span className="text-[10px] font-bold text-neuro-orange">{tier === "pro" ? '98%' : '75%'}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-neuro-orange rounded-full transition-all duration-500" style={{ width: tier === "pro" ? '98%' : '75%' }}></div>
            </div>
            <p className="text-[9px] text-gray-500 mt-2 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> {tier === "pro" ? 'Top 5% of clinics' : 'Growing presence'}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 px-3 py-3 border-t border-white/10">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xs">
              DN
            </div>
            {tierWeight[tier] >= 2 && (
              <div className="absolute -top-1 -right-1 bg-neuro-orange rounded-full p-0.5 border border-neuro-navy">
                <Star className="w-2 h-2 text-white fill-current" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Dr. Natalie West</p>
            <p className="text-[10px] text-gray-400 truncate flex items-center gap-1 capitalize">
              <ShieldCheck className="w-2 h-2 text-gray-500" />
              {tier} Member
            </p>
          </div>
          <button className="text-gray-400 hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
