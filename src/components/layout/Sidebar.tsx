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
  ShieldCheck
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Seminar Hub", href: "/student/seminars", icon: Calendar },
  { name: "Opportunities", href: "/student/jobs", icon: Briefcase },
  { name: "Clinic Discovery", href: "/student/clinics", icon: MapPin },
  { name: "My Identity", href: "/student/profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function getProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);
      }
    }
    getProfile();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "NC";
  };

  return (
    <aside className="w-64 h-dvh bg-neuro-navy flex flex-col border-r border-white/10 shrink-0">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <img loading="lazy" decoding="async" src="/logo-white.png" alt="NeuroChiro" className="w-8 h-8 object-contain" />
          <span className="text-white font-heading font-black text-xl tracking-tight">NEURO<span className="text-neuro-orange">CHIRO</span></span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="mb-4 px-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Student Portal</span>
        </div>
        {navItems.map((item) => {
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
              <span className="font-medium">{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        {/* Upgrade CTA */}
        <div className="bg-gradient-to-br from-neuro-navy-light to-neuro-navy p-4 rounded-xl border border-white/10 shadow-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-neuro-orange/20 rounded-md">
              <Sparkles className="w-4 h-4 text-neuro-orange" />
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Upgrade to Paid</span>
          </div>
          <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
            Unlock clinical playbooks, apply to jobs, and connect with mentors.
          </p>
          <button className="w-full py-2 bg-neuro-orange hover:bg-neuro-orange-light text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
            View Benefits
          </button>
        </div>

        <div className="flex items-center gap-3 px-3 py-3 border-t border-white/10">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xs">
            {profile ? getInitials(profile.full_name) : "--"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{profile?.full_name || "Loading..."}</p>
            <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
              <ShieldCheck className="w-2 h-2 text-gray-500" />
              {profile?.role === 'student_paid' ? 'Student (Paid)' : 'Student (Free)'}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
