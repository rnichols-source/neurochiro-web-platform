"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";
import {
  LayoutDashboard,
  Activity,
  Search,
  BookOpen,
  Heart,
  LogOut,
} from "lucide-react";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

const navItems = [
  { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { name: "Find a Doctor", href: "/directory", icon: Search },
  { name: "Saved", href: "/portal/saved", icon: Heart },
  { name: "Health Tracker", href: "/portal/track", icon: Activity },
  { name: "Learn", href: "/portal/learn", icon: BookOpen },
];

function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) setFullName(data.full_name);
      });
  }, [user?.id]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex h-dvh bg-neuro-cream overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-neuro-navy text-white hidden md:flex flex-col border-r border-white/10">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-neuro-orange text-white shadow-lg shadow-neuro-orange/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          {fullName && (
            <p className="px-4 text-sm font-medium text-gray-300 truncate">{fullName}</p>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-8 md:px-12 shrink-0">
          <h2 className="text-xl font-black text-neuro-navy uppercase tracking-tight">
            {navItems.find((i) => i.href === pathname)?.name || "Portal"}
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 w-full min-w-0 pb-24 md:pb-10">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </div>
      </main>

      <MobileBottomNav items={navItems} />
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortalShell>{children}</PortalShell>
    </AuthProvider>
  );
}
