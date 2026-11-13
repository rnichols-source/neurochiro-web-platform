import UpgradeGate from "@/components/doctor/UpgradeGate";
import { getPortalContext } from "@/lib/portal/context";
import { getDoctorTimezone } from "@/lib/doctor-timezone";
import { loadLeadPipeline } from "./pipeline";
import { portalTimer } from "@/lib/portal/timing";
import LeadsBoard from "./LeadsBoard";

export default async function LeadsPage() {
  const ctx = await getPortalContext();
  const timeZone = getDoctorTimezone(ctx?.doctor?.state ?? null, ctx?.doctor?.country ?? null, "America/New_York") || "America/New_York";
  const done = portalTimer("leads");
  const initial = ctx?.doctor ? await loadLeadPipeline(ctx.doctor.id) : null;
  done();
  return (
    <UpgradeGate feature="Directory requests" requiredTier="pro" description="Track people who asked to book, from the first note through a visit.">
      <LeadsBoard initial={initial} timeZone={timeZone} />
    </UpgradeGate>
  );
}
