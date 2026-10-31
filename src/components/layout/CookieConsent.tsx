"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("nc_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (isVisible) document.documentElement.dataset.cookieBar = "1";
    else delete document.documentElement.dataset.cookieBar;
    document.body.style.paddingBottom = isVisible ? "5.5rem" : "";
    return () => {
      delete document.documentElement.dataset.cookieBar;
      document.body.style.paddingBottom = "";
    };
  }, [isVisible]);

  const acceptCookies = () => {
    localStorage.setItem("nc_cookie_consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] border-t border-white/10 bg-neuro-navy text-white md:inset-x-auto md:bottom-4 md:left-4 md:w-[360px] md:max-w-[360px] md:rounded-2xl md:border">
      <div className="flex max-h-20 flex-wrap items-center gap-2 px-4 py-2 md:max-h-[120px] md:py-3">
        <p className="min-w-0 flex-1 text-sm leading-snug text-gray-300">
          We use cookies to make search work.
        </p>
        <button
          type="button"
          onClick={acceptCookies}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neuro-orange-ink px-4 text-sm font-bold text-white"
        >
          OK
        </button>
        <Link href="/privacy" className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-bold text-white">
          Settings
        </Link>
      </div>
    </div>
  );
}
