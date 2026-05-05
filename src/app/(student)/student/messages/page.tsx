import { createServerSupabase } from "@/lib/supabase-server";
import MessagingSystem from "@/components/messaging/MessagingSystem";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const { to } = await searchParams;
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-white/35 text-sm mt-1">Connect with doctors and clinics securely.</p>
      </div>

      <div className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-lg shadow-black/20 [&_*]:!border-white/[0.06] [&_.bg-white]:!bg-[#162231] [&_.bg-gray-50]:!bg-[#1a2e40] [&_.text-gray-900]:!text-white [&_.text-gray-800]:!text-white [&_.text-gray-700]:!text-white/70 [&_.text-gray-600]:!text-white/60 [&_.text-gray-500]:!text-white/40 [&_.text-gray-400]:!text-white/30 [&_.text-neuro-navy]:!text-white [&_.bg-gray-100]:!bg-white/[0.04] [&_.bg-gray-200]:!bg-white/[0.06] [&_.border-gray-100]:!border-white/[0.06] [&_.border-gray-200]:!border-white/[0.08] [&_.border-gray-300]:!border-white/[0.08] [&_input]:!bg-white/[0.04] [&_input]:!text-white [&_input]:!border-white/[0.08] [&_input::placeholder]:!text-white/20 [&_.hover\\:bg-gray-50:hover]:!bg-white/[0.04] [&_.hover\\:bg-gray-100:hover]:!bg-white/[0.06]">
        <MessagingSystem currentUserId={user.id} userRole={(profile as any)?.role || 'student'} initialOtherUserId={to} />
      </div>
    </div>
  );
}
