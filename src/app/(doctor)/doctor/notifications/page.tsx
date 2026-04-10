"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Mail, Briefcase, Calendar, Users, AlertCircle, ChevronRight } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "./actions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string | null;
  priority: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const typeIcons: Record<string, any> = {
  message: Mail,
  job: Briefcase,
  seminar: Calendar,
  referral: Users,
  system: AlertCircle,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getNotifications().then((data) => {
      setNotifications(data as Notification[]);
      setLoading(false);
    });
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read_at) : notifications;
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-black text-neuro-navy uppercase tracking-tight">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-neuro-orange hover:bg-neuro-orange/5 rounded-xl transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "unread"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              filter === tab
                ? "bg-neuro-navy text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            {tab === "all" ? "All" : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
            <Bell className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 font-bold text-sm">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const Icon = typeIcons[notif.type || "system"] || Bell;
            const isUnread = !notif.read_at;

            const content = (
              <div
                className={cn(
                  "flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer",
                  isUnread
                    ? "bg-neuro-orange/5 border-neuro-orange/20 hover:border-neuro-orange/40"
                    : "bg-white border-gray-100 hover:border-gray-200"
                )}
                onClick={() => {
                  setExpandedId(expandedId === notif.id ? null : notif.id);
                  if (isUnread) handleMarkRead(notif.id);
                }}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    isUnread ? "bg-neuro-orange/10 text-neuro-orange" : "bg-gray-50 text-gray-400"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-black", isUnread ? "text-neuro-navy" : "text-gray-600")}>
                      {notif.title}
                    </p>
                    {isUnread && <span className="w-2 h-2 bg-neuro-orange rounded-full flex-shrink-0" />}
                  </div>
                  <p className={cn("text-gray-500 text-sm mt-0.5", expandedId === notif.id ? "" : "line-clamp-2")}>{notif.body}</p>
                  <p className="text-gray-400 text-xs mt-2">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </div>
                {notif.link && <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-2" />}
              </div>
            );

            return notif.link ? (
              <Link key={notif.id} href={notif.link}>
                {content}
              </Link>
            ) : (
              <div key={notif.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
