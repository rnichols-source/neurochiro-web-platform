"use client";

import Sidebar from "./Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import NotificationBell from "@/components/layout/NotificationBell";
import { AuthProvider } from "@/context/AuthContext";
import { LayoutDashboard, MessageSquare, Bell, User, Menu, Clock, CheckCircle2, Mail } from "lucide-react";
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
  const [tierInfo, setTierInfo] = useState<{ tier: string; trialEndsAt: string | null; isFounder: boolean } | null>(null);
  const [approvalPending, setApprovalPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, tier')
        .eq('id', user.id)
        .single();

      // Get doctor tier + trial info
      const { data: doctor } = await supabase
        .from('doctors')
        .select('membership_tier, trial_ends_at, is_founding_member, is_approved')
        .eq('user_id', user.id)
        .single() as any;

      // Approval gate — block dashboard if not approved
      if (doctor && doctor.is_approved === false) {
        setApprovalPending(true);
      }

      setTierInfo({
        tier: doctor?.membership_tier || profile?.tier || 'free',
        trialEndsAt: doctor?.trial_ends_at || null,
        isFounder: doctor?.is_founding_member || false,
      });

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

  // Approval pending — show waiting screen instead of dashboard
  if (approvalPending) {
    return (
      <div className="min-h-dvh bg-[#0F1A24] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-neuro-orange/20 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-neuro-orange" />
          </div>
          <h1 className="text-2xl font-heading font-black text-white mb-3">Your Account is Being Reviewed</h1>
          <p className="text-white/50 mb-6 leading-relaxed">
            Thank you for signing up! Our team is reviewing your account to ensure the quality of our network.
            You&apos;ll receive an email once your account is approved — usually within 24 hours.
          </p>
          <div className="bg-white/[0.06] border border-white/[0.1] rounded-2xl p-5 text-left space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-sm text-white/70">Account created</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-sm text-white/70">Profile information saved</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-neuro-orange flex-shrink-0 animate-pulse" />
              <span className="text-sm text-white font-bold">Pending admin approval</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-white/30 text-sm">
            <Mail className="w-4 h-4" />
            <span>We&apos;ll email you when approved</span>
          </div>
          <button
            onClick={() => { const supabase = createClient(); supabase.auth.signOut().then(() => window.location.href = '/'); }}
            className="mt-8 text-sm text-white/30 hover:text-white/50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

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
          {/* Upgrade banner for free tier */}
          {tierInfo && !tierInfo.isFounder && tierInfo.tier !== 'pro' && tierInfo.tier !== 'growth' && (
            <div className="bg-gradient-to-r from-neuro-orange/20 to-neuro-orange/10 border-b border-neuro-orange/20 px-6 py-3 flex items-center justify-between">
              <p className="text-sm text-white/90 font-medium">
                {tierInfo.trialEndsAt && new Date(tierInfo.trialEndsAt) > new Date() ? (
                  <>
                    <span className="font-black text-neuro-orange">Pro Trial Active:</span>{' '}
                    {Math.ceil((new Date(tierInfo.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left — your contact info is visible to patients.{' '}
                    <span className="text-white/70">Upgrade to keep it after the trial.</span>
                  </>
                ) : (
                  <>
                    <span className="text-white/70">Patients can&apos;t reach you yet.</span>{' '}
                    Upgrade to Pro — $49/mo
                  </>
                )}
              </p>
              <Link href="/doctor/billing" className="px-4 py-1.5 bg-neuro-orange text-white text-xs font-black rounded-lg hover:bg-neuro-orange/90 transition-colors whitespace-nowrap">
                Upgrade
              </Link>
            </div>
          )}
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
