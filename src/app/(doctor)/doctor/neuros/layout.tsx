"use client";

import NeurOSGate from "@/components/doctor/NeurOSGate";

export default function NeurOSLayout({ children }: { children: React.ReactNode }) {
  return (
    <NeurOSGate>
      <div className="relative">
        {/* NeurOS brand bar */}
        <div className="bg-gradient-to-r from-[#1E2D3B] to-[#2a3f52] px-6 py-2.5 flex items-center gap-3 rounded-xl mb-6">
          <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white tracking-wide">Neur<span className="text-blue-400">OS</span></span>
          <span className="text-xs text-white/30">Practice Operating System</span>
        </div>
        {children}
      </div>
    </NeurOSGate>
  );
}
