"use client";

import Sidebar from "./Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import NotificationBell from "@/components/layout/NotificationBell";
import { AuthProvider } from "@/context/AuthContext";
import { LayoutDashboard, MessageSquare, Bell, GraduationCap, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

const mobileNavItems = [
  { name: "Home", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Academy", href: "/student/academy", icon: GraduationCap },
  { name: "Messages", href: "/student/messages", icon: MessageSquare },
  { name: "Alerts", href: "/student/notifications", icon: Bell },
  { name: "Menu", href: "#", icon: Menu, isMenuTrigger: true },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [initials, setInitials] = useState("--");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profile?.full_name) {
        const parts = profile.full_name.split(" ");
        setInitials(parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0][0] || "--");
      }
    });
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <AuthProvider>
    <div className="flex flex-col md:flex-row h-dvh bg-neuro-cream overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100/80 flex items-center justify-between px-6 md:px-10 shrink-0 sticky top-0 z-[100]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-neuro-navy hover:bg-neuro-navy/5 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              href="/student/profile"
              className="hidden md:flex w-9 h-9 rounded-xl bg-neuro-navy/5 border border-neuro-navy/10 items-center justify-center text-neuro-navy font-bold text-xs hover:border-neuro-orange/30 hover:bg-neuro-orange/5 transition-all"
            >
              {initials}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-neuro-cream pb-24 md:pb-0">
          {children}
        </main>
      </div>
      <MobileBottomNav
        items={mobileNavItems}
        onMenuClick={() => setIsSidebarOpen(true)}
      />
    </div>
    </AuthProvider>
  );
}
