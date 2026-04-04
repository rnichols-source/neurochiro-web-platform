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

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">Direct Messages</h1>
        <p className="text-gray-400 mt-2">Connect with students, doctors, and the NeuroChiro team securely.</p>
      </div>

      <MessagingSystem currentUserId={user.id} userRole={(profile as any)?.role || 'doctor'} initialOtherUserId={to} />
    </div>
  );
}
