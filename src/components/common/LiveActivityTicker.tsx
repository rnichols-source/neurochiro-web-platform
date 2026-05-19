"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Eye, Users, MapPin, X } from "lucide-react";

interface LiveStats {
  searchesLastHour: number;
  profileViewsLastHour: number;
  patientsConnectedThisWeek: number;
  recentSearchLocations: { city: string; state: string }[];
}

interface TickerItem {
  icon: typeof Search;
  text: string;
}

export default function LiveActivityTicker() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchStats = useCallback(() => {
    fetch("/api/activity/live")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setIsVisible(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    if (!stats) return;
    const items = getTickerItems(stats);
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [stats]);

  if (!stats || !isVisible || dismissed) return null;

  const items = getTickerItems(stats);
  if (items.length === 0) {
    items.push({
      icon: Users,
      text: "Patients are searching for nervous system chiropractors right now",
    });
  }

  const currentItem = items[activeIndex % items.length];

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[90] animate-fade-in-up">
      <div className="bg-neuro-navy/95 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-2xl">
        {/* Pulse dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>

        {/* Ticker content */}
        <div className="overflow-hidden relative h-5 max-w-[280px] sm:max-w-sm">
          <div
            key={activeIndex}
            className="flex items-center gap-2 animate-fade-in-up"
          >
            <currentItem.icon className="w-3.5 h-3.5 text-neuro-orange shrink-0" />
            <span className="text-xs text-gray-300 font-medium whitespace-nowrap">
              {currentItem.text}
            </span>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-gray-300 transition-colors ml-1"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function getTickerItems(stats: LiveStats): TickerItem[] {
  const items: TickerItem[] = [];

  if (stats.searchesLastHour > 0) {
    items.push({
      icon: Search,
      text: `${stats.searchesLastHour} ${stats.searchesLastHour === 1 ? "person" : "people"} searching for a chiropractor right now`,
    });
  }

  if (stats.profileViewsLastHour > 0) {
    items.push({
      icon: Eye,
      text: `${stats.profileViewsLastHour} doctor ${stats.profileViewsLastHour === 1 ? "profile" : "profiles"} viewed in the last hour`,
    });
  }

  if (stats.patientsConnectedThisWeek > 0) {
    items.push({
      icon: Users,
      text: `${stats.patientsConnectedThisWeek} patients found their doctor this week`,
    });
  }

  if (stats.recentSearchLocations.length > 0) {
    const location = stats.recentSearchLocations[0];
    const locationText = location.state
      ? `${location.city}, ${location.state}`
      : location.city;
    items.push({
      icon: MapPin,
      text: `Someone in ${locationText} just searched for a chiropractor`,
    });
  }

  return items;
}
