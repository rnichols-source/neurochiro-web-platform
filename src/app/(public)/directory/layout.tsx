import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NeuroChiro Directory | Find Nervous-System-First Specialists",
  description: "Search the global network of elite chiropractic clinics focused on the nervous system. Find a verified NeuroChiro doctor near you.",
  openGraph: {
    title: "NeuroChiro Directory | Find a Specialist",
    description: "Connect with verified nervous-system-focused chiropractors globally.",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuroChiro Directory",
    description: "The global ecosystem for nervous-system-focused chiropractic care.",
    images: ["/logo.png"],
  },
};

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
