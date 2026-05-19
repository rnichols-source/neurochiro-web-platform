"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

interface Signup {
  name: string;
  role: string;
  location: string | null;
  createdAt: string;
}

interface LiveSignupFeedProps {
  pollInterval?: number;
  showCounter?: boolean;
}

export default function LiveSignupFeed({ pollInterval = 10000, showCounter = true }: LiveSignupFeedProps) {
  const [todayCount, setTodayCount] = useState(0);
  const [toasts, setToasts] = useState<Signup[]>([]);
  const [currentToast, setCurrentToast] = useState<Signup | null>(null);
  const lastSeenRef = useRef<string>("");
  const toastQueueRef = useRef<Signup[]>([]);

  // Poll for new signups
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/booth/signups");
        if (!res.ok) return;
        const data = await res.json();
        setTodayCount(data.todayCount || 0);

        const signups = (data.signups || []) as Signup[];
        if (signups.length > 0 && signups[0].createdAt !== lastSeenRef.current) {
          // Find new signups since last seen
          const newOnes = lastSeenRef.current
            ? signups.filter(s => s.createdAt > lastSeenRef.current)
            : signups.slice(0, 1); // First load: show latest one

          if (newOnes.length > 0) {
            toastQueueRef.current = [...toastQueueRef.current, ...newOnes];
          }
          lastSeenRef.current = signups[0].createdAt;
        }
      } catch {}
    };

    poll();
    const interval = setInterval(poll, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  // Process toast queue
  useEffect(() => {
    if (currentToast) return; // Wait for current toast to finish

    const interval = setInterval(() => {
      if (toastQueueRef.current.length > 0 && !currentToast) {
        const next = toastQueueRef.current.shift()!;
        setCurrentToast(next);
        // Auto-dismiss after 5 seconds
        setTimeout(() => setCurrentToast(null), 5000);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentToast]);

  return (
    <>
      {/* Toast Notification */}
      <div className="fixed bottom-24 right-4 z-50 max-w-sm">
        <AnimatePresence>
          {currentToast && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="bg-neuro-navy/95 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-neuro-orange/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-neuro-orange" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{currentToast.name}</p>
                <p className="text-gray-400 text-xs">
                  just joined
                  {currentToast.location ? ` from ${currentToast.location}` : ''}
                  {currentToast.role === 'student' ? ' as a student' : ''}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Counter Badge */}
      {showCounter && todayCount > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-neuro-navy/90 backdrop-blur border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white font-bold text-xs">{todayCount} joined today</span>
          </div>
        </div>
      )}
    </>
  );
}
