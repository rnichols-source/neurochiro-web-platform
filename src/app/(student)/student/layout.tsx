"use client";

import Sidebar from "./Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import NotificationBell from "@/components/layout/NotificationBell";
import { AuthProvider } from "@/context/AuthContext";
import { LayoutDashboard, MessageSquare, Bell, GraduationCap, Menu, Calendar, CheckCircle2, Clock, Briefcase, Star, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
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
  const [onboardingCallStatus, setOnboardingCallStatus] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");

  const CALENDLY_URL = "https://calendly.com/neurochiro/onboarding";

  useEffect(() => {
    const supabase = createClient();
    const justSubscribed = searchParams.get('subscribed') === 'true';

    const checkSubscription = async (attempt = 1): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/student/subscribe');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, tier, stripe_customer_id')
        .eq('id', user.id)
        .single();

      // Check onboarding call status
      const { data: student } = await (supabase as any)
        .from('students')
        .select('onboarding_call_status')
        .eq('id', user.id)
        .single();

      const callStatus = student?.onboarding_call_status || 'not_booked';
      if (callStatus !== 'completed') {
        setOnboardingCallStatus(callStatus);
      }

      if (profile?.full_name) {
        const parts = profile.full_name.split(" ");
        setInitials(parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0][0] || "--");
        setStudentName(parts[0] || '');
      }
      setSubscriptionChecked(true);
    };

    checkSubscription();
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Prevent flash of portal content while subscription is being checked
  const isExemptPage = pathname === '/student/subscribe' || pathname === '/student/billing' || pathname === '/student/welcome';
  if (!subscriptionChecked && !isExemptPage) {
    return (
      <div className="flex items-center justify-center h-dvh bg-[#0F1A24]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  // Onboarding call gate for students
  // Exempt welcome page so students can complete initial setup first
  const isWelcomePage = pathname === '/student/welcome';
  if (onboardingCallStatus && onboardingCallStatus !== 'completed' && !isWelcomePage) {
    const studentPromise = [
      { icon: Users, text: "Monthly group call with Dr. Ray" },
      { icon: Briefcase, text: "ChiroMatch job matching + smart job board" },
      { icon: BookOpen, text: "Academy courses + interview prep" },
      { icon: Star, text: "Contract Lab + financial planner" },
    ];

    return (
      <div className="min-h-dvh bg-[#0F1A24] flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-neuro-orange/20 flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-neuro-orange" />
            </div>
            <h1 className="text-2xl font-heading font-black text-white mb-2">
              {onboardingCallStatus === 'booked' ? 'Your Call is Booked!' : `Welcome${studentName ? `, ${studentName}` : ''}!`}
            </h1>
            <p className="text-white/50 leading-relaxed">
              {onboardingCallStatus === 'booked'
                ? "Dr. Ray is looking forward to meeting you. Your account will be activated after the call."
                : "Book a quick onboarding call with Dr. Ray to activate your account and get started on your career."}
            </p>
          </div>

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
            </div>
          )}

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-6">
            <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-4">What You Get Every Month — $33/mo</p>
            <div className="space-y-3">
              {studentPromise.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-neuro-orange flex-shrink-0" />
                  <span className="text-sm text-white/70">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

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
