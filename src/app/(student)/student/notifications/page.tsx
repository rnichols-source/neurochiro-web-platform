"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setNotifications(data || []);
      setLoading(false);
    });
  }, []);

  const markAllRead = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  if (loading) return <div className="p-8 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-black text-neuro-navy">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs font-bold text-neuro-orange hover:underline flex items-center gap-1">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold text-sm">No notifications yet</p>
          <p className="text-gray-400 text-xs mt-1">You&apos;ll see updates about job applications, messages, and more here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all ${!n.read_at ? 'bg-neuro-orange/5 border-neuro-orange/20' : 'bg-white border-gray-100'}`}
              onClick={async () => {
                if (!n.read_at) {
                  const supabase = createClient();
                  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id);
                  setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
                }
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold text-neuro-navy">{n.title}</p>
                {!n.read_at && <span className="w-2 h-2 bg-neuro-orange rounded-full" />}
              </div>
              <p className="text-gray-500 text-sm">{n.body}</p>
              <p className="text-xs text-gray-400 mt-2">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
