import PricingShell from "./PricingShell";

export const metadata = {
  title: "Pricing | NeuroChiro",
  description: "Simple pricing for doctors, students, and patients. Plans that grow with your practice.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PricingShell>{children}</PricingShell>;
}
