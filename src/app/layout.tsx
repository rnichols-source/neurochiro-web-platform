import type { Metadata } from "next";
import { Lato, Montserrat } from "next/font/google";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: 'swap',
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.neurochiro.co"),
  title: "NeuroChiro | Find a Nervous System Chiropractor Near You",
  description: "Free directory of verified nervous system chiropractors. Search by city or ZIP, compare doctors, and request an appointment online.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "NeuroChiro | Find a Nervous System Chiropractor Near You",
    description: "Free directory of verified nervous system chiropractors. Search by city or ZIP, compare doctors, and request an appointment online.",
    url: "https://www.neurochiro.co",
    siteName: "NeuroChiro",
    images: [
      {
        url: "/logo.png",
        width: 1000,
        height: 1000,
        alt: "NeuroChiro",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuroChiro | Find a Nervous System Chiropractor Near You",
    description: "Free directory of verified nervous system chiropractors. Search by city or ZIP, compare doctors, and request an appointment online.",
    images: ["/logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NeuroChiro",
  },
};

export const viewport = {
  themeColor: "#0B1118",
};

import { RegionProvider } from "@/context/RegionContext";
import { UserPreferencesProvider } from "@/context/UserPreferencesContext";
import LazyOverlays from "@/components/layout/LazyOverlays";
import RecoveryRedirect from "@/components/auth/RecoveryRedirect";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "NeuroChiro",
        "url": "https://www.neurochiro.co",
        "logo": "https://www.neurochiro.co/logo.png",
        "sameAs": [
          "https://facebook.com/neurochiro",
          "https://instagram.com/neurochiro",
          "https://twitter.com/neurochiro",
          "https://www.linkedin.com/company/neurochiro"
        ],
        "description": "Free directory of verified nervous system chiropractors."
      },
      {
        "@type": "WebSite",
        "name": "NeuroChiro",
        "url": "https://www.neurochiro.co",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://www.neurochiro.co/directory?location={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://gddapefwrmucimpdhjrz.supabase.co" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://events.mapbox.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className={`${lato.variable} ${montserrat.variable} antialiased font-body bg-neuro-cream text-neuro-black`}
      >
        <RegionProvider>
          <UserPreferencesProvider>
            <RecoveryRedirect />
            {children}
            <LazyOverlays />
          </UserPreferencesProvider>
        </RegionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}`
          }}
        />
      </body>
    </html>
  );
}
