"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ActivityTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const trackEvent = (eventType: string, extra: Record<string, string> = {}) => {
      fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, pagePath: pathname, ...extra }),
      }).catch(() => {});
    };

    // Track page views on public pages
    if (pathname === "/" || pathname.startsWith("/directory") || pathname.startsWith("/seminars")) {
      trackEvent("page_view");
    }

    // Track searches
    const location = searchParams.get("location");
    if (pathname === "/directory" && location) {
      trackEvent("search", { searchQuery: location, city: location.split(",")[0]?.trim() || "", state: location.split(",")[1]?.trim() || "" });
    }

    // Track doctor profile views
    if (pathname.startsWith("/directory/") && pathname.split("/").length === 3) {
      const slug = pathname.split("/")[2];
      if (slug && slug !== "search") {
        trackEvent("profile_view");
      }
    }
  }, [pathname, searchParams]);

  return null;
}
