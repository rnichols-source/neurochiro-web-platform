"use client";

import { Bell, ShieldCheck } from "lucide-react";

export default function NotificationsPlaceholder() {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-20 h-20 bg-neuro-navy/10 rounded-[2rem] flex items-center justify-center text-neuro-navy">
        <Bell className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-black text-neuro-navy uppercase tracking-tight">System Alerts</h1>
        <p className="text-gray-500 max-w-sm">No new alerts at this time. Stay tuned for platform updates and network notifications.</p>
      </div>
      <div className="px-6 py-2 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-600">
        <ShieldCheck className="w-3 h-3" /> System Status Normal
      </div>
    </div>
  );
}
