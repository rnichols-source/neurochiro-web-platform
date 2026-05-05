"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, User, Briefcase, GraduationCap, Calendar,
  MessageSquare, FileText, LogOut, X, Settings, CreditCard, DollarSign, Compass, ClipboardList, HelpCircle,
  Map, Users, Heart, Search, ShoppingBag,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navSections = [
  {
    label: "Home",
    items: [
      { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
      { name: "Career Pipeline", href: "/student/career-pipeline", icon: Map },
      { name: "Profile", href: "/student/profile", icon: User },
      { name: "Messages", href: "/student/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Learn",
    items: [
      { name: "Academy", href: "/student/academy", icon: GraduationCap },
      { name: "Techniques", href: "/student/techniques", icon: Compass },
      { name: "Interview Prep", href: "/student/interview-prep", icon: ClipboardList },
    ],
  },
  {
    label: "Career",
    items: [
      { name: "Find Doctors", href: "/directory", icon: Search },
      { name: "Jobs", href: "/student/jobs", icon: Briefcase },
      { name: "Mentors", href: "/student/mentors", icon: Heart },
      { name: "Contract Lab", href: "/student/contract-lab", icon: FileText },
      { name: "Financial Planner", href: "/student/financial-planner", icon: DollarSign },
      { name: "Seminars", href: "/student/seminars", icon: Calendar },
      { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
    ],
  },
  {
    label: "Community",
    items: [
      { name: "Student Network", href: "/student/community", icon: Users },
    ],
  },
  {
    label: "Account",
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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("full_name").eq("id", user.id).single()
          .then(({ data }) => {
            setUserName(data?.full_name || null);
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

  const Content = (
    <div className="flex flex-col h-full bg-[#0A1018]">
      {/* Logo */}
      <div className="px-6 pt-7 pb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo-white.png" alt="NeuroChiro" className="w-7 h-7 object-contain opacity-80" />
          <div className="flex flex-col">
            <span className="text-[14px] font-heading font-bold tracking-tight text-white/90 leading-none">
              NeuroChiro
            </span>
            <span className="text-[#D66829] text-[8px] font-medium uppercase tracking-[0.2em] mt-1">
              Student
            </span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-2 text-white/30 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1 overflow-y-auto space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-[9px] font-medium uppercase tracking-[0.2em] text-white/15">
              {section.label}
            </p>
            <div className="space-y-px">
              {section.items.map((item: any) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] transition-all duration-200 ${
                      active
                        ? "bg-white/[0.06] text-white"
                        : "text-white/30 hover:text-white/60 hover:bg-white/[0.02]"
                    }`}
                  >
                    <item.icon className={`w-[14px] h-[14px] ${active ? "text-[#D66829]" : "text-white/20"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/50 font-medium text-[10px]">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-white/70 truncate">{userName || "..."}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 text-white/15 hover:text-red-400/80 rounded-lg transition-colors" title="Logout">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex w-56 h-dvh flex-col shrink-0 overflow-y-auto border-r border-white/[0.04]">
        {Content}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-56 h-full flex flex-col shadow-2xl">
            {Content}
          </div>
        </div>
      )}
    </>
  );
}
