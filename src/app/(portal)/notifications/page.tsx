"use client";

import { useState, useEffect } from "react";
import { Bell, Filter, Search, Check, CheckCircle2, Megaphone, Trash2, Settings, ExternalLink, Zap, AlertTriangle, Info } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setNotifications(data);
      setLoading(false);
    }
    loadNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    await (supabase as any).from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
  };

  const deleteNotification = async (id: string) => {
    await (supabase as any).from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === "unread") return !n.read_at;
    if (filter === "important") return n.priority === "important" || n.priority === "urgent";
    return true;
  }).filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-neuro-navy uppercase tracking-tighter flex items-center gap-4">
            <Bell className="w-10 h-10 text-neuro-orange" /> Notification Center
          </h1>
          <p className="text-gray-500 font-medium mt-2 uppercase tracking-widest text-xs">
            MANAGE ALL YOUR PLATFORM ALERTS AND ANNOUNCEMENTS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-neuro-navy font-bold text-xs uppercase tracking-widest rounded-2xl transition-all border border-gray-100"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark All as Read
          </button>
          <Link 
            href="/settings/notifications"
            className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-neuro-navy rounded-2xl border border-gray-100 transition-all"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Filter by Type</p>
            {[
              { id: 'all', label: 'All Notifications', count: notifications.length },
              { id: 'unread', label: 'Unread Only', count: notifications.filter(n => !n.read_at).length },
              { id: 'important', label: 'Important', count: notifications.filter(n => n.priority === 'urgent' || n.priority === 'important').length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  filter === f.id ? 'bg-neuro-navy text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f.label}
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${filter === f.id ? 'bg-white/20' : 'bg-gray-200'}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          <div className="bg-neuro-navy p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/20 blur-3xl group-hover:bg-neuro-orange/30 transition-all" />
            <Megaphone className="w-8 h-8 text-neuro-orange mb-4" />
            <h3 className="text-lg font-black uppercase tracking-tight leading-tight">Stay Updated</h3>
            <p className="text-xs text-gray-400 font-medium mt-2 leading-relaxed">
              Enable push notifications to never miss a referral or job application.
            </p>
            <button className="w-full mt-6 py-3 bg-white text-neuro-navy font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-neuro-orange hover:text-white transition-all">
              Enable Push Alerts
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input 
              type="text" 
              placeholder="SEARCH YOUR NOTIFICATIONS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-6 py-6 bg-white border border-gray-100 rounded-3xl shadow-sm focus:ring-4 focus:ring-neuro-orange/5 focus:border-neuro-orange/20 transition-all font-bold text-neuro-navy uppercase tracking-widest text-xs"
            />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <div className="w-12 h-12 border-4 border-gray-100 border-t-neuro-orange rounded-full animate-spin" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Syncing Alert Hub...</p>
              </div>
            ) : filteredNotifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-24 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Bell className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-neuro-navy uppercase tracking-tight">No Notifications Found</h3>
                <p className="text-gray-400 font-medium mt-2 max-w-xs">
                  We couldn't find any alerts matching your current filters.
                </p>
                <button 
                  onClick={() => { setFilter('all'); setSearch(''); }}
                  className="mt-8 px-8 py-4 bg-gray-50 hover:bg-gray-100 text-neuro-navy font-black uppercase tracking-widest text-[10px] rounded-xl border border-gray-100"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredNotifs.map((notif) => (
                  <motion.div 
                    layout
                    key={notif.id}
                    className={`p-8 transition-all hover:bg-gray-50/50 relative group ${notif.read_at ? 'opacity-60' : 'bg-white'}`}
                  >
                    <div className="flex gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        notif.priority === 'urgent' ? 'bg-red-50 text-red-500' : 
                        notif.priority === 'important' ? 'bg-neuro-orange/10 text-neuro-orange' : 
                        'bg-blue-50 text-blue-500'
                      }`}>
                        {notif.priority === 'urgent' ? <AlertTriangle className="w-6 h-6" /> : 
                         notif.priority === 'important' ? <Zap className="w-6 h-6" /> : 
                         <Info className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-black text-neuro-navy uppercase tracking-tight leading-none mb-2">
                              {notif.title}
                            </p>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-2xl">
                              {notif.body}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notif.read_at && (
                              <button 
                                onClick={() => markAsRead(notif.id)}
                                className="p-2 hover:bg-white rounded-xl text-green-500 border border-transparent hover:border-green-100 transition-all"
                                title="Mark as read"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                            )}
                            <button 
                              onClick={() => deleteNotification(notif.id)}
                              className="p-2 hover:bg-white rounded-xl text-red-400 border border-transparent hover:border-red-100 transition-all"
                              title="Delete notification"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-6">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" /> {notif.type}
                            </span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" /> {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {notif.link && (
                            <Link 
                              href={notif.link}
                              className="flex items-center gap-2 px-6 py-3 bg-neuro-navy text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-neuro-orange transition-all shadow-lg shadow-neuro-navy/10"
                            >
                              View Details <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

