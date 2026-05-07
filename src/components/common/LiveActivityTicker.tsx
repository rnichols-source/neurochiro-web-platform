"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Eye, Users, MapPin } from "lucide-react";

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
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Rotate through ticker items
  useEffect(() => {
    if (!stats) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % getTickerItems(stats).length);
    }, 6000);
    return () => clearInterval(interval);
  }, [stats]);

  if (!stats || !isVisible) return null;

  const items = getTickerItems(stats);
  if (items.length === 0) return null;

  const currentItem = items[activeIndex % items.length];

  return (
    <div className="bg-neuro-navy/95 backdrop-blur-sm border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 min-h-[36px]">
        {/* Pulse dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>

        {/* Ticker content with fade transition */}
        <div className="overflow-hidden relative h-5 flex-1 max-w-md">
          <div
            key={activeIndex}
            className="flex items-center gap-2 justify-center animate-fade-in-up"
          >
            <currentItem.icon className="w-3.5 h-3.5 text-neuro-orange shrink-0" />
            <span className="text-xs text-gray-300 font-medium truncate">
              {currentItem.text}
            </span>
          </div>
        </div>
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

  // Add recent search locations
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
