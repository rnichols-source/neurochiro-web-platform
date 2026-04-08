"use client";

import dynamic from "next/dynamic";

const CookieConsent = dynamic(() => import("@/components/layout/CookieConsent"), { ssr: false });
const PWAInstallPrompt = dynamic(() => import("@/components/layout/PWAInstallPrompt"), { ssr: false });

export default function LazyOverlays() {
  return (
    <>
      <PWAInstallPrompt />
      <CookieConsent />
    </>
  );
}
