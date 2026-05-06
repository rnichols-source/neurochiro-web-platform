import { createServerSupabase } from "@/lib/supabase-server";
import MessagingSystem from "@/components/messaging/MessagingSystem";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function PatientMessagesPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const { to } = await searchParams;
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-xs text-white/35 mt-1">Connect with your doctors securely.</p>
      </header>

      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 overflow-hidden [&_.bg-white]:!bg-[#162231] [&_.border-gray-100]:!border-white/[0.08] [&_.border-gray-200]:!border-white/[0.08] [&_.text-gray-900]:!text-white [&_.text-gray-800]:!text-white/70 [&_.text-gray-700]:!text-white/60 [&_.text-gray-600]:!text-white/50 [&_.text-gray-500]:!text-white/40 [&_.text-gray-400]:!text-white/35 [&_.bg-gray-50]:!bg-white/[0.04] [&_.bg-gray-100]:!bg-white/[0.06] [&_.bg-gray-200]:!bg-white/[0.08]" style={{ minHeight: '500px' }}>
        <MessagingSystem currentUserId={user.id} userRole="patient" initialOtherUserId={to} />
      </div>
    </div>
  );
}
