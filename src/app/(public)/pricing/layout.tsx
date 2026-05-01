import PricingShell from "./PricingShell";

export const metadata = {
  title: "Pricing | NeuroChiro",
  description: "Join NeuroChiro for free. Upgrade to unlock premium tools for your practice or career.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PricingShell>{children}</PricingShell>;
}
