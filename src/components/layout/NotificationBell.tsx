"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X, Check, ExternalLink, Settings, Info, AlertTriangle, Zap, Megaphone, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string | null;
  priority: string | null;
  link?: string | null;
  read_at: string | null;
  created_at: string;
  metadata?: any;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience_type: string | null;
  priority: string | null;
  created_at: string;
  link?: string;
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch individual notifications
    const { data: notifs, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (notifs) {
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.read_at).length);
    }

    // Fetch global announcements not dismissed
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role || 'patient';

    const { data: anncs } = await supabase
      .from('announcements')
      .select('*')
      .or(`audience_type.eq.all,audience_type.eq.${role}`)
      .lte('starts_at', new Date().toISOString())
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false });

    // Filter out dismissed announcements
    const { data: dismissals } = await supabase
      .from('announcement_dismissals')
      .select('announcement_id')
      .eq('user_id', user.id);
    
    const dismissedIds = dismissals?.map((d: any) => d.announcement_id) || [];
    const activeAnncs = anncs?.filter((a: Announcement) => !dismissedIds.includes(a.id)) || [];
    
    setAnnouncements(activeAnncs);
    setUnreadCount(prev => prev + activeAnncs.length);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('realtime_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, (payload: any) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        // Play sound or show toast if needed
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, supabase]);

  const markAsRead = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);
    
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);
    
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    setUnreadCount(announcements.length); // Only announcements left
  };

  const dismissAnnouncement = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('announcement_dismissals')
      .insert({ announcement_id: id, user_id: user.id });
    
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getIcon = (type: string | null, priority: string | null) => {
    if (type === 'announcement') return <Megaphone className="w-4 h-4 text-purple-500" />;
    if (priority === 'urgent') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (priority === 'important') return <Zap className="w-4 h-4 text-neuro-orange" />;
    return <Info className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors group"
      >
        <Bell className={`w-5 h-5 transition-colors ${isOpen ? 'text-neuro-orange' : 'text-gray-400 group-hover:text-white'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-neuro-orange text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-neuro-navy animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[110]" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[120]"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-sm font-black text-neuro-navy uppercase tracking-tight">Notifications</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    {unreadCount} UNREAD UPDATES
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={markAllAsRead}
                    className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-neuro-navy transition-all border border-transparent hover:border-gray-100"
                    title="Mark all as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <Link 
                    href="/settings/notifications"
                    className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-neuro-navy transition-all border border-transparent hover:border-gray-100"
                    title="Notification Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                {announcements.length === 0 && notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">All caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {/* Announcements First */}
                    {announcements.map((ann) => (
                      <div key={ann.id} className="p-5 bg-purple-50/30 hover:bg-purple-50/50 transition-colors relative group">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
                            <Megaphone className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-black text-purple-900 uppercase tracking-tight leading-tight">
                                {ann.title}
                              </p>
                              <button 
                                onClick={() => dismissAnnouncement(ann.id)}
                                className="p-1 text-purple-300 hover:text-purple-600 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs text-purple-800/70 font-medium mt-1 line-clamp-2">
                              {ann.body}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                                ANNOUNCEMENT • {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Individual Notifications */}
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-5 transition-colors relative group ${notif.read_at ? 'opacity-60 grayscale-[0.5]' : 'bg-white hover:bg-gray-50'}`}
                        onClick={() => !notif.read_at && markAsRead(notif.id)}
                      >
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            notif.priority === 'urgent' ? 'bg-red-50 text-red-500' : 
                            notif.priority === 'important' ? 'bg-neuro-orange/10 text-neuro-orange' : 
                            'bg-blue-50 text-blue-500'
                          }`}>
                            {getIcon(notif.type, notif.priority)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-black uppercase tracking-tight leading-tight ${notif.read_at ? 'text-gray-500' : 'text-neuro-navy'}`}>
                              {notif.title}
                            </p>
                            <p className={`text-xs font-medium mt-1 line-clamp-2 ${notif.read_at ? 'text-gray-400' : 'text-gray-600'}`}>
                              {notif.body}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                {notif.type} • {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                              </span>
                              {notif.link && (
                                <Link 
                                  href={notif.link} 
                                  className="text-[10px] font-black text-neuro-orange uppercase tracking-widest flex items-center gap-1 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  VIEW <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                        {!notif.read_at && (
                          <div className="absolute top-5 right-5 w-2 h-2 bg-neuro-orange rounded-full" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Link 
                href="/notifications"
                className="block p-4 bg-gray-50 hover:bg-gray-100 text-center text-[10px] font-black text-neuro-navy uppercase tracking-widest border-t border-gray-100 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                View All Notifications
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
