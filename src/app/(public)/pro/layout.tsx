import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NeuroChiro Pro — Get found by the patients already looking for you",
  description:
    "Directory listing, two interviews, 80-100 short-form clips posted for a year, and a Google Drive folder of everything. $99/month, cancel anytime.",
  openGraph: {
    title: "NeuroChiro Pro — Get found by the patients already looking for you",
    description:
      "Directory listing, two interviews, 80-100 short-form clips posted for a year. $99/month, cancel anytime.",
    url: "https://neurochiro.co/pro",
    siteName: "NeuroChiro",
    images: [
      {
        url: "https://neurochiro.co/og-pro.png",
        width: 1200,
        height: 630,
        alt: "NeuroChiro Pro — $99/month, cancel anytime",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuroChiro Pro — Get found by the patients already looking for you",
    description: "Directory listing, two interviews, 80-100 clips. $99/month.",
    images: ["https://neurochiro.co/og-pro.png"],
  },
  alternates: {
    canonical: "https://neurochiro.co/pro",
  },
};

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
