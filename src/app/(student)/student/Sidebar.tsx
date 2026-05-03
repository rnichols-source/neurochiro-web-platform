"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, User, Briefcase, GraduationCap, Calendar,
  MessageSquare, FileText, LogOut, X, Settings, CreditCard, DollarSign, Compass, ClipboardList, Target, HelpCircle, ChevronDown,
  ShieldCheck, Lock, Search, ShoppingBag,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navSections = [
  {
    label: "HOME",
    items: [
      { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
      { name: "Profile", href: "/student/profile", icon: User },
      { name: "Messages", href: "/student/messages", icon: MessageSquare },
    ],
  },
  {
    label: "LEARN",
    items: [
      { name: "Academy", href: "/student/academy", icon: GraduationCap },
      { name: "Techniques", href: "/student/techniques", icon: Compass, pro: true },
      { name: "Contract Lab", href: "/student/contract-lab", icon: FileText, pro: true },
      { name: "Interview Prep", href: "/student/interview-prep", icon: ClipboardList, pro: true },
    ],
  },
  {
    label: "CAREER",
    items: [
      { name: "Find Doctors", href: "/directory", icon: Search },
      { name: "Jobs", href: "/student/jobs", icon: Briefcase },
      { name: "Seminars", href: "/student/seminars", icon: Calendar },
      { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
      { name: "Financial Planner", href: "/student/financial-planner", icon: DollarSign, pro: true },
      { name: "Command Center", href: "/account/command-center", icon: Target, pro: true },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { name: "Settings", href: "/student/settings", icon: Settings },
      { name: "Billing", href: "/student/billing", icon: CreditCard },
      { name: "Help & Support", href: "/contact", icon: HelpCircle },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [memberTier, setMemberTier] = useState<string>("starter");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("full_name, tier").eq("id", user.id).single()
          .then(({ data }) => {
            setUserName(data?.full_name || null);
            setMemberTier(data?.tier || "starter");
          });
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
    if (!open.includes("HOME")) open.push("HOME");
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
          <img src="/logo-white.png" alt="NeuroChiro" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <span className="text-lg font-heading font-black tracking-tight text-white leading-none">
              NeuroChiro
            </span>
            <span className="text-neuro-orange text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">
              Student Portal
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
                      {section.items.map((item: any) => {
                        const active = pathname === item.href;
                        const isLocked = item.pro && ["free", "starter"].includes(memberTier);
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group/item relative ${
                              active
                                ? "bg-neuro-orange text-white shadow-lg shadow-neuro-orange/20"
                                : isLocked
                                ? "text-gray-600 hover:text-gray-400 hover:bg-white/5"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <item.icon className={`w-4 h-4 transition-colors ${active ? "text-white" : isLocked ? "text-gray-700" : "text-gray-500 group-hover/item:text-neuro-orange"}`} />
                            {item.name}
                            {isLocked && (
                              <Lock className="w-3 h-3 text-gray-600 ml-auto flex-shrink-0" />
                            )}
                            {active && (
                              <motion.div
                                layoutId="student-active-pill"
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
              <GraduationCap className="w-2.5 h-2.5 text-blue-400" /> Student
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
