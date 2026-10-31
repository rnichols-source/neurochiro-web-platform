"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const CookieConsent = dynamic(() => import("@/components/layout/CookieConsent"), { ssr: false });
const PWAInstallPrompt = dynamic(() => import("@/components/layout/PWAInstallPrompt"), { ssr: false });

export default function LazyOverlays() {
  const pathname = usePathname() || "";
  if (
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/portal")
  ) {
    return null;
  }
  return (
    <>
      <PWAInstallPrompt />
      <CookieConsent />
    </>
  );
}
