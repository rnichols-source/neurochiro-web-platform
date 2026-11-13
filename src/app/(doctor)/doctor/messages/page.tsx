import MessagingSystem from "@/components/messaging/MessagingSystem";
import { DoctorBand } from "@/components/doctor/chrome";
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
    <div className="flex min-h-0 flex-1 flex-col">
      <DoctorBand
        place="practice"
        title="Messages"
        subtitle="Community members, doctors, and students, all in one inbox."
        bleed={false}
      />
      <MessagingSystem
        fill
        currentUserId={ctx.userId}
        userRole={ctx.role || "doctor"}
        initialOtherUserId={to}
        initialConversationId={c}
        emptyMessage="This inbox is for community members, doctors, and students. Start a conversation, or reply when someone writes to you."
      />
    </div>
  );
}
