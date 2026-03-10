"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PerspectiveBanner() {
  const [demoRole, setDemoRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const cookies = document.cookie.split('; ');
    const roleCookie = cookies.find(row => row.startsWith('nc_demo_role='));
    if (roleCookie) {
      setDemoRole(roleCookie.split('=')[1]);
    }
  }, []);

  const exitPerspectiveMode = async () => {
    // Clear the cookie
    document.cookie = "nc_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setDemoRole(null);
    // Force redirect to the main dashboard redirector which will now see them as real admin
    window.location.href = '/dashboard';
  };

  if (!demoRole) return null;

  return (
    <div className="bg-neuro-orange text-white px-4 py-2 flex items-center justify-between z-[9999] relative shrink-0">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">
          Perspective Mode Active: {demoRole.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      <button 
        onClick={exitPerspectiveMode}
        className="flex items-center gap-1 text-[10px] bg-white/20 hover:bg-white/30 px-3 py-1 rounded font-bold uppercase tracking-widest transition-colors"
      >
        <X className="w-3 h-3" />
        Exit Perspective Mode
      </button>
    </div>
  );
}
