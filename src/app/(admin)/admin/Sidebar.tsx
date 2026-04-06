"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  X,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Mail,
  Stethoscope,
  Tag
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getSystemHealth, logoutAdmin, triggerEmergencyLockdown } from "./SidebarActions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Full set of nav items
const allNavItems = [
  { name: "System Control", href: "/admin/dashboard", icon: LayoutDashboard, roles: ['super_admin', 'founder', 'admin'] },
  { name: "Talent Intelligence", href: "/admin/users", icon: Users, roles: ['super_admin', 'founder', 'admin', 'regional_admin'] },
  { name: "Clinical Directory", href: "/admin/directory", icon: Stethoscope, roles: ['super_admin', 'founder', 'admin'] },
  { name: "Programs & LMS", href: "/admin/programs", icon: GraduationCap, roles: ['super_admin', 'founder', 'admin'] },
  { name: "Marketplace", href: "/admin/marketplace", icon: Tag, roles: ['super_admin', 'founder', 'admin'] },
  { name: "Moderation", href: "/admin/moderation", icon: ShieldAlert, roles: ['super_admin', 'founder', 'admin', 'support_admin'] },
  { name: "Seminar Approvals", href: "/admin/approvals/seminars", icon: ShieldCheck, roles: ['super_admin', 'founder', 'admin'] },
  { name: "Announcements", href: "/admin/announcements", icon: Megaphone, roles: ['super_admin', 'founder', 'admin'] },
  { name: "Broadcasts", href: "/admin/broadcasts", icon: Mail, roles: ['super_admin', 'founder', 'admin'] },
  { name: "Regions & Licensing", href: "/admin/regions", icon: Globe, roles: ['super_admin', 'founder', 'admin'] },
  { name: "Revenue & Payments", href: "/admin/revenue", icon: CreditCard, roles: ['super_admin', 'founder', 'admin'] },
  { name: "Communication", href: "/admin/inbox", icon: MessageSquare, roles: ['super_admin', 'founder', 'admin', 'support_admin', 'regional_admin'] },
  { name: "System Logs", href: "/admin/logs", icon: History, roles: ['super_admin', 'founder', 'admin'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsOpen: () => void;
}

import { createClient } from "@/lib/supabase";
import { isFounderEmail } from "@/lib/founder";

export default function Sidebar({ isOpen, onClose, onSettingsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // States
  const [health, setHealth] = useState<any>(null);
  const [userRole, setUserRole] = useState('super_admin'); 
  const [isLockingDown, setIsLockingDown] = useState(false);

  // Filter items based on role
  const filteredNavItems = allNavItems.filter(item => {
    const baseRole = userRole.split(':')[0];
    return item.roles.includes(baseRole) || item.roles.includes(userRole);
  });

  // Fetch real role and health data
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        let role = profile?.role || 'admin';
        // 🛡️ MASTER FOUNDER OVERRIDE
        if (isFounderEmail(user.email)) {
          role = 'founder';
        }
        setUserRole(role);
      }

      const healthData = await getSystemHealth();
      setHealth(healthData);
    }
    
    loadData();
    const interval = setInterval(async () => {
      const data = await getSystemHealth();
      setHealth(data);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out of Admin OS?")) {
      await logoutAdmin();
      // Clear demo role cookie if it exists
      document.cookie = "nc_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push('/login');
      router.refresh();
    }
  };

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
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-neuro-orange flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-neuro-orange/20 group-hover:scale-110 transition-transform">N</div>
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

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pt-4">
          <div className="mb-4 px-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Platform Control</span>
          </div>
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-neuro-orange text-white shadow-lg shadow-neuro-orange/20" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-gray-400 group-hover:text-neuro-orange-light")} />
                <span className="font-medium text-sm">{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto space-y-4">
          {/* System Health Panel */}
          <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-neuro-orange" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Engine</span>
              </div>
              <span className={cn(
                "text-[9px] font-black px-2 py-0.5 rounded border",
                health?.status === 'OPTIMAL' ? "text-green-500 border-green-500/20 bg-green-500/10" : "text-amber-500 border-amber-500/20 bg-amber-500/10"
              )}>
                {health?.status || "SYNCING..."}
              </span>
            </div>
            <div className="flex gap-1.5">
              {(health?.services || [1,2,3,4,5]).map((s: any, i: number) => (
                <div 
                  key={i} 
                  title={s.name ? `${s.name}: ${s.status} (${s.latency})` : "Syncing..."}
                  className="h-5 w-full bg-white/5 rounded-sm overflow-hidden relative cursor-help group"
                >
                  <div 
                    className={cn(
                      "absolute inset-0 transition-colors duration-500",
                      health ? "bg-green-500" : "bg-gray-700 animate-pulse"
                    )}
                    style={{ 
                      opacity: health ? 0.4 + (Math.random() * 0.4) : 1,
                      animationDelay: `${i * 0.1}s` 
                    }}
                  />
                  <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Profile Actions */}
          <div className="flex items-center gap-3 px-3 py-3 border-t border-white/5">
            <button 
              onClick={onSettingsOpen}
              className="w-10 h-10 rounded-xl bg-neuro-navy-light flex items-center justify-center text-white font-bold text-sm border border-white/10 hover:border-neuro-orange/50 transition-all shadow-xl active:scale-95 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-neuro-orange opacity-0 group-hover:opacity-10 transition-opacity" />
              {userRole === 'founder' ? 'RN' : 'AD'}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {userRole === 'founder' ? 'Raymond Nichols' : 'Administrator'}
              </p>
              <p className="text-[10px] text-gray-500 truncate flex items-center gap-1 capitalize">
                <ShieldCheck className="w-2 h-2 text-blue-500" />
                {userRole.replace('_', ' ')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={onSettingsOpen}
                className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Admin Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Global Lockdown Overlay - Handled by Layout now for consistency */}
    </>
  );
}
