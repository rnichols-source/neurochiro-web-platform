"use client";

import Sidebar from "./Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import NotificationBell from "@/components/layout/NotificationBell";
import { AuthProvider } from "@/context/AuthContext";
import { LayoutDashboard, MessageSquare, Bell, Briefcase, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase";

const mobileNavItems = [
  { name: "Home", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Jobs", href: "/student/jobs", icon: Briefcase },
  { name: "Messages", href: "/student/messages", icon: MessageSquare },
  { name: "Alerts", href: "/student/notifications", icon: Bell },
  { name: "Menu", href: "#", icon: Menu, isMenuTrigger: true },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#0F1A24] flex items-center justify-center"><div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" /></div>}>
      <StudentLayoutInner>{children}</StudentLayoutInner>
    </Suspense>
  );
}

function StudentLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [initials, setInitials] = useState("--");
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const supabase = createClient();

    const checkAuth = async (): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/student/dashboard');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile?.full_name) {
        const parts = profile.full_name.split(" ");
        setInitials(parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0][0] || "--");
        setStudentName(parts[0] || '');
      }
      setSubscriptionChecked(true);
    };

    checkAuth();
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Prevent flash of portal content while subscription is being checked
  const isExemptPage = pathname === '/student/subscribe' || pathname === '/student/billing' || pathname === '/student/welcome' || pathname === '/student/settings';
  if (!subscriptionChecked && !isExemptPage) {
    return (
      <div className="flex items-center justify-center h-dvh bg-[#0F1A24]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  // Students are free — no onboarding gate, no subscription check

  return (
    <AuthProvider>
    <div className="flex flex-col md:flex-row h-dvh bg-[#0F1A24] overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-14 bg-[#0F1A24]/90 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6 md:px-10 shrink-0 sticky top-0 z-[100]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2.5 -ml-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/40 hover:text-white rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/student/profile"
              className="hidden md:flex w-8 h-8 rounded-lg bg-white/[0.06] items-center justify-center text-white/60 font-medium text-[11px] hover:bg-white/[0.1] hover:text-white transition-all"
            >
              {initials}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-[#0F1A24] pb-28 md:pb-0">
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
