"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share, X, Download, Smartphone, Info } from "lucide-react";

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    // Check if iOS (including modern iPads)
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Check if Safari (to show "Add to Home Screen/Dock" instructions)
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    setIsSafari(isSafariBrowser);

    console.log("[PWA] Status:", { isStandaloneMode, isIOSDevice, isSafariBrowser });

    // Capture the install prompt event
    const handleBeforeInstallPrompt = (e: any) => {
      console.log("[PWA] beforeinstallprompt event fired");
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Logic to show prompt (e.g., after 5 seconds)
      const hasSeenPrompt = localStorage.getItem('nc_pwa_prompt_seen');
      if (!isStandaloneMode && !hasSeenPrompt) {
        console.log("[PWA] Scheduling prompt display in 5s");
        setTimeout(() => setShowPrompt(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If it's a device where we can't capture the event (iOS or Safari MacOS)
    // we show the instructions anyway because we can't trigger the native prompt
    if ((isIOSDevice || isSafariBrowser) && !isStandaloneMode && !localStorage.getItem('nc_pwa_prompt_seen')) {
      console.log("[PWA] iOS or Safari detected, scheduling manual instructions in 5s");
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []); // Run once on mount

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.warn("[PWA] handleInstallClick called but deferredPrompt is null");
      setDebugInfo("Please use your browser's menu to 'Install' or 'Add to Home Screen'.");
      return;
    }

    try {
      // Show the install prompt
      console.log("[PWA] Triggering native install prompt");
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] User responded to the install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
        localStorage.setItem('nc_pwa_prompt_seen', 'true');
      }
    } catch (err) {
      console.error("[PWA] Error during installation:", err);
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  const closePrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('nc_pwa_prompt_seen', 'true');
  };

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-[1000] md:left-auto md:right-10 md:w-96"
        >
          <div className="bg-neuro-navy text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden group">
            
            <button 
              onClick={closePrompt}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-neuro-orange rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-lg leading-tight uppercase tracking-tight">Install NeuroChiro</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Add to your home screen for instant access to clinical tools and real-time alerts.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
              {isIOS ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                    Tap <Share className="w-4 h-4 text-neuro-orange" /> then <span className="text-white">"Add to Home Screen"</span>
                  </div>
                </div>
              ) : isSafari ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                    Go to <span className="text-white">File</span> menu then <span className="text-white">"Add to Dock..."</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button 
                    onClick={handleInstallClick}
                    className="w-full py-3 bg-neuro-orange text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-neuro-orange/20 active:scale-95 transition-transform"
                  >
                    Install App
                  </button>
                  {debugInfo && (
                    <div className="flex items-center gap-2 text-[10px] text-neuro-orange font-bold uppercase tracking-wider animate-pulse">
                      <Info className="w-3 h-3" />
                      {debugInfo}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
