import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Patient List | NeuroChiro",
  description:
    "No nervous system chiropractor near you yet? Join the list. Get weekly education and be the first to know when a NeuroChiro doctor joins your area.",
  openGraph: {
    title: "Join the Patient List | NeuroChiro",
    description:
      "No nervous system chiropractor near you yet? Join the list. Get weekly education and be the first to know when a NeuroChiro doctor joins your area.",
    url: "https://neurochiro.co/list",
    siteName: "NeuroChiro",
    images: [
      {
        url: "https://neurochiro.co/og-patient-list.png",
        width: 1200,
        height: 630,
        alt: "NeuroChiro Patient List — Get notified when a doctor joins your area",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Join the Patient List | NeuroChiro",
    description:
      "No nervous system chiropractor near you yet? Join the list.",
    images: ["https://neurochiro.co/og-patient-list.png"],
  },
};

export default function ListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
