"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, Smartphone, MessageSquare, ShieldCheck, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    referral_alerts: true,
    job_alerts: true,
    marketing_emails: true
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadPreferences() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (data) setPreferences(data);
      }
      setLoading(false);
    }
    loadPreferences();
  }, []);

  const togglePref = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const savePreferences = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('notification_preferences')
        .upsert({ user_id: user.id, ...preferences, updated_at: new Date().toISOString() });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Channels */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none"></div>
        <h3 className="text-xl font-black text-neuro-navy mb-8 flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-500" /> Delivery Channels
        </h3>
        
        <div className="space-y-4">
          {[
            { id: 'email_enabled', label: 'Email Notifications', icon: Mail, desc: 'Receive updates via your registered email address.' },
            { id: 'push_enabled', label: 'Push Notifications', icon: Bell, desc: 'Real-time alerts on your phone or desktop.' },
            { id: 'sms_enabled', label: 'SMS Notifications', icon: Smartphone, desc: 'Text messages for critical alerts (e.g. referrals).' }
          ].map((channel) => (
            <div key={channel.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 group hover:border-blue-200 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${preferences[channel.id as keyof typeof preferences] ? 'bg-blue-500 text-white' : 'bg-white text-gray-400'}`}>
                  <channel.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-neuro-navy uppercase tracking-tight text-sm">{channel.label}</p>
                  <p className="text-xs text-gray-400 font-medium">{channel.desc}</p>
                </div>
              </div>
              <button 
                onClick={() => togglePref(channel.id as keyof typeof preferences)}
                className={`w-14 h-7 rounded-full relative p-1 transition-all ${preferences[channel.id as keyof typeof preferences] ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${preferences[channel.id as keyof typeof preferences] ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Alert Types */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/5 blur-3xl pointer-events-none"></div>
        <h3 className="text-xl font-black text-neuro-navy mb-8 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-neuro-orange" /> Notification Types
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'referral_alerts', label: 'Referral Alerts', desc: 'When a colleague refers a patient.' },
            { id: 'job_alerts', label: 'Career Matches', desc: 'When a job matches your profile.' },
            { id: 'marketing_emails', label: 'Network Updates', desc: 'New feature drops and insights.' }
          ].map((type) => (
            <label key={type.id} className="flex items-start gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100 cursor-pointer hover:border-neuro-orange/20 transition-all group">
              <input 
                type="checkbox" 
                checked={preferences[type.id as keyof typeof preferences]} 
                onChange={() => togglePref(type.id as keyof typeof preferences)}
                className="mt-1 w-5 h-5 rounded-lg border-gray-300 text-neuro-orange focus:ring-neuro-orange"
              />
              <div>
                <p className="font-black text-neuro-navy uppercase tracking-tight text-xs">{type.label}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{type.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button 
          onClick={savePreferences}
          disabled={saving}
          className="flex items-center gap-3 px-10 py-5 bg-neuro-navy text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neuro-navy-light transition-all shadow-xl disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Notification Preferences
        </button>
      </div>
    </div>
  );
}
