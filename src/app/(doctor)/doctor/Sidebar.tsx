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
  Store,
  X
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDoctorTier } from "@/context/DoctorTierContext";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type DoctorTier = 'starter' | 'growth' | 'pro';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

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

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [tier, setTier] = useState<DoctorTier>('starter');

  useEffect(() => {
    const getProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
          if (profileData.tier) {
            const normalizedTier = profileData.tier.toLowerCase() as DoctorTier;
            setTier(['starter', 'growth', 'pro'].includes(normalizedTier) ? normalizedTier : 'starter');
          }
        }
      }
    };
    getProfile();
  }, []);

  const isAdmin = ['admin', 'founder', 'super_admin', 'regional_admin'].includes(profile?.role);
  const tierWeight: Record<DoctorTier, number> = { 
    starter: 1, 
    growth: 2, 
    pro: 3
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      const supabase = createClient();
      await supabase.auth.signOut();
      // Clear demo role cookie if it exists
      document.cookie = "nc_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/login");
      router.refresh();
    }
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "NC";
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-neuro-navy">
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
          const isLocked = tierWeight[tier] < tierWeight[item.minTier as DoctorTier];
          
          return (
            <div key={item.name} className="relative group">
              <Link
                href={isLocked ? "#" : item.href}
                onClick={() => {
                   if (!isLocked && onClose) onClose();
                }}
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

        {/* 🛡️ EMERGENCY ADMIN EXIT */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-white/5 px-2">
            <button
              onClick={() => {
                // Clear the cookie aggressively
                document.cookie = "nc_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
                // Hard redirect
                window.location.href = "/admin/dashboard";
              }}
              className="w-full flex items-center gap-3 px-3 py-2 bg-neuro-orange/10 text-neuro-orange rounded-lg hover:bg-neuro-orange/20 transition-all border border-neuro-orange/20"
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="font-bold text-sm">Admin Control</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
          </div>
        )}
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
            onClick={onClose}
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
              onClick={() => {
                setTier("growth");
                if (onClose) onClose();
              }}
              className="w-full py-2 bg-neuro-orange hover:bg-neuro-orange-light text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Join Growth
            </button>
          </div>
        ) : (
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Profile Visibility</span>
              <span className="text-[10px] font-bold text-neuro-orange">{tier === 'pro' ? '98%' : '75%'}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-neuro-orange rounded-full transition-all duration-500" style={{ width: tier === 'pro' ? '98%' : '75%' }}></div>
            </div>
            <p className="text-[9px] text-gray-500 mt-2 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> {tier === 'pro' ? 'Top 5% of clinics' : 'Growing presence'}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 px-3 py-3 border-t border-white/10 group/profile">
          <Link href="/doctor/profile" className="flex items-center gap-3 flex-1 min-w-0" onClick={onClose}>
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xs group-hover/profile:bg-neuro-orange transition-colors">
                {profile ? getInitials(profile.full_name) : "--"}
              </div>
              {tierWeight[tier] >= 2 && (
                <div className="absolute -top-1 -right-1 bg-neuro-orange rounded-full p-0.5 border border-neuro-navy">
                  <Star className="w-2 h-2 text-white fill-current" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate group-hover/profile:text-neuro-orange transition-colors">{profile?.full_name || "Loading..."}</p>
              <p className="text-[10px] text-gray-400 truncate flex items-center gap-1 capitalize">
                <ShieldCheck className="w-2 h-2 text-gray-500" />
                {tier} Member
              </p>
            </div>
          </Link>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 h-screen flex-col border-r border-white/10 shrink-0 relative overflow-y-auto">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-neuro-navy/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-64 h-full bg-neuro-navy flex flex-col shadow-2xl overflow-y-auto"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white z-50"
              >
                <X className="w-6 h-6" />
              </button>
              {SidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
