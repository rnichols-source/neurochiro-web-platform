"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  LayoutGrid, 
  BookOpen, 
  Users, 
  DollarSign, 
  BarChart3, 
  Megaphone,
  Settings,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { isAdminRole } from "@/lib/founder";

const NAV_ITEMS = [
  {
    title: "Command Center",
    subtitle: "JUMP TO SECTION",
    icon: LayoutGrid,
    href: "/admin/dashboard",
    color: "bg-blue-500/10 text-blue-500"
  },
  {
    title: "Content Manager",
    subtitle: "JUMP TO SECTION",
    icon: BookOpen,
    href: "/admin/content",
    color: "bg-purple-500/10 text-purple-500"
  },
  {
    title: "Review Queue",
    subtitle: "JUMP TO SECTION",
    icon: Users,
    href: "/admin/reviews",
    color: "bg-orange-500/10 text-orange-500"
  },
  {
    title: "Revenue",
    subtitle: "JUMP TO SECTION",
    icon: DollarSign,
    href: "/admin/revenue",
    color: "bg-emerald-500/10 text-emerald-500"
  },
  {
    title: "Analytics",
    subtitle: "JUMP TO SECTION",
    icon: BarChart3,
    href: "/admin/analytics",
    color: "bg-blue-600/10 text-blue-600"
  },
  {
    title: "Announcements",
    subtitle: "PUSH UPDATES",
    icon: Megaphone,
    href: "/admin/announcements",
    color: "bg-red-500/10 text-red-500"
  }
];

export default function AdminQuickNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin (check both cookie and potential supabase session)
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile && isAdminRole(profile.role)) {
          setIsAdmin(true);
          return;
        }
      }

      // Fallback to cookie check for perspective mode if they simulated admin
      const cookies = document.cookie.split('; ');
      const demoRole = cookies.find(row => row.startsWith('nc_demo_role='));
      const cookieRole = demoRole ? demoRole.split('=')[1] : null;
      
      if (cookieRole === 'admin' || cookieRole === 'super_admin' || cookieRole === 'founder') {
        setIsAdmin(true);
      }
    };

    checkAdmin();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with Alt + A (as per user request: ⌘ ALT + A, but ⌘ is Mac specific, Alt+A is more universal)
      // We'll support both for convenience
      if (e.altKey && (e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isAdmin) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-neuro-navy/60 backdrop-blur-xl"
            />

            {/* Modal */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20"
            >
              {/* Header */}
              <div className="bg-neuro-navy p-8 text-white relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[80px] rounded-full -mr-32 -mt-32"></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <h2 className="text-neuro-orange font-black text-sm uppercase tracking-[0.2em]">Admin Quick Nav</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest opacity-80">System Controller</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
                       <span className="text-[10px] font-black text-gray-400">⌥ ALT + A</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="p-4 bg-gray-50/50">
                <div className="grid gap-2">
                  {NAV_ITEMS.map((item, idx) => (
                    <button
                      key={item.title}
                      onClick={() => {
                        router.push(item.href);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-neuro-orange/30 hover:shadow-lg hover:shadow-neuro-orange/5 transition-all group relative overflow-hidden text-left"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${item.color}`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-neuro-navy text-sm uppercase tracking-tight">{item.title}</h4>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.subtitle}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-neuro-orange group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-white border-t border-gray-100 text-center">
                <div className="inline-flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Secure Admin Session Active
                </div>
              </div>
            </motion.div>

            {/* Close Button at bottom */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={() => setIsOpen(false)}
              className="absolute bottom-10 right-10 w-14 h-14 bg-neuro-navy text-white rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 hover:bg-neuro-navy-light transition-colors group"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
