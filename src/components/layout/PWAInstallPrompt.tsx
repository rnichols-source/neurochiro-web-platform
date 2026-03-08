"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share, X, Download, Smartphone } from "lucide-react";

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Capture the install prompt event
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Logic to show prompt (e.g., after 5 seconds)
      const hasSeenPrompt = localStorage.getItem('nc_pwa_prompt_seen');
      if (!isStandaloneMode && !hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If it's iOS, we show the prompt anyway because we can't capture the event
    if (isIOSDevice && !isStandaloneMode && !localStorage.getItem('nc_pwa_prompt_seen')) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install');
    } else {
      console.log('User dismissed the PWA install');
    }

    // Clear the deferred prompt so it can be used only once
    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('nc_pwa_prompt_seen', 'true');
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/10 blur-3xl pointer-events-none"></div>
            
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
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                  Tap <Share className="w-4 h-4 text-neuro-orange" /> then <span className="text-white">"Add to Home Screen"</span>
                </div>
              ) : (
                <button 
                  onClick={handleInstallClick}
                  className="w-full py-3 bg-neuro-orange text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-neuro-orange/20 active:scale-95 transition-transform"
                >
                  Install App
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
