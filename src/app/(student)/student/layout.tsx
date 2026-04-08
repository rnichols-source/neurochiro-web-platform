"use client";

import Sidebar from "./Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { AuthProvider } from "@/context/AuthContext";
import { LayoutDashboard, MessageSquare, Bell, User, ShieldCheck, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  { name: "Home", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Messages", href: "/student/messages", icon: MessageSquare },
  { name: "Alerts", href: "/student/notifications", icon: Bell },
  { name: "Menu", href: "#", icon: Menu, isMenuTrigger: true },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthProvider>
    <div className="flex flex-col md:flex-row h-screen bg-neuro-cream overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-neuro-navy p-4 flex items-center justify-between z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neuro-orange flex items-center justify-center font-bold text-white text-xl">N</div>
          <span className="text-white font-heading font-bold text-lg tracking-tight">NeuroChiro</span>
        </Link>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'p',
                altKey: true,
                bubbles: true
              });
              window.dispatchEvent(event);
            }}
            className="w-8 h-8 rounded-lg bg-neuro-orange flex items-center justify-center text-white shadow-lg"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xs">
            ST
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-neuro-cream pb-24 md:pb-0">
          {children}
        </main>
      </div>
      <MobileBottomNav 
        items={navItems} 
        onMenuClick={() => setIsSidebarOpen(true)}
      />
    </div>
    </AuthProvider>
  );
}
