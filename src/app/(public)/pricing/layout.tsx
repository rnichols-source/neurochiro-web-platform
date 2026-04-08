import PricingShell from "./PricingShell";

export const metadata = {
  title: "Pricing | NeuroChiro",
  description: "Membership plans for doctors, students, and patients. Invest in your chiropractic career or health journey.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PricingShell>{children}</PricingShell>;
}
