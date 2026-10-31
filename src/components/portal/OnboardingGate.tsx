'use client';

import { usePathname } from 'next/navigation';
import { Calendar, CheckCircle2, Clock, Phone, Image as ImageIcon, Video, Star, Zap, BarChart3, Mail } from 'lucide-react';
import { DOCTOR_PRO_FEATURES_MINIMAL } from '@/lib/membership-value';
import { createClient } from '@/lib/supabase';
import { firstName } from '@/lib/portal/greeting';

const CALENDLY_URL = 'https://calendly.com/drray-neurochirodirectory/neurochiro-onboarding-call';

export default function OnboardingGate({
  needsCall,
  callStatus,
  doctorName,
  children,
}: {
  needsCall: boolean;
  callStatus: string;
  doctorName: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (!needsCall || pathname === '/doctor/onboarding') return children;

  const icons = [Phone, ImageIcon, Video, Star, Zap, BarChart3, Mail];
  const name = firstName(doctorName);

  return (
    <div className="min-h-dvh bg-[#0F1A24] flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-neuro-orange/20 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-neuro-orange" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {callStatus === 'booked' ? 'Your call is booked' : `Welcome${name && name !== 'there' ? `, Dr. ${name}` : ''}`}
          </h1>
          <p className="text-white/70 leading-relaxed">
            {callStatus === 'booked'
              ? 'Dr. Ray is looking forward to meeting you. Your account will be activated after the call.'
              : 'Book a short onboarding call with Dr. Ray to activate your account.'}
          </p>
        </div>
        {callStatus !== 'booked' ? (
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="w-full min-h-11 py-4 bg-neuro-orange text-white font-bold rounded-xl text-center text-sm flex items-center justify-center gap-2 mb-8">
            <Calendar className="w-5 h-5" />
            Book your onboarding call
          </a>
        ) : (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center mb-8">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-bold text-sm">Call booked. Check your email for the calendar invite.</p>
          </div>
        )}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <p className="text-neuro-orange text-sm font-bold mb-4">What you get every month</p>
          <div className="space-y-3">
            {DOCTOR_PRO_FEATURES_MINIMAL.map((text, index) => {
              const Icon = icons[index] || Zap;
              return (
                <div key={text} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-neuro-orange shrink-0" />
                  <span className="text-sm text-white/80">{text}</span>
                </div>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={() => { createClient().auth.signOut().then(() => { window.location.href = '/'; }); }}
          className="w-full min-h-11 text-sm text-white/70"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
