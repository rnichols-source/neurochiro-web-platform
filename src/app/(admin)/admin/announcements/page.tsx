"use client";

import AnnouncementBuilder from "@/components/admin/AnnouncementBuilder";
import { Megaphone, History, Trash2, Eye, BarChart3, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAnnouncements() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setAnnouncements(data);
      setLoading(false);
    }
    fetchAnnouncements();
  }, []);

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    await (supabase as any).from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="py-12 px-8">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-neuro-navy uppercase tracking-tighter flex items-center gap-4">
          <Megaphone className="w-10 h-10 text-neuro-orange" /> Platform Announcements
        </h1>
        <p className="text-gray-500 font-medium mt-2 uppercase tracking-widest text-xs">
          MANAGE GLOBAL BROADCASTS AND TARGETED UPDATES
        </p>
      </div>

      <div className="space-y-12">
        {/* Builder */}
        <section className="bg-gray-50/50 p-8 rounded-[3rem] border border-gray-100">
          <AnnouncementBuilder />
        </section>

        {/* History */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <History className="w-6 h-6 text-neuro-navy" />
            <h2 className="text-xl font-black text-neuro-navy uppercase tracking-tight">Announcement History</h2>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Audience</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Created</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Loading History...</td>
                  </tr>
                ) : announcements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No Announcements Sent Yet</td>
                  </tr>
                ) : (
                  announcements.map((ann) => (
                    <tr key={ann.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-neuro-navy uppercase tracking-tight">{ann.title}</p>
                        <p className="text-[10px] text-gray-400 font-medium truncate max-w-xs">{ann.body}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-gray-100 text-[9px] font-black text-gray-500 rounded-full uppercase tracking-widest">
                          {ann.audience_type}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${
                          ann.priority === 'urgent' ? 'bg-red-50 text-red-500' : 
                          ann.priority === 'important' ? 'bg-orange-50 text-orange-500' : 
                          'bg-blue-50 text-blue-500'
                        }`}>
                          {ann.priority}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        {new Date(ann.starts_at) > new Date() ? (
                          <span className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-widest">
                            <Clock className="w-3 h-3" /> Scheduled
                          </span>
                        ) : ann.expires_at && new Date(ann.expires_at) < new Date() ? (
                          <span className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <History className="w-3 h-3" /> Expired
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest">
                            <Eye className="w-3 h-3" /> Live
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-neuro-navy transition-all border border-transparent hover:border-gray-100"
                            title="View Stats"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteAnnouncement(ann.id)}
                            className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
