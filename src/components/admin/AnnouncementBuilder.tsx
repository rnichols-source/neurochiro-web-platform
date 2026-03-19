"use client";

import { useState } from "react";
import { Megaphone, Users, Send, Calendar, Clock, Eye, AlertTriangle, Zap, Info, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function AnnouncementBuilder() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    body: "",
    audience_type: "all",
    priority: "info",
    delivery_methods: ["in-platform"],
    link: "",
    starts_at: new Date().toISOString().slice(0, 16),
    expires_at: "",
  });

  const supabase = createClient();

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    const { error: dbError } = await supabase
      .from("announcements")
      .insert({
        ...form,
        created_by: user?.id,
        starts_at: new Date(form.starts_at).toISOString(),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      });

    if (dbError) {
      setError(dbError.message);
    } else {
      setSuccess(true);
      setForm({
        title: "",
        body: "",
        audience_type: "all",
        priority: "info",
        delivery_methods: ["in-platform"],
        link: "",
        starts_at: new Date().toISOString().slice(0, 16),
        expires_at: "",
      });
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  const audiences = [
    { value: "all", label: "All Users", icon: Users },
    { value: "patient", label: "Patients", icon: Info },
    { value: "student", label: "Students", icon: Info },
    { value: "doctor", label: "Doctors", icon: Info },
    { value: "vendor", label: "Vendors", icon: Info },
    { value: "mastermind", label: "Mastermind", icon: Info },
    { value: "council", label: "Council Members", icon: Info },
  ];

  const priorities = [
    { value: "info", label: "Informational", icon: Info, color: "text-blue-500", bg: "bg-blue-50" },
    { value: "important", label: "Important", icon: Zap, color: "text-neuro-orange", bg: "bg-neuro-orange/10" },
    { value: "urgent", label: "Urgent", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
    { value: "promo", label: "Promotional", icon: Megaphone, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-neuro-navy uppercase tracking-tighter flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-neuro-orange" /> Announcement Builder
          </h2>
          <p className="text-gray-500 font-medium mt-1 uppercase tracking-widest text-[10px]">
            Create and broadcast platform-wide updates
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handlePublish} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Announcement Title</label>
              <input 
                type="text" 
                required
                placeholder="e.g. New Clinical Research Section Added"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange transition-all font-bold text-neuro-navy"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Body</label>
              <textarea 
                required
                rows={4}
                placeholder="Details about the update..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange transition-all font-medium text-neuro-navy resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Audience</label>
                <select 
                  value={form.audience_type}
                  onChange={(e) => setForm({ ...form, audience_type: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange transition-all font-bold text-neuro-navy appearance-none cursor-pointer"
                >
                  {audiences.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority Level</label>
                <select 
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange transition-all font-bold text-neuro-navy appearance-none cursor-pointer"
                >
                  {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Action Link (Optional)</label>
              <input 
                type="url" 
                placeholder="https://..."
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange transition-all font-bold text-neuro-navy"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date/Time</label>
                <input 
                  type="datetime-local" 
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange transition-all font-bold text-neuro-navy"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiry (Optional)</label>
                <input 
                  type="datetime-local" 
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange transition-all font-bold text-neuro-navy"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-10 py-5 bg-neuro-navy text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neuro-navy-light transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Publish Announcement
              </button>
            </div>

            {error && <p className="text-red-500 text-xs font-bold text-center mt-4">{error}</p>}
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-green-500 font-bold text-sm mt-4"
              >
                <CheckCircle2 className="w-5 h-5" /> Announcement Published Successfully!
              </motion.div>
            )}
          </form>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 h-full">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 text-center">Live Preview</h3>
            
            <div className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="w-24 h-2 bg-gray-200 rounded-full" />
                <div className="w-4 h-4 bg-gray-200 rounded-full" />
              </div>
              
              <div className="p-5">
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${priorities.find(p => p.value === form.priority)?.bg}`}>
                    {(() => {
                      const Icon = priorities.find(p => p.value === form.priority)?.icon || Info;
                      return <Icon className={`w-5 h-5 ${priorities.find(p => p.value === form.priority)?.color}`} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-neuro-navy uppercase tracking-tight leading-tight">
                      {form.title || "Announcement Title"}
                    </p>
                    <p className="text-xs text-gray-500 font-medium mt-1 line-clamp-3">
                      {form.body || "This is where your announcement body will appear. Keep it concise and valuable."}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        ANNOUNCEMENT • JUST NOW
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 font-medium">
                  Announcements are delivered in-platform instantly to the target audience.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-start gap-3">
                <Megaphone className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-purple-700 font-medium">
                  Promotional announcements appear with a purple highlight to stand out.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
