"use client";

import Sidebar from "./Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import NotificationBell from "@/components/layout/NotificationBell";
import { AuthProvider } from "@/context/AuthContext";
import { LayoutDashboard, MessageSquare, Bell, User, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

const mobileNavItems = [
  { name: "Home", href: "/doctor/dashboard", icon: LayoutDashboard },
  { name: "Profile", href: "/doctor/profile", icon: User },
  { name: "Alerts", href: "/doctor/notifications", icon: Bell },
  { name: "Messages", href: "/doctor/messages", icon: MessageSquare },
  { name: "Menu", href: "#", icon: Menu, isMenuTrigger: true },
];

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initials, setInitials] = useState("--");
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      // TODO: Re-enable payment gate after conference
      // Payment verification will be handled server-side via API route
      // to avoid client-side RLS issues with doctors table

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, tier')
        .eq('id', user.id)
        .single();

      setSubscriptionChecked(true);

      // Load notifications count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);
      setUnreadCount(count || 0);

      if (profile?.full_name) {
        const parts = profile.full_name.split(" ");
        setInitials(parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0][0] || "--");
      }
    });
  }, [pathname]);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <AuthProvider>
    <div className="flex flex-col md:flex-row h-dvh bg-[#0F1A24] overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-14 bg-[#0F1A24]/90 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between px-6 md:px-10 shrink-0 sticky top-0 z-[100]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-white/60 hover:bg-white/[0.06] rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              href="/doctor/profile"
              className="hidden md:flex w-8 h-8 rounded-lg bg-white/[0.06] items-center justify-center text-white/60 font-bold text-[11px] hover:bg-white/[0.1] transition-all"
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Mobile Top Bar (compact) */}
        <div className="md:hidden bg-neuro-navy p-4 flex items-center justify-between z-50 -mt-16 hidden">
          {/* Kept for reference but replaced by new header */}
        </div>

        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-[#0F1A24] pb-24 md:pb-0">
          <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav
        items={mobileNavItems.map(item => item.name === 'Alerts' ? { ...item, badge: unreadCount } : item)}
        onMenuClick={() => setIsSidebarOpen(true)}
      />
    </div>
    </AuthProvider>
  );
}
