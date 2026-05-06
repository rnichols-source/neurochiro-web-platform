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
  MessageSquare,
  Calendar,
  Apple,
} from "lucide-react";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import NotificationBell from "@/components/layout/NotificationBell";

const navSections = [
  {
    label: "Health",
    items: [
      { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
      { name: "Health Tracker", href: "/portal/track", icon: Activity },
      { name: "My Journey", href: "/portal/journey", icon: TrendingUp },
      { name: "Exercises", href: "/portal/exercises", icon: Dumbbell },
    ],
  },
  {
    label: "Learn",
    items: [
      { name: "Articles", href: "/portal/learn", icon: BookOpen },
      { name: "Nutrition", href: "/portal/supplements", icon: Apple },
      { name: "Seminars", href: "/seminars", icon: Calendar },
    ],
  },
  {
    label: "Connect",
    items: [
      { name: "Find a Doctor", href: "/directory", icon: Search },
      { name: "Saved Doctors", href: "/portal/saved", icon: Heart },
      { name: "Messages", href: "/portal/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Settings", href: "/portal/settings", icon: Settings },
      { name: "Help & Support", href: "/contact", icon: HelpCircle },
    ],
  },
];

const allNavItems = navSections.flatMap((s) => s.items);

const mobileNavItems = [
  { name: "Home", href: "/portal/dashboard", icon: LayoutDashboard },
  { name: "Track", href: "/portal/track", icon: Activity },
  { name: "Search", href: "/directory", icon: Search },
  { name: "Learn", href: "/portal/learn", icon: BookOpen },
  { name: "Menu", href: "#", icon: Menu, isMenuTrigger: true },
];

function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [initials, setInitials] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex h-dvh bg-[#0F1A24] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 w-56 bg-[#0A1018] text-white flex flex-col border-r border-white/[0.04] z-[250]
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="px-6 pt-7 pb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-white.png" alt="NeuroChiro" className="w-7 h-7 object-contain opacity-80" />
            <div className="flex flex-col">
              <span className="text-[14px] font-heading font-bold tracking-tight text-white/90 leading-none">
                NeuroChiro
              </span>
              <span className="text-[#D66829] text-[8px] font-medium uppercase tracking-[0.2em] mt-1">
                Health
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 text-white/30 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 flex-1 overflow-y-auto space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-2 text-[9px] font-medium uppercase tracking-[0.2em] text-white/15">
                {section.label}
              </p>
              <div className="space-y-px">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/directory" && item.href !== "/contact" && item.href !== "/seminars" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] transition-all duration-200 ${
                        isActive
                          ? "bg-white/[0.06] text-white"
                          : "text-white/30 hover:text-white/60 hover:bg-white/[0.02]"
                      }`}
                    >
                      <item.icon className={`w-[14px] h-[14px] ${isActive ? "text-[#D66829]" : "text-white/20"}`} />
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
              {initials || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-white/70 truncate">{fullName || "..."}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-white/15 hover:text-red-400/80 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-14 bg-[#0F1A24]/90 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6 md:px-10 shrink-0 sticky top-0 z-[100]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-white/40 hover:text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/portal/settings"
              className="hidden md:flex w-8 h-8 rounded-lg bg-white/[0.06] items-center justify-center text-white/60 font-medium text-[11px] hover:bg-white/[0.1] hover:text-white transition-all"
            >
              {initials || "?"}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#0F1A24] pb-28 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav
        items={mobileNavItems}
        onMenuClick={() => setSidebarOpen(true)}
      />
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
