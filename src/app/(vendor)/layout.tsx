import Link from "next/link";
import { LayoutDashboard, Store, LogOut, ChevronRight } from "lucide-react";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-neuro-cream overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-neuro-navy flex flex-col border-r border-white/10 shrink-0">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neuro-orange flex items-center justify-center font-bold text-white text-xl">N</div>
            <span className="text-white font-heading font-bold text-xl tracking-tight">NeuroChiro</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/vendor/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neuro-orange text-white">
            <LayoutDashboard className="w-5 h-5 text-white" />
            <span className="font-medium text-sm">Dashboard</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Link>
          <Link href="/marketplace" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Store className="w-5 h-5" />
            <span className="font-medium text-sm">Public Profile</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xs">
            V
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Partner Vendor</p>
            <p className="text-[10px] text-gray-400 truncate">Settings</p>
          </div>
          <button className="text-gray-400 hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth bg-neuro-cream">
        {children}
      </main>
    </div>
  );
}