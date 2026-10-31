import MessagingSystem from "@/components/messaging/MessagingSystem";
import PageHeader from "@/components/portal/PageHeader";
import { getPortalContext } from "@/lib/portal/context";
import { portalTimer } from "@/lib/portal/timing";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ to?: string; c?: string }> }) {
  const done = portalTimer("messages");
  const [{ to, c }, ctx] = await Promise.all([searchParams, getPortalContext()]);
  done();

  if (!ctx) {
    redirect("/login");
  }

  return (
    <MessagingSystem
      fill
      currentUserId={ctx.userId}
      userRole={ctx.role || "doctor"}
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
