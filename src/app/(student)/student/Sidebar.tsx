"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  GraduationCap, 
  Calendar, 
  Briefcase, 
  MapPin, 
  User, 
  LogOut,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Star,
  Trophy,
  Lock
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useStudentTier, StudentTier } from "@/context/StudentTierContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const mainNavItems = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Seminar Hub", href: "/student/seminars", icon: Calendar },
  { name: "Opportunities", href: "/student/jobs", icon: Briefcase },
  { name: "Career Map", href: "/student/clinics", icon: MapPin },
  { name: "My Identity", href: "/student/profile", icon: User },
];

const careerToolItems = [
  { name: "Contract Lab", href: "/student/contract-lab", icon: ShieldCheck, minTier: "Accelerator" },
  { name: "Interview Prep", href: "/student/interview-prep", icon: Sparkles, minTier: "Professional" },
  { name: "Offer Evaluation", href: "/student/offer-evaluation", icon: Briefcase, minTier: "Accelerator" },
  { name: "Negotiation Guide", href: "/student/negotiation-guide", icon: Star, minTier: "Professional" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { tier, setTier, isFoundation, isProfessional, isAccelerator } = useStudentTier();

  const getTierIcon = (t: StudentTier) => {
    switch(t) {
      case "Accelerator": return <Sparkles className="w-3 h-3 text-neuro-orange fill-neuro-orange" />;
      case "Professional": return <Zap className="w-3 h-3 text-neuro-orange fill-neuro-orange" />;
      case "Foundation": return <Trophy className="w-3 h-3 text-neuro-orange fill-neuro-orange" />;
      default: return null;
    }
  };

  return (
    <aside className="hidden md:flex w-64 h-screen bg-neuro-navy flex-col border-r border-white/10 shrink-0 relative overflow-y-auto">
      {/* Dev Toggle - Only visible on desktop or when sidebar is visible */}
      <div className="absolute -right-12 top-1/2 -rotate-90 origin-left z-50">
        <button 
          onClick={() => {
            const tiers: StudentTier[] = ["Free", "Foundation", "Professional", "Accelerator"];
            const nextIndex = (tiers.indexOf(tier) + 1) % tiers.length;
            setTier(tiers[nextIndex]);
          }}
          className="bg-neuro-orange text-white text-[10px] font-black px-3 py-1 rounded-t-lg shadow-xl uppercase tracking-widest border-x border-t border-white/20"
        >
          Tier: {tier}
        </button>
      </div>

      <div className="p-6 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neuro-orange flex items-center justify-center font-bold text-white text-xl">N</div>
          <span className="text-white font-heading font-bold text-xl tracking-tight">NeuroChiro</span>
        </Link>
      </div>

      <nav className="px-4 space-y-1 mb-8 shrink-0">
        <div className="mb-4 px-2 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Student {tier}</span>
          {getTierIcon(tier)}
        </div>
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-neuro-orange text-white" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400 group-hover:text-neuro-orange-light")} />
              <span className="font-medium text-sm">{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <nav className="px-4 space-y-1 mb-8 shrink-0">
        <div className="mb-4 px-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Career Tools</span>
        </div>
        {careerToolItems.map((item) => {
          const isActive = pathname === item.href;
          const isLocked = (item.minTier === "Professional" && !isProfessional) || (item.minTier === "Accelerator" && !isAccelerator);
          
          return (
            <Link
              key={item.name}
              href={isLocked ? "/pricing" : item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? "bg-white/10 text-white" 
                  : "text-gray-400 hover:text-white hover:bg-white/5",
                isLocked && "opacity-50"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-neuro-orange" : "text-gray-400 group-hover:text-neuro-orange-light")} />
              <span className="font-medium text-sm">{item.name}</span>
              {isLocked && <Lock className="w-3 h-3 ml-auto text-neuro-orange" />}
              {isActive && !isLocked && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto shrink-0">
        {tier === "Free" ? (
          <div className="bg-gradient-to-br from-neuro-navy-light to-neuro-navy p-4 rounded-xl border border-white/10 shadow-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-neuro-orange/20 rounded-md">
                <Sparkles className="w-4 h-4 text-neuro-orange" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Upgrade Path</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              Unlock scan tracking, job applications, and mentorship.
            </p>
            <Link 
              href="/pricing"
              className="w-full py-2 bg-neuro-orange hover:bg-neuro-orange-light text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Start Foundation
            </Link>
          </div>
        ) : tier === "Foundation" ? (
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
            <p className="text-[10px] font-black text-neuro-orange uppercase mb-2">Foundation Active</p>
            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              Upgrade to Professional to apply for jobs and message clinics.
            </p>
            <Link href="/pricing" className="block w-full py-2 bg-neuro-navy text-white text-center text-xs font-black uppercase tracking-widest border border-white/10 rounded-lg hover:bg-white/10 transition-all">Go Professional</Link>
          </div>
        ) : tier === "Professional" ? (
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Career Readiness</span>
              <span className="text-[10px] font-bold text-neuro-orange">85%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-neuro-orange rounded-full" style={{ width: '85%' }}></div>
            </div>
            <Link href="/pricing" className="block text-[9px] text-neuro-orange mt-2 hover:underline">Go Accelerator for Priority Matching</Link>
          </div>
        ) : (
          <div className="bg-neuro-orange/10 p-4 rounded-xl border border-neuro-orange/20 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-neuro-orange fill-neuro-orange" />
              <span className="text-xs font-black text-white uppercase tracking-wider">Accelerator Active</span>
            </div>
            <p className="text-[10px] text-gray-400">You have priority access to all elite clinical placements.</p>
          </div>
        )}

        <div className="flex items-center gap-3 px-3 py-3 border-t border-white/10">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xs">
              RN
            </div>
            {isFoundation && (
              <div className="absolute -top-1 -right-1 bg-neuro-orange rounded-full p-0.5 border border-neuro-navy">
                <Star className="w-2 h-2 text-white fill-current" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Raymond Nichols</p>
            <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
              <ShieldCheck className="w-2 h-2 text-gray-500" />
              Student {tier}
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
