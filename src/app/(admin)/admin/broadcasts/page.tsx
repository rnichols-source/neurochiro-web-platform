"use client";

import { useState } from "react";
import { Mail, Send, Eye, Users, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { sendBroadcastAction } from "../../actions/comms-actions";

export default function AdminBroadcastsPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  const [form, setForm] = useState({
    subject: "",
    title: "",
    body: "",
    ctaText: "",
    ctaUrl: "",
    audience: "all_doctors",
  });

  const handleAction = async (actionType: 'test' | 'send') => {
    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("subject", form.subject);
    formData.append("title", form.title);
    formData.append("body", form.body);
    formData.append("segment", actionType === 'test' ? 'admin_test' : form.audience);

    try {
      const result = await sendBroadcastAction(formData);

      if (result.error) {
        throw new Error(result.error);
      }
      
      setStatus({ 
        type: 'success', 
        msg: actionType === 'test' ? 'Test email sent to your admin address.' : `Success! Broadcast sent to ${result.count} recipients.` 
      });
      
      if (actionType === 'send') {
        setForm({ ...form, subject: "", title: "", body: "", ctaText: "", ctaUrl: "" });
      }
    } catch (err: any) {
      console.error("Broadcast Error:", err);
      setStatus({ type: 'error', msg: err.message || "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 px-8 max-w-5xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-neuro-navy uppercase tracking-tighter flex items-center gap-4">
          <Mail className="w-10 h-10 text-neuro-orange" /> Mass Email Broadcast
        </h1>
        <p className="text-gray-500 font-medium mt-2 uppercase tracking-widest text-xs">
          Draft, preview, and send branded emails to segments
        </p>
      </div>

      {status && (
        <div className={`p-4 rounded-xl mb-8 flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm uppercase tracking-widest">{status.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Editor */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Audience Segment</label>
              <select 
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 font-bold text-neuro-navy"
              >
                <option value="all">All Active Users</option>
                <option value="doctor">Doctors Only</option>
                <option value="student">Students Only</option>
                <option value="patient">Patients / Public</option>
                <option value="paid_doctors">Doctors (Paid Tiers Only)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Subject Line</label>
              <input 
                type="text" 
                placeholder="e.g. Important Update to Your Directory Profile"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 font-bold text-neuro-navy"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Header Title</label>
              <input 
                type="text" 
                placeholder="e.g. Platform Update"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 font-bold text-neuro-navy"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Body (HTML supported)</label>
              <textarea 
                rows={6}
                placeholder="<p>Hello,</p><p>Here is an update...</p>"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 font-medium text-neuro-navy resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Button Text</label>
                <input 
                  type="text" 
                  placeholder="e.g. View Dashboard"
                  value={form.ctaText}
                  onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 font-bold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Button URL</label>
                <input 
                  type="url" 
                  placeholder="https://..."
                  value={form.ctaUrl}
                  onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 font-bold text-sm"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button 
                onClick={() => handleAction('test')}
                disabled={loading || !form.subject || !form.body}
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-neuro-navy rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex justify-center items-center gap-2"
              >
                <Eye className="w-4 h-4" /> Send Test
              </button>
              <button 
                onClick={() => handleAction('send')}
                disabled={loading || !form.subject || !form.body}
                className="flex-1 py-4 bg-neuro-orange hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-neuro-orange/20 flex justify-center items-center gap-2"
              >
                <Send className="w-4 h-4" /> Broadcast
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <div className="sticky top-8 border-[8px] border-gray-900 rounded-[3rem] overflow-hidden bg-gray-50 h-[800px] shadow-2xl flex flex-col">
            <div className="bg-gray-900 text-white py-2 text-center text-[10px] font-bold uppercase tracking-widest border-b border-gray-800">
              Live Email Preview
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-md mx-auto">
                <div className="bg-[#1E2D3B] p-6 text-center">
                  <img src="/logo-white.png" alt="NeuroChiro" className="h-10 mx-auto object-contain" />
                  {form.title && <h2 className="mt-4 text-white font-bold text-lg uppercase tracking-tight">{form.title}</h2>}
                </div>
                <div className="p-8 space-y-6">
                  {form.body ? (
                    <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: form.body }} />
                  ) : (
                    <p className="text-gray-400 italic text-sm text-center">Email body will appear here...</p>
                  )}
                  
                  {form.ctaText && form.ctaUrl && (
                    <div className="text-center pt-4">
                      <div className="inline-block bg-[#D66829] text-white px-6 py-3 rounded-xl font-bold text-sm tracking-wide">
                        {form.ctaText}
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 p-6 text-center text-xs text-gray-400">
                  <p>© 2026 NeuroChiro Network. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
