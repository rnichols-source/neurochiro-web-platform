"use client";

import { useState, useEffect, useMemo } from "react";
import { Bell, CheckCheck, Briefcase, Heart, TrendingUp, Settings, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

const NOTIFICATION_CATEGORIES = {
  all: { label: "All", icon: Bell },
  job: { label: "Jobs", icon: Briefcase },
  mentor: { label: "Mentors", icon: Heart },
  progress: { label: "Progress", icon: TrendingUp },
  system: { label: "System", icon: Settings },
} as const;

type CategoryKey = keyof typeof NOTIFICATION_CATEGORIES;

function getCategory(n: any): CategoryKey {
  const type = (n.type || "").toLowerCase();
  const title = (n.title || "").toLowerCase();
  if (type.includes("job") || title.includes("job") || title.includes("position") || title.includes("application")) return "job";
  if (type.includes("mentor") || title.includes("mentor") || title.includes("doctor")) return "mentor";
  if (type.includes("progress") || type.includes("milestone") || title.includes("course") || title.includes("complete") || title.includes("achievement")) return "progress";
  return "system";
}

function getActionLink(n: any): string | null {
  if (n.link) return n.link;
  const cat = getCategory(n);
  if (cat === "job") return "/student/jobs";
  if (cat === "mentor") return "/student/mentors";
  if (cat === "progress") return "/student/academy";
  return null;
}

function getActionLabel(n: any): string | null {
  const cat = getCategory(n);
  if (cat === "job") return "View Jobs";
  if (cat === "mentor") return "See Mentors";
  if (cat === "progress") return "Continue";
  return null;
}

function getPriorityDot(n: any): string {
  const priority = (n.priority || "").toLowerCase();
  if (priority === "high" || priority === "urgent") return "bg-red-500";
  return "bg-[#D66829]";
}

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryKey>("all");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifications(data || []);
      setLoading(false);
    });
  }, []);

  const markAllRead = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
  };

  const markRead = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((x) => (x.id === id ? { ...x, read_at: new Date().toISOString() } : x))
    );
  };

  const filtered = useMemo(() => {
    if (activeTab === "all") return notifications;
    return notifications.filter((n) => getCategory(n) === activeTab);
  }, [notifications, activeTab]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = { all: 0, job: 0, mentor: 0, progress: 0, system: 0 };
    for (const n of notifications) {
      if (!n.read_at) {
        counts.all++;
        counts[getCategory(n)]++;
      }
    }
    return counts;
  }, [notifications]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#D66829] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-[#1E2D3B] flex items-center gap-3">
            <Bell className="w-7 h-7 text-[#D66829]" />
            Notifications
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-bold text-[#D66829] hover:underline flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex rounded-2xl overflow-hidden border border-gray-200">
        {(Object.keys(NOTIFICATION_CATEGORIES) as CategoryKey[]).map((key) => {
          const cat = NOTIFICATION_CATEGORIES[key];
          const isActive = activeTab === key;
          const count = categoryCounts[key];
          const Icon = cat.icon;

          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 px-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-r last:border-r-0 border-gray-200 ${
                isActive ? "bg-[#1E2D3B] text-white" : "bg-white text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{cat.label}</span>
              {count > 0 && (
                <span
                  className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                    isActive ? "bg-[#D66829] text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold text-sm">
            {activeTab === "all" ? "No notifications yet" : `No ${NOTIFICATION_CATEGORIES[activeTab].label.toLowerCase()} notifications`}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            You&apos;ll see updates about job matches, mentor activity, and progress here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const cat = getCategory(n);
            const actionLink = getActionLink(n);
            const actionLabel = getActionLabel(n);
            const CatIcon = NOTIFICATION_CATEGORIES[cat].icon;

            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  !n.read_at
                    ? "bg-white border-gray-100 border-l-2 border-l-[#D66829] hover:bg-gray-50"
                    : "bg-white border-gray-100 hover:bg-gray-50"
                }`}
                onClick={() => {
                  if (!n.read_at) markRead(n.id);
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Category icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      !n.read_at ? "bg-[#D66829]/10" : "bg-gray-100"
                    }`}
                  >
                    <CatIcon
                      className={`w-4 h-4 ${!n.read_at ? "text-[#D66829]" : "text-gray-400"}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-[#1E2D3B]">{n.title}</p>
                      {!n.read_at && <span className={`w-2 h-2 rounded-full ${getPriorityDot(n)}`} />}
                    </div>
                    <p className="text-gray-500 text-sm">{n.body}</p>

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                      {actionLink && actionLabel && (
                        <Link
                          href={actionLink}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-bold text-[#D66829] hover:underline flex items-center gap-1"
                        >
                          {actionLabel} <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
