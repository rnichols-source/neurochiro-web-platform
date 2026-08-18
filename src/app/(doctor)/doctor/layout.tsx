"use client";

import Sidebar from "./Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import NotificationBell from "@/components/layout/NotificationBell";
import { AuthProvider } from "@/context/AuthContext";
import { LayoutDashboard, MessageSquare, Bell, User, Menu, Clock, CheckCircle2, Mail, Calendar, Phone, Zap, Star, BarChart3, Video, Image as ImageIcon } from "lucide-react";
import { DOCTOR_PRO_FEATURES_MINIMAL } from "@/lib/membership-value";
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
  const [tierInfo, setTierInfo] = useState<{ tier: string; isFounder: boolean } | null>(null);
  const [onboardingCallStatus, setOnboardingCallStatus] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState("");

  // Placeholder — replace with your Calendly link
  const CALENDLY_URL = "https://calendly.com/neurochiro/onboarding";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, tier')
        .eq('id', user.id)
        .single();

      const { data: doctor } = await supabase
        .from('doctors')
        .select('membership_tier, trial_ends_at, is_founding_member, is_approved, onboarding_call_status')
        .eq('user_id', user.id)
        .single() as any;

      // Onboarding call gate — founding members and approved doctors skip
      const isFounder = doctor?.is_founding_member || false;
      const isApproved = doctor?.is_approved === true;
      const callStatus = doctor?.onboarding_call_status || 'not_booked';

      if (!isFounder && !isApproved && callStatus !== 'completed') {
        setOnboardingCallStatus(callStatus);
      }

      setTierInfo({
        tier: doctor?.membership_tier || profile?.tier || 'free',
        isFounder,
      });

      setSubscriptionChecked(true);
      setDoctorName(profile?.full_name?.split(' ')[0] || '');

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

  // Onboarding call gate — must complete call with Dr. Ray before accessing dashboard
  // Exempt the profile onboarding page so new doctors can set up photo/bio/specialties first
  const isOnboardingPage = pathname === '/doctor/onboarding';
  if (onboardingCallStatus && onboardingCallStatus !== 'completed' && !isOnboardingPage) {
    const minimalIcons = [Phone, ImageIcon, Video, Star, Zap, BarChart3, Zap];
    const monthlyPromise = DOCTOR_PRO_FEATURES_MINIMAL.map((text, i) => ({
      icon: minimalIcons[i] || Zap,
      text,
    }));

    return (
      <div className="min-h-dvh bg-[#0F1A24] flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-neuro-orange/20 flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-neuro-orange" />
            </div>
            <h1 className="text-2xl font-heading font-black text-white mb-2">
              {onboardingCallStatus === 'booked' ? 'Your Call is Booked!' : `Welcome${doctorName ? `, Dr. ${doctorName}` : ''}!`}
            </h1>
            <p className="text-white/50 leading-relaxed">
              {onboardingCallStatus === 'booked'
                ? "Dr. Ray is looking forward to meeting you. Your account will be activated after the call."
                : "Book a quick onboarding call with Dr. Ray to activate your account and get the most out of your membership."}
            </p>
          </div>

          {/* Book Call CTA */}
          {onboardingCallStatus !== 'booked' && (
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-neuro-orange text-white font-black rounded-xl text-center text-sm uppercase tracking-wider shadow-lg shadow-neuro-orange/20 hover:bg-neuro-orange/90 transition-all flex items-center justify-center gap-2 mb-8"
            >
              <Calendar className="w-5 h-5" />
              Book Your Onboarding Call
            </a>
          )}

          {onboardingCallStatus === 'booked' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-center mb-8">
              <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-bold text-sm">Call booked! Check your email for the calendar invite.</p>
              <p className="text-white/40 text-xs mt-1">Dr. Ray will activate your account after the call.</p>
            </div>
          )}

          {/* What you get */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-6">
            <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-4">What You Get Every Month</p>
            <div className="space-y-3">
              {monthlyPromise.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-neuro-orange flex-shrink-0" />
                  <span className="text-sm text-white/70">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 text-left space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-sm text-white/70">Account created</span>
            </div>
            <div className="flex items-center gap-3">
              {onboardingCallStatus === 'booked' ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-neuro-orange flex-shrink-0 animate-pulse" />
              )}
              <span className={`text-sm ${onboardingCallStatus === 'booked' ? 'text-white/70' : 'text-white font-bold'}`}>
                {onboardingCallStatus === 'booked' ? 'Onboarding call booked' : 'Book onboarding call with Dr. Ray'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-white/20 flex-shrink-0" />
              <span className="text-sm text-white/30">Account activated</span>
            </div>
          </div>

          <button
            onClick={() => { const supabase = createClient(); supabase.auth.signOut().then(() => window.location.href = '/'); }}
            className="w-full text-sm text-white/30 hover:text-white/50 transition-colors text-center"
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
          {/* Upgrade banner for unpaid members */}
          {tierInfo && !tierInfo.isFounder && tierInfo.tier !== 'pro' && tierInfo.tier !== 'growth' && (
            <div className="bg-gradient-to-r from-neuro-orange/20 to-neuro-orange/10 border-b border-neuro-orange/30 px-6 py-3 flex items-center justify-between">
              <p className="text-sm text-white/90 font-medium">
                <span className="font-black text-neuro-orange">Activate Pro</span>{' '}
                <span className="text-white/70">to unlock your full directory listing, patient leads, and weekly promotion. $99/mo.</span>
              </p>
              <Link href="/doctor/billing" className="px-4 py-1.5 bg-neuro-orange text-white text-xs font-black rounded-lg hover:bg-neuro-orange/90 transition-colors whitespace-nowrap">
                Activate Pro
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
