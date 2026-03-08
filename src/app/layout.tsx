import type { Metadata } from "next";
import { Lato, Montserrat } from "next/font/google";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "NeuroChiro | Nervous-System-First Chiropractic",
  description: "The global ecosystem for nervous-system-focused chiropractic. Find doctors, educational resources, and career opportunities.",
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
    title: "NeuroChiro | Nervous-System-First Chiropractic",
    description: "The global ecosystem for nervous-system-focused chiropractic.",
    url: "https://neurochiro.com",
    siteName: "NeuroChiro",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "NeuroChiro Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuroChiro",
    description: "The global ecosystem for nervous-system-focused chiropractic.",
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
import { DoctorTierProvider } from "@/context/DoctorTierContext";
import { StudentTierProvider } from "@/context/StudentTierContext";
import { UserPreferencesProvider } from "@/context/UserPreferencesContext";
import PWAInstallPrompt from "@/components/layout/PWAInstallPrompt";
import AdminQuickNav from "@/components/admin/AdminQuickNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lato.variable} ${montserrat.variable} antialiased font-body bg-neuro-cream text-neuro-black`}
      >
        <RegionProvider>
          <DoctorTierProvider>
            <StudentTierProvider>
              <UserPreferencesProvider>
                {children}
                <PWAInstallPrompt />
                <AdminQuickNav />
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                      if ('serviceWorker' in navigator) {
                        window.addEventListener('load', function() {
                          navigator.serviceWorker.register('/sw.js').then(
                            function(registration) {
                              console.log('Service Worker registration successful with scope: ', registration.scope);
                            },
                            function(err) {
                              console.log('Service Worker registration failed: ', err);
                            }
                          );
                        });
                      }
                    `,
                  }}
                />
              </UserPreferencesProvider>
            </StudentTierProvider>
          </DoctorTierProvider>
        </RegionProvider>
      </body>
    </html>
  );
}
