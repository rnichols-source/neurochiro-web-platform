"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { Menu, Bell, Search, User, LogOut, Settings, ChevronDown, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import PerspectiveBanner from "@/components/admin/PerspectiveBanner";
import NotificationBell from "@/components/layout/NotificationBell";
import { logoutAdmin, triggerEmergencyLockdown } from "./SidebarActions";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import AdminSettingsModal from "@/components/admin/AdminSettingsModal";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLockingDown, setIsLockingDown] = useState(false);
  const [userRole, setUserRole] = useState('admin');
  const [userName, setUserName] = useState('Administrator');
  const pathname = usePathname();
  const router = useRouter();

  // Close sidebar and profile on mobile when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  // Fetch real user data
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single();
        
        let role = profile?.role || 'admin';
        // 🛡️ MASTER FOUNDER OVERRIDE
        if (user.email === 'drray@neurochirodirectory.com' || user.email === 'raymond@neurochiro.com') {
          role = 'founder';
          setUserName('Raymond Nichols');
        } else {
          setUserName(profile?.full_name || 'Administrator');
        }
        setUserRole(role);
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out of Admin OS?")) {
      await logoutAdmin();
      // Clear demo role cookie if it exists
      document.cookie = "nc_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push('/login');
      router.refresh();
    }
  };

  const handleEmergencyLockdown = async () => {
    if (confirm("CRITICAL ACTION: This will revoke all active sessions and place the platform in maintenance mode. Proceed?")) {
      setIsLockingDown(true);
      await triggerEmergencyLockdown();
      setTimeout(() => {
        setIsLockingDown(false);
        setIsSettingsOpen(false);
        alert("Emergency Lockdown Protocol Active.");
      }, 2000);
    }
  };

  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  const handleGlobalSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && globalSearchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(globalSearchQuery.trim())}`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] overflow-hidden">
      <PerspectiveBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onSettingsOpen={() => setIsSettingsOpen(true)}
        />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Admin Header */}
          <header className="h-16 lg:h-20 bg-[#0F172A] border-b border-white/5 flex items-center justify-between px-4 lg:px-8 shrink-0 z-50">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl w-96 group focus-within:border-neuro-orange/50 transition-all">
                <Search className="w-4 h-4 text-gray-500 group-focus-within:text-neuro-orange" />
                <input 
                  type="text" 
                  placeholder="Search platform resources..." 
                  className="bg-transparent border-none focus:outline-none text-sm text-white w-full placeholder:text-gray-500"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  onKeyDown={handleGlobalSearch}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 lg:gap-6">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live Engine</span>
              </div>
              
              <NotificationBell />
              
              <div className="h-8 w-px bg-white/5 mx-2 hidden sm:block" />
              
              <div className="relative profile-menu">
                <div 
                  className="flex items-center gap-3 group cursor-pointer"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-white group-hover:text-neuro-orange transition-colors">{userName}</p>
                    <p className="text-[10px] text-gray-500 font-medium capitalize">{userRole.replace('_', ' ')}</p>
                  </div>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-neuro-orange to-orange-600 flex items-center justify-center text-white font-black shadow-lg shadow-neuro-orange/20 border border-white/10 group-hover:scale-105 transition-transform relative">
                    {userName.split(' ').map(n => n[0]).join('')}
                    {isProfileOpen && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#0F172A] rounded-full" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-[110]" 
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-64 bg-[#1E293B] rounded-2xl shadow-2xl border border-white/5 overflow-hidden z-[120]"
                      >
                        <div className="p-4 border-b border-white/5 bg-white/5">
                          <p className="text-xs font-bold text-white">{userName}</p>
                          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 capitalize">
                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                            {userRole.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="p-2">
                          <button 
                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all text-sm font-bold text-gray-300 hover:text-white"
                            onClick={() => {
                              setIsSettingsOpen(true);
                              setIsProfileOpen(false);
                            }}
                          >
                            <Settings className="w-4 h-4 text-gray-500" />
                            Admin Settings
                          </button>
                          <button 
                            className="w-full flex items-center gap-3 p-3 hover:bg-red-500/10 rounded-xl transition-all text-sm font-bold text-red-400 hover:text-red-500"
                            onClick={handleLogout}
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto relative scroll-smooth bg-[#020617]">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                 style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            <div className="relative z-10 min-h-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      <AdminSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onEmergencyLockdown={handleEmergencyLockdown}
      />

      {/* Global Lockdown Overlay */}
      <AnimatePresence>
        {isLockingDown && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-red-950 flex flex-col items-center justify-center text-white text-center p-10"
          >
            <AlertTriangle className="w-24 h-24 text-white animate-bounce mb-8" />
            <h1 className="text-6xl font-black mb-4">EMERGENCY LOCKDOWN</h1>
            <p className="text-red-200 text-xl max-w-2xl font-medium">All platform services are being suspended. Security tokens are being revoked across all nodes. Stand by for encrypted confirmation.</p>
            <Loader2 className="w-10 h-10 animate-spin mt-12 text-white/50" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
