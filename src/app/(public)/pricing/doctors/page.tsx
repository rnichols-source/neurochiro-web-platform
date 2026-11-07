import DoctorPricing from "./DoctorPricingClient";
import { activeUsdDoctorPlan } from "@/lib/pricing";

// Regenerates through the day so the Dec 1 price shows up without a new deploy.
export const revalidate = 3600;

export default function DoctorPricingPage() {
  return <DoctorPricing plan={activeUsdDoctorPlan()} />;
}
