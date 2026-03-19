"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("nc_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

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
          className="fixed bottom-8 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[200]"
        >
          <div className="bg-neuro-navy border border-white/10 rounded-[2rem] p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-neuro-orange/20 rounded-2xl flex items-center justify-center text-neuro-orange shrink-0">
                <Cookie className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Cookie Preferences</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  We use cookies to optimize your directory experience and analyze our global network traffic.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={acceptCookies}
                className="w-full py-4 bg-neuro-orange hover:bg-neuro-orange-light text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all active:scale-95"
              >
                Accept All
              </button>
              <div className="flex justify-between items-center px-2">
                <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <button 
                  onClick={() => setIsVisible(false)}
                  className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
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
