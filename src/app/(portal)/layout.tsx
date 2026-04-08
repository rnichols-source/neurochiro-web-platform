"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  Activity, 
  Search, 
  BookOpen, 
  UserCircle, 
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  Heart,
  MessageSquare,
  Bell as BellIcon
} from "lucide-react";
import { motion } from "framer-motion";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

const navItems = [
  { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { name: "Find a Doctor", href: "/directory", icon: Search },
  { name: "Saved", href: "/portal/saved", icon: Heart },
  { name: "Health Tracker", href: "/portal/track", icon: Activity },
  { name: "Learn", href: "/portal/learn", icon: BookOpen },
];

const mobileNavItems = [
  { name: "Home", href: "/portal/dashboard", icon: LayoutDashboard },
  { name: "Messages", href: "/portal/messages", icon: MessageSquare },
  { name: "Alerts", href: "/portal/notifications", icon: BellIcon },
  { name: "Profile", href: "/portal/settings", icon: UserCircle },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const handleSupport = () => {
    alert("Support ticket system opening... How can we help you today?");
  };

  return (
    <AuthProvider>
    <div className="flex h-dvh bg-neuro-cream overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-neuro-navy text-white hidden md:flex flex-col border-r border-white/10">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 group">
            <img loading="lazy" decoding="async" src="/logo-white.png" alt="NeuroChiro" className="w-8 h-8 object-contain" />
            <span className="text-xl font-heading font-black tracking-tight text-white">
              NEURO<span className="text-neuro-orange">CHIRO</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? "bg-neuro-orange text-white shadow-lg shadow-neuro-orange/20" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "group-hover:text-neuro-orange transition-colors"}`} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
           <button 
             onClick={handleSupport}
             className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors"
           >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Support & Help</span>
           </button>
           <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 md:px-12 shrink-0">
          <h2 className="text-xl font-black text-neuro-navy uppercase tracking-tight">
            {navItems.find(i => i.href === pathname)?.name || "Portal"}
          </h2>
          <div className="flex items-center gap-6">
            <button className="p-2.5 bg-gray-50 text-gray-400 hover:text-neuro-orange hover:bg-neuro-cream rounded-xl transition-all relative">
               <Bell className="w-5 h-5" />
               <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-neuro-orange rounded-full border-2 border-white" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-neuro-navy flex items-center justify-center text-white font-black text-xs shadow-lg">
               JD
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 w-full min-w-0 pb-24 md:pb-10">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

      <MobileBottomNav items={mobileNavItems} />
    </div>
    </AuthProvider>
  );
}
