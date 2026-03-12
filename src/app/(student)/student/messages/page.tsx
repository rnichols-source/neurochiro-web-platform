import { createServerSupabase } from "@/lib/supabase-server";
import MessagingSystem from "@/components/messaging/MessagingSystem";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function StudentMessagesPage({ searchParams }: { searchParams: { to?: string } }) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black text-neuro-navy uppercase tracking-tight">Direct Messages</h1>
        <p className="text-gray-500 mt-2">Connect with doctors and clinics securely.</p>
      </div>
      
      <MessagingSystem currentUserId={user.id} userRole={profile?.role || 'student'} initialOtherUserId={searchParams.to} />
    </div>
  );
}
