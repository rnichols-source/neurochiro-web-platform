"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";
import {
  LayoutDashboard,
  Activity,
  Search,
  BookOpen,
  Heart,
  LogOut,
  Settings,
  Dumbbell,
  TrendingUp,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  MessageSquare,
  Calendar,
  Apple,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import NotificationBell from "@/components/layout/NotificationBell";

const navItems = [
  { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { name: "Find a Doctor", href: "/directory", icon: Search },
  { name: "Saved", href: "/portal/saved", icon: Heart },
  { name: "Messages", href: "/portal/messages", icon: MessageSquare },
  { name: "Health Tracker", href: "/portal/track", icon: Activity },
  { name: "Exercises", href: "/portal/exercises", icon: Dumbbell },
  { name: "My Journey", href: "/portal/journey", icon: TrendingUp },
  { name: "Learn", href: "/portal/learn", icon: BookOpen },
  { name: "Nutrition", href: "/portal/supplements", icon: Apple },
  { name: "Seminars", href: "/seminars", icon: Calendar },
  { name: "Settings", href: "/portal/settings", icon: Settings },
  { name: "Help & Support", href: "/contact", icon: HelpCircle },
];

const mobileNavItems = [
  { name: "Home", href: "/portal/dashboard", icon: LayoutDashboard },
  { name: "Track", href: "/portal/track", icon: Activity },
  { name: "Search", href: "/directory", icon: Search },
  { name: "Learn", href: "/portal/learn", icon: BookOpen },
  { name: "Saved", href: "/portal/saved", icon: Heart },
];

function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [initials, setInitials] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) {
          setFullName(data.full_name);
          const parts = data.full_name.split(" ");
          setInitials(
            parts.length > 1
              ? `${parts[0][0]}${parts[parts.length - 1][0]}`
              : parts[0][0] || ""
          );
        }
      });
  }, [user?.id]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const currentPage = navItems.find((i) => pathname.startsWith(i.href))?.name || "Portal";

  return (
    <div className="flex h-dvh bg-neuro-cream overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 w-72 bg-neuro-navy text-white flex flex-col border-r border-white/5 z-[250]
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo-white.png" alt="NeuroChiro" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="text-lg font-heading font-black tracking-tight text-white leading-none">
                NeuroChiro
              </span>
              <span className="text-neuro-orange text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">
                Patient Portal
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          <div className="mb-4 px-3">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
              Your Health
            </span>
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/directory" && item.href !== "/contact" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? "bg-neuro-orange text-white shadow-lg shadow-neuro-orange/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-white" : "text-gray-500 group-hover:text-neuro-orange"
                  }`}
                />
                <span className="font-medium text-sm">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="portal-active-pill"
                    className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 mt-auto border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="w-10 h-10 rounded-xl bg-neuro-orange/20 border border-neuro-orange/30 flex items-center justify-center text-neuro-orange font-black text-sm">
              {initials || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {fullName || "Patient"}
              </p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                Member
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100/80 flex items-center justify-between px-6 md:px-10 shrink-0 sticky top-0 z-[100]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-neuro-navy hover:bg-neuro-navy/5 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-heading font-black text-neuro-navy tracking-tight">
                {currentPage}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              href="/portal/settings"
              className="hidden md:flex w-9 h-9 rounded-xl bg-neuro-navy/5 border border-neuro-navy/10 items-center justify-center text-neuro-navy font-bold text-xs hover:border-neuro-orange/30 hover:bg-neuro-orange/5 transition-all"
            >
              {initials || "?"}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 w-full min-w-0 pb-24 md:pb-10">
          <div className="max-w-5xl mx-auto w-full">{children}</div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav items={mobileNavItems} />
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortalShell>{children}</PortalShell>
    </AuthProvider>
  );
}
