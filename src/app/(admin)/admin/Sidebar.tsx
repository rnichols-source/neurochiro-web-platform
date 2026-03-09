"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  ShieldAlert, 
  Globe, 
  Settings,
  LogOut,
  ChevronRight,
  Database,
  BarChart3,
  Activity,
  AppWindow,
  Megaphone,
  CreditCard,
  MessageSquare,
  History,
  X
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "System Control", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Talent Intelligence", href: "/admin/users", icon: Users },
  { name: "Programs & LMS", href: "/admin/programs", icon: GraduationCap },
  { name: "Moderation", href: "/admin/moderation", icon: ShieldAlert },
  { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { name: "Regions & Licensing", href: "/admin/regions", icon: Globe },
  { name: "Revenue & Payments", href: "/admin/revenue", icon: CreditCard },
  { name: "Communication", href: "/admin/inbox", icon: MessageSquare },
  { name: "System Logs", href: "/admin/logs", icon: History },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 w-64 h-screen bg-[#0F172A] flex flex-col border-r border-white/5 shrink-0 z-[200] transition-transform duration-300 transform",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neuro-orange flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-neuro-orange/20">N</div>
            <div className="flex flex-col">
              <span className="text-white font-heading font-bold text-lg leading-none">NeuroChiro</span>
              <span className="text-neuro-orange text-[10px] font-black uppercase tracking-widest mt-1">Admin OS</span>
            </div>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="mb-4 px-2">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Platform Control</span>
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group",
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

      <div className="p-4 mt-auto">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">System Health</span>
            <span className="text-[10px] font-bold text-green-500">OPTIMAL</span>
          </div>
          <div className="flex gap-1">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-4 w-full bg-green-500/20 rounded-sm overflow-hidden relative">
                <div className="absolute inset-0 bg-green-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-3 border-t border-white/5">
          <div className="w-8 h-8 rounded-full bg-neuro-navy-light flex items-center justify-center text-white font-bold text-xs border border-white/10">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Super Admin</p>
            <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
              <Activity className="w-2 h-2 text-green-500" />
              Global Access
            </p>
          </div>
          <button className="text-gray-500 hover:text-white">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
