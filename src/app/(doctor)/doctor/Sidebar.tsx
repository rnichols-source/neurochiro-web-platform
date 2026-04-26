"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, User, Briefcase, GraduationCap, Calendar,
  MessageSquare, BarChart3, Bell, CreditCard, LogOut, X, Settings, Calculator, Library, FileCheck, TrendingUp, Activity, Presentation, Receipt, DollarSign, Target, ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import NotificationBell from "@/components/layout/NotificationBell";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navSections = [
  {
    label: "PRACTICE",
    items: [
      { name: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
      { name: "Profile", href: "/doctor/profile", icon: User },
      { name: "Messages", href: "/doctor/messages", icon: MessageSquare },
      { name: "Notifications", href: "/doctor/notifications", icon: Bell },
    ],
  },
  {
    label: "PATIENTS",
    items: [
      { name: "Care Plan", href: "/doctor/care-plan", icon: Calculator },
      { name: "Scan Reports", href: "/doctor/scan-report", icon: Activity },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { name: "KPI Tracker", href: "/doctor/kpi", icon: TrendingUp },
      { name: "P&L Analyzer", href: "/doctor/pl-analyzer", icon: DollarSign },
      { name: "Content Library", href: "/doctor/content-library", icon: Library },
      { name: "Billing Guide", href: "/doctor/billing-guide", icon: Receipt },
    ],
  },
  {
    label: "GROW",
    items: [
      { name: "Jobs & Hiring", href: "/doctor/jobs", icon: Briefcase },
      { name: "Workshops", href: "/doctor/workshops", icon: Presentation },
      { name: "Screenings", href: "/doctor/screenings", icon: Target },
      { name: "Command Center", href: "/account/command-center", icon: Target },
      { name: "Contracts", href: "/doctor/contracts", icon: FileCheck },
      { name: "Students", href: "/doctor/students", icon: GraduationCap },
      { name: "Seminars", href: "/doctor/seminars", icon: Calendar },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { name: "Analytics", href: "/doctor/analytics", icon: BarChart3 },
      { name: "Settings", href: "/doctor/settings", icon: Settings },
      { name: "Billing", href: "/doctor/billing", icon: CreditCard },
      { name: "Help & Support", href: "/contact", icon: MessageSquare },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("full_name").eq("id", user.id).single()
          .then(({ data }) => setUserName(data?.full_name || null));
        supabase.from("notifications").select("*", { count: "exact", head: true })
          .eq("user_id", user.id).is("read_at", null)
          .then(({ count }) => setUnreadNotifs(count || 0));
      }
    });
  }, []);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "nc_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
    router.refresh();
  };

  const initials = userName?.split(" ").map((n) => n[0]).join("").toUpperCase() || "--";

  const getDefaultOpen = () => {
    const open: string[] = [];
    for (const section of navSections) {
      if (section.items.some((item) => pathname === item.href || pathname?.startsWith(item.href + "/"))) {
        open.push(section.label);
      }
    }
    if (!open.includes("PRACTICE")) open.push("PRACTICE");
    return open;
  };

  const [openSections, setOpenSections] = useState<string[]>(getDefaultOpen);

  useEffect(() => {
    setOpenSections(getDefaultOpen());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  const Content = (
    <div className="flex flex-col h-full bg-neuro-navy">
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-neuro-orange flex items-center justify-center font-black text-white text-lg shadow-lg shadow-neuro-orange/20 group-hover:scale-105 transition-transform">
            N
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-heading font-black tracking-tight text-white leading-none">
              NeuroChiro
            </span>
            <span className="text-neuro-orange text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">
              Doctor Portal
            </span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="px-4 flex-1 overflow-y-auto">
        {navSections.map((section, si) => {
          const isOpen2 = openSections.includes(section.label);
          const hasActive = section.items.some((item) => pathname === item.href || pathname?.startsWith(item.href + "/"));

          return (
            <div key={section.label} className={si > 0 ? "mt-3" : ""}>
              <button
                onClick={() => toggleSection(section.label)}
                className="w-full flex items-center justify-between px-3 py-2 group"
              >
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                  hasActive ? "text-neuro-orange" : "text-gray-500 group-hover:text-gray-400"
                }`}>
                  {section.label}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${
                    isOpen2 ? "" : "-rotate-90"
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen2 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5 mt-0.5 pb-1">
                      {section.items.map((item) => {
                        const active = pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group/item relative ${
                              active
                                ? "bg-neuro-orange text-white shadow-lg shadow-neuro-orange/20"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <item.icon className={`w-4 h-4 transition-colors ${active ? "text-white" : "text-gray-500 group-hover/item:text-neuro-orange"}`} />
                            {item.name}
                            {item.name === 'Notifications' && unreadNotifs > 0 && (
                              <span className="ml-auto bg-neuro-orange text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>
                            )}
                            {active && (
                              <motion.div
                                layoutId="doctor-active-pill"
                                className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"
                              />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="w-10 h-10 rounded-xl bg-neuro-orange/20 border border-neuro-orange/30 flex items-center justify-center text-neuro-orange font-black text-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{userName || "Loading..."}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5 text-blue-400" /> Doctor
            </p>
          </div>
          <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex w-72 h-dvh flex-col border-r border-white/5 shrink-0 overflow-y-auto">
        {Content}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] md:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-72 h-full flex flex-col shadow-2xl overflow-y-auto">
              {Content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
