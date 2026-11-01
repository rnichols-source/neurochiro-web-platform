import Link from "next/link";
import { LayoutDashboard, Store, LogOut, ChevronRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  let profileHref = "/marketplace";
  if (user) {
    const { data: vendor } = await supabase.from("vendors").select("slug").eq("id", user.id).maybeSingle();
    if (vendor?.slug) profileHref = `/marketplace/${vendor.slug}`;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-neuro-cream md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-neuro-navy md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 px-4 py-3 md:block md:p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neuro-orange text-xl font-bold text-white">N</div>
            <span className="font-heading text-xl font-bold tracking-tight text-white">NeuroChiro</span>
          </Link>
          <nav className="ml-auto flex gap-1 md:ml-0 md:mt-6 md:block md:space-y-2 md:px-0">
            <Link href="/vendor/dashboard" className="flex min-h-11 items-center gap-2 rounded-lg bg-neuro-orange px-3 text-white md:gap-3">
              <LayoutDashboard className="h-5 w-5 text-white" />
              <span className="text-sm font-medium">Dashboard</span>
              <ChevronRight className="ml-auto hidden h-4 w-4 md:block" />
            </Link>
            <Link href={profileHref} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-gray-400 transition-colors hover:bg-white/5 hover:text-white md:gap-3">
              <Store className="h-5 w-5" />
              <span className="text-sm font-medium">Public Profile</span>
            </Link>
          </nav>
        </div>

        <div className="mt-auto hidden items-center gap-3 border-t border-white/10 p-4 md:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-white">
            V
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">Partner Vendor</p>
            <p className="truncate text-[10px] text-gray-400">Settings</p>
          </div>
          <button className="text-gray-400 hover:text-white" type="button" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <main className="relative min-h-0 flex-1 overflow-y-auto scroll-smooth bg-neuro-cream">
        {children}
      </main>
    </div>
  );
}