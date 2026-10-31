"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Cookie } from "lucide-react";

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
    return () => {
      delete document.documentElement.dataset.cookieBar;
    };
  }, [isVisible]);

  const acceptCookies = () => {
    localStorage.setItem("nc_cookie_consent", "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed inset-x-0 bottom-0 z-[200] md:inset-x-auto md:bottom-8 md:right-8 md:w-[400px]"
        >
          <div className="flex h-[72px] max-h-[72px] items-center gap-3 border-t border-white/10 bg-neuro-navy px-4 text-white md:hidden">
            <p className="min-w-0 flex-1 truncate text-sm">Cookies help this directory work.</p>
            <button type="button" onClick={acceptCookies} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neuro-orange px-4 text-sm font-bold">
              OK
            </button>
            <Link href="/privacy" className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-bold">
              Settings
            </Link>
          </div>

          <div className="hidden rounded-[2rem] border border-white/10 bg-neuro-navy p-8 shadow-2xl shadow-black/50 backdrop-blur-xl md:block">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neuro-orange/20 text-neuro-orange">
                <Cookie className="h-6 w-6" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold text-white">Cookie Preferences</h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  We use cookies to optimize your directory experience and analyze our global network traffic.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={acceptCookies}
                className="w-full rounded-xl bg-neuro-orange py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-neuro-orange-light active:scale-95"
              >
                Accept All
              </button>
              <div className="flex items-center justify-between px-2">
                <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:text-white">
                  Privacy Policy
                </Link>
                <button
                  type="button"
                  onClick={() => setIsVisible(false)}
                  className="text-[10px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:text-white"
                >
                  Essential Only
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
