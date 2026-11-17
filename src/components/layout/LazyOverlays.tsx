"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const CookieConsent = dynamic(() => import("@/components/layout/CookieConsent"), { ssr: false });
const PWAInstallPrompt = dynamic(() => import("@/components/layout/PWAInstallPrompt"), { ssr: false });

export default function LazyOverlays() {
  const pathname = usePathname() || "";
  const applyForm = pathname === "/doctor/apply";
  if (
    (pathname.startsWith("/doctor") && !applyForm) ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/portal")
  ) {
    return null;
  }
  return (
    <>
      {applyForm ? null : <PWAInstallPrompt />}
      <CookieConsent />
    </>
  );
}
