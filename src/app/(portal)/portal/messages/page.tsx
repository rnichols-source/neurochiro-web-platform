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
        <h1 className="text-3xl font-heading font-black text-neuro-navy uppercase tracking-tight">Messages</h1>
        <p className="text-gray-500 mt-1">Connect with your doctors securely.</p>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ minHeight: '500px' }}>
        <MessagingSystem currentUserId={user.id} userRole="patient" initialOtherUserId={to} />
      </div>
    </div>
  );
}
