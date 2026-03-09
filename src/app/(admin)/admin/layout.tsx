"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { Menu, Bell, Search, User } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Admin Header */}
        <header className="h-16 lg:h-20 bg-[#0F172A] border-b border-white/5 flex items-center justify-between px-4 lg:px-8 shrink-0 z-40">
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
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live Engine</span>
            </div>
            
            <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-neuro-orange rounded-full border-2 border-[#0F172A]" />
            </button>
            
            <div className="h-8 w-px bg-white/5 mx-2 hidden sm:block" />
            
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white group-hover:text-neuro-orange transition-colors">Raymond Nichols</p>
                <p className="text-[10px] text-gray-500 font-medium">Platform Architect</p>
              </div>
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-neuro-orange to-orange-600 flex items-center justify-center text-white font-black shadow-lg shadow-neuro-orange/20 border border-white/10 group-hover:scale-105 transition-transform">
                RN
              </div>
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
  );
}
