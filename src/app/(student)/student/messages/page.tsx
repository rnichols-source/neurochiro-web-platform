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
        <h1 className="text-2xl font-bold text-[#16222D]">Messages</h1>
        <p className="text-[#5A6873] text-sm mt-1">Your conversations with doctors in the network.</p>
      </div>

      <div className="rounded-2xl overflow-hidden border border-[#DDE2E5] [&_*]:!border-[#DDE2E5] [&_.bg-white]:!bg-[#F7F8F9] [&_.bg-gray-50]:!bg-[#F7F8F9] [&_.text-gray-900]:!text-[#16222D] [&_.text-gray-800]:!text-[#16222D] [&_.text-gray-700]:!text-[#5A6873] [&_.text-gray-600]:!text-[#5A6873] [&_.text-gray-500]:!text-[#5A6873] [&_.text-gray-400]:!text-[#5A6873] [&_.text-neuro-navy]:!text-[#16222D] [&_.bg-gray-100]:!bg-[#F7F8F9] [&_.bg-gray-200]:!bg-[#EFF1F2] [&_.border-gray-100]:!border-[#DDE2E5] [&_.border-gray-200]:!border-[#DDE2E5] [&_.border-gray-300]:!border-[#DDE2E5] [&_input]:!bg-[#F7F8F9] [&_input]:!text-[#16222D] [&_input]:!border-[#DDE2E5] [&_input::placeholder]:!text-[#5A6873]/40 [&_.hover\\:bg-gray-50:hover]:!bg-[#F7F8F9] [&_.hover\\:bg-gray-100:hover]:!bg-[#EFF1F2]">
        <MessagingSystem currentUserId={user.id} userRole={(profile as any)?.role || 'student'} initialOtherUserId={to} />
      </div>
    </div>
  );
}
