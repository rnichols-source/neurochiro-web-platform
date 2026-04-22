"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, User, Briefcase, GraduationCap, Calendar,
  MessageSquare, FileText, LogOut, X, Settings, CreditCard, DollarSign, Compass, ClipboardList, Target,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Profile", href: "/student/profile", icon: User },
  { name: "Jobs", href: "/student/jobs", icon: Briefcase },
  { name: "Seminars", href: "/student/seminars", icon: Calendar },
  { name: "Academy", href: "/student/academy", icon: GraduationCap },
  { name: "Contract Lab", href: "/student/contract-lab", icon: FileText },
  { name: "Financial Planner", href: "/student/financial-planner", icon: DollarSign },
  { name: "Techniques", href: "/student/techniques", icon: Compass },
  { name: "Interview Prep", href: "/student/interview-prep", icon: ClipboardList },
  { name: "Command Center", href: "/account/command-center", icon: Target },
  { name: "Settings", href: "/student/settings", icon: Settings },
  { name: "Billing", href: "/student/billing", icon: CreditCard },
  { name: "Messages", href: "/student/messages", icon: MessageSquare },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("full_name").eq("id", user.id).single()
          .then(({ data }) => setUserName(data?.full_name || null));
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

  const Content = (
    <div className="flex flex-col h-full bg-neuro-navy">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neuro-orange flex items-center justify-center font-bold text-white text-xl">N</div>
          <span className="text-white font-heading font-bold text-xl tracking-tight">NeuroChiro</span>
        </Link>
      </div>

      <nav className="px-4 space-y-1 flex-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-neuro-orange text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? "text-white" : "text-gray-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xs">
            {initials}
          </div>
          <p className="text-xs font-bold text-white truncate flex-1">{userName || "Loading..."}</p>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 p-1 rounded-lg transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex w-64 h-dvh flex-col border-r border-white/10 shrink-0 overflow-y-auto">
        {Content}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] md:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-neuro-navy/60 backdrop-blur-sm" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-64 h-full bg-neuro-navy flex flex-col shadow-2xl overflow-y-auto">
              <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-50">
                <X className="w-6 h-6" />
              </button>
              {Content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
