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
  Lock,
  X
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useStudentTier, StudentTier } from "@/context/StudentTierContext";
import { motion, AnimatePresence } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
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

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
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

  const SidebarContent = (
    <div className="flex flex-col h-full bg-neuro-navy">
      {/* Dev Toggle - Only visible on desktop or when sidebar is visible */}
      <div className="absolute -right-12 top-1/2 -rotate-90 origin-left z-50 hidden md:block">
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
              onClick={onClose}
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
          const isLocked = item.minTier === "Accelerator" ? !isAccelerator : !isProfessional;
          
          return (
            <Link
              key={item.name}
              href={isLocked ? "/pricing" : item.href}
              onClick={() => {
                if (!isLocked && onClose) onClose();
              }}
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
        {!isAccelerator ? (
          <div className="bg-gradient-to-br from-neuro-navy-light to-neuro-navy p-4 rounded-xl border border-white/10 shadow-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-neuro-orange/20 rounded-md">
                <Sparkles className="w-4 h-4 text-neuro-orange" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Upgrade Path</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              {tier === "Free" && "Unlock scan tracking, job applications, and mentorship."}
              {tier === "Foundation" && "Unlock clinical modules and elite track roadmap."}
              {tier === "Professional" && "Unlock the final tier: Elite associate mentorship."}
            </p>
            <Link 
              href="/pricing"
              onClick={onClose}
              className="w-full py-2 bg-neuro-orange hover:bg-neuro-orange-light text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {tier === "Free" ? "Start Foundation" : `Upgrade to ${tier === "Foundation" ? "Professional" : "Accelerator"}`}
            </Link>
          </div>
        ) : (
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
             <p className="text-[10px] font-black text-neuro-orange uppercase mb-2">{tier} Active</p>
             <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">Experience the full power of the NeuroChiro platform.</p>
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
