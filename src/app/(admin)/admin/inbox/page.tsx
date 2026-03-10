import { createServerSupabase } from "@/lib/supabase-server";
import MessagingSystem from "@/components/messaging/MessagingSystem";
import { redirect } from "next/navigation";

export default async function AdminInboxPage({ searchParams }: { searchParams: { to?: string } }) {
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

  if (profile?.role !== 'admin') {
    redirect("/login");
  }

  return (
    <div className="p-4 lg:p-8 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">Admin Inbox</h1>
        <p className="text-gray-400 mt-2">Manage all platform communications and member support.</p>
      </div>
      
      <div className="flex-1 min-h-0">
        <MessagingSystem currentUserId={user.id} userRole="admin" initialOtherUserId={searchParams.to} />
      </div>
    </div>
  );
}
