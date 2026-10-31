"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, Briefcase, Calendar, Users, AlertCircle } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "./actions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { formatDistanceToNow, isThisWeek, isToday } from "date-fns";
import PageHeader from "@/components/portal/PageHeader";
import EmptyState from "@/components/portal/EmptyState";

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

const typeIcons: Record<string, typeof Bell> = {
  message: Mail,
  job: Briefcase,
  seminar: Calendar,
  referral: Users,
  system: AlertCircle,
};

const GROUPS = ["Today", "This week", "Earlier"] as const;

function groupOf(createdAt: string) {
  const date = new Date(createdAt);
  if (isToday(date)) return "Today";
  if (isThisWeek(date, { weekStartsOn: 0 })) return "This week";
  return "Earlier";
}

function destination(link: string | null) {
  const href = link && link.trim() ? link.trim() : "/doctor/dashboard";
  return { href, external: /^https?:\/\//.test(href) };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    getNotifications().then((data) => {
      setNotifications((data as Notification[]).filter((item) => item.type !== "portal_login"));
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

  const visible = notifications.filter((n) => n.type !== "portal_login");
  const filtered = filter === "unread" ? visible.filter((n) => n.read_at == null) : visible;
  const unreadCount = visible.filter((n) => n.read_at == null).length;
  const grouped = GROUPS.map((label) => ({
    label,
    items: filtered.filter((item) => groupOf(item.created_at) === label),
  })).filter((group) => group.items.length > 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-portal-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Notifications" description="Updates about your account." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["all", "unread"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                "min-h-11 px-4 rounded-lg text-sm font-bold",
                filter === tab ? "bg-portal-accent text-white" : "bg-white border border-portal-border text-portal-ink"
              )}
            >
              {tab === "all" ? "All" : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="min-h-11 px-4 rounded-lg border border-portal-border bg-white text-sm font-bold text-portal-ink"
          >
            Mark all read
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" sentence="Updates about your account will show up here." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No unread notifications" sentence="You are caught up." />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.label} className="space-y-2">
              <h2 className="text-lg font-bold text-portal-ink">{group.label}</h2>
              {group.items.map((notif) => {
                const Icon = typeIcons[notif.type || "system"] || Bell;
                const isUnread = notif.read_at == null;
                const target = destination(notif.link);
                const className = cn(
                  "flex items-start gap-4 p-4 rounded-xl border",
                  isUnread ? "bg-portal-accent-50 border-portal-border" : "bg-white border-portal-border"
                );
                const body = (
                  <>
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", isUnread ? "bg-white text-portal-accent" : "bg-portal-surface text-portal-muted")}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-bold", isUnread ? "text-portal-ink" : "text-portal-ink-2")}>{notif.title}</p>
                      <p className="text-sm text-portal-ink-2 mt-0.5 line-clamp-2">{notif.body}</p>
                      <p className="text-sm text-portal-muted mt-2">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </>
                );
                if (target.external) {
                  return (
                    <a key={notif.id} href={target.href} className={className} onClick={() => { if (isUnread) void handleMarkRead(notif.id); }}>
                      {body}
                    </a>
                  );
                }
                return (
                  <Link key={notif.id} href={target.href} className={className} onClick={() => { if (isUnread) void handleMarkRead(notif.id); }}>
                    {body}
                  </Link>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
