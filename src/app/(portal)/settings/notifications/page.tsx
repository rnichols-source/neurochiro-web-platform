"use client";

import NotificationSettings from "@/components/layout/NotificationSettings";
import { Bell } from "lucide-react";

export default function NotificationSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-neuro-navy uppercase tracking-tighter flex items-center gap-4">
          <Bell className="w-10 h-10 text-neuro-orange" /> Notification Preferences
        </h1>
        <p className="text-gray-500 font-medium mt-2 uppercase tracking-widest text-xs">
          CONTROL HOW AND WHEN YOU RECEIVE UPDATES FROM NEUROCHIRO
        </p>
      </div>

      <NotificationSettings />
    </div>
  );
}
