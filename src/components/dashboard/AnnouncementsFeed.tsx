"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Megaphone, Info, Zap, AlertTriangle, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function AnnouncementsFeed({ audience }: { audience: string }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    async function fetchAnnouncements() {
      const supabase = createClient();
      const now = new Date().toISOString();
      
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .or(`audience_type.eq.all,audience_type.eq.${audience}`)
        .lte('starts_at', now)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (data) setAnnouncements(data);
      setLoading(false);
    }
    fetchAnnouncements();
  }, [audience]);

  const handleDismiss = (id: string) => {
    setDismissed(prev => [...prev, id]);
  };

  const visibleAnnouncements = announcements.filter(a => !dismissed.includes(a.id));

  if (loading || visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <Megaphone className="w-4 h-4 text-neuro-orange" />
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Latest Network News</h3>
      </div>
      
      <div className="space-y-3">
        <AnimatePresence>
          {visibleAnnouncements.map((ann) => {
            const isUrgent = ann.priority === 'urgent';
            const isImportant = ann.priority === 'important';
            const isPromo = ann.priority === 'promo';
            
            const Icon = isUrgent ? AlertTriangle : isImportant ? Zap : isPromo ? Megaphone : Info;
            
            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-5 rounded-3xl border shadow-sm flex gap-4 relative group transition-all hover:shadow-md ${
                  isUrgent ? 'bg-red-50 border-red-100' : 
                  isImportant ? 'bg-orange-50 border-orange-100' : 
                  isPromo ? 'bg-purple-50 border-purple-100' :
                  'bg-white border-gray-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isUrgent ? 'bg-red-500/10 text-red-500' : 
                  isImportant ? 'bg-orange-500/10 text-orange-500' : 
                  isPromo ? 'bg-purple-500/10 text-purple-500' :
                  'bg-blue-50 text-blue-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                      {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                    </span>
                    {isUrgent && <span className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase rounded-full">Urgent</span>}
                  </div>
                  <h4 className={`font-bold text-sm uppercase tracking-tight ${isUrgent ? 'text-red-900' : 'text-neuro-navy'}`}>
                    {ann.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                    {ann.body}
                  </p>
                  
                  {ann.link && (
                    <a 
                      href={ann.link} 
                      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest mt-3 hover:underline ${
                        isUrgent ? 'text-red-600' : 'text-neuro-orange'
                      }`}
                    >
                      Learn More <ChevronRight className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <button 
                  onClick={() => handleDismiss(ann.id)}
                  className="absolute top-4 right-4 p-1 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
