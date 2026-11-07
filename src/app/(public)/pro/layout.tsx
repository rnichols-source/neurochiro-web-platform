import type { Metadata } from "next";
import { activeUsdDoctorPlan } from "@/lib/pricing";

// The page body already regenerates every 5 minutes. Match that so the
// title and description pick up the Dec 1 price with the rest of /pro.
export const revalidate = 300;

export function generateMetadata(): Metadata {
  const monthly = activeUsdDoctorPlan().perMonthSlash;
  return {
  title: "NeuroChiro Pro — Get found by the patients already looking for you",
  description:
    `Directory listing, two interviews, 80-100 short-form clips posted for a year, and a Google Drive folder of everything. ${monthly}, cancel anytime.`,
  openGraph: {
    title: "NeuroChiro Pro — Get found by the patients already looking for you",
    description:
      `Directory listing, two interviews, 80-100 short-form clips posted for a year. ${monthly}, cancel anytime.`,
    url: "https://www.neurochiro.co/pro",
    siteName: "NeuroChiro",
    images: [
      {
        url: "https://www.neurochiro.co/og-pro.png",
        width: 1200,
        height: 630,
        alt: `NeuroChiro Pro — ${monthly}, cancel anytime`,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuroChiro Pro — Get found by the patients already looking for you",
    description: `Directory listing, two interviews, 80-100 clips. ${monthly}.`,
    images: ["https://www.neurochiro.co/og-pro.png"],
  },
  alternates: {
    canonical: "https://www.neurochiro.co/pro",
  },
  };
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
