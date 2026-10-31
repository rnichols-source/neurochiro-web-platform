import { createServerSupabase } from "@/lib/supabase-server";
import MessagingSystem from "@/components/messaging/MessagingSystem";
import PageHeader from "@/components/portal/PageHeader";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ to?: string; c?: string }> }) {
  const { to, c } = await searchParams;
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
    <MessagingSystem
      fill
      currentUserId={user.id}
      userRole={(profile as { role?: string } | null)?.role || 'doctor'}
      initialOtherUserId={to}
      initialConversationId={c}
      header={
        <PageHeader
          title="Messages"
          description="Conversations with patients, doctors and the NeuroChiro team."
        />
      }
    />
  );
}
