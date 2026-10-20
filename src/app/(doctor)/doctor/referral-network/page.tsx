"use client";

import { Send } from "lucide-react";
import UpgradeGate from "@/components/doctor/UpgradeGate";

export default function ReferralNetworkPage() {
  return (
    <UpgradeGate feature="Referral Network" requiredTier="pro" description="Build and track your doctor-to-doctor referral network. See who's sending you patients and strengthen those relationships.">
      <div className="p-4 md:p-10 max-w-5xl mx-auto">
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Send className="w-7 h-7 text-[#D66829]" />
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Refer a Patient</h1>
          </div>
          <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
            Doctor-to-doctor referrals are coming this week. You&apos;ll be able to find nearby members and refer patients directly from your dashboard.
          </p>
        </div>
      </div>
    </UpgradeGate>
  );
}
