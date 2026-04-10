"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { deleteAccount } from "@/app/actions/account";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ health_reminders: true, doctor_updates: true, system_updates: true });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const el = document.getElementById('patient-email');
      if (el) el.textContent = user.email || '';
      const nameEl = document.getElementById('patient-name');
      const { data } = await supabase.from('profiles').select('full_name, notification_preferences').eq('id', user.id).single();
      if (nameEl && data?.full_name) nameEl.textContent = data.full_name;
      if (data?.notification_preferences) setNotifPrefs(p => ({ ...p, ...(data.notification_preferences as any) }));
    });
  }, []);

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('profiles').update({ notification_preferences: notifPrefs }).eq('id', user.id);
    setSavingPrefs(false);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) { setMessage({ type: "error", text: "Passwords do not match." }); return; }
    if (newPassword.length < 8) { setMessage({ type: "error", text: "Password must be at least 8 characters." }); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setMessage({ type: "error", text: error.message });
    else { setMessage({ type: "success", text: "Password updated!" }); setNewPassword(""); setConfirmPassword(""); }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    const res = await deleteAccount();
    if (res.error) { setMessage({ type: "error", text: res.error }); setDeleting(false); return; }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/?deleted=1");
  };

  const toggleClass = (on: boolean) => `relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-neuro-orange' : 'bg-gray-200'}`;
  const dotClass = (on: boolean) => `absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? 'left-5' : 'left-0.5'}`;

  return (
    <div className="max-w-xl mx-auto py-8 px-6 space-y-8">
      <h1 className="text-2xl font-heading font-black text-neuro-navy">Settings</h1>

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Account</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Name</span>
            <span className="text-sm font-medium text-neuro-navy" id="patient-name">Loading...</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Email</span>
            <span className="text-sm font-medium text-neuro-navy" id="patient-email">Loading...</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">To update your name or email, contact <a href="mailto:support@neurochirodirectory.com" className="text-neuro-orange hover:underline">support@neurochirodirectory.com</a></p>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Notifications</h2>
        <div className="space-y-4">
          {[
            { key: 'health_reminders', label: 'Daily Check-in Reminders', desc: 'Reminder to log your energy, pain, and sleep' },
            { key: 'doctor_updates', label: 'Doctor Updates', desc: 'When new doctors join near your area' },
            { key: 'system_updates', label: 'Platform Updates', desc: 'News and features from NeuroChiro' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-neuro-navy">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <button type="button" onClick={() => setNotifPrefs(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))} className={toggleClass(notifPrefs[item.key as keyof typeof notifPrefs])}>
                <div className={dotClass(notifPrefs[item.key as keyof typeof notifPrefs])} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={handleSavePrefs} disabled={savingPrefs} className="mt-4 px-5 py-2 bg-neuro-navy text-white rounded-xl font-bold text-sm disabled:opacity-50">
          {prefsSaved ? 'Saved!' : savingPrefs ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Password</h2>
        {message && <p className={`text-sm font-bold mb-3 ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <input type="password" placeholder="New password (8+ characters)" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange" />
          <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange" />
          <button type="submit" className="px-5 py-2 bg-neuro-navy text-white rounded-xl font-bold text-sm">Update Password</button>
        </form>
      </div>

      {/* Sign Out */}
      <button onClick={handleSignOut} className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-6">
        <h2 className="text-sm font-bold text-red-500 uppercase tracking-wide mb-2">Danger Zone</h2>
        {!showDeleteForm ? (
          <button onClick={() => setShowDeleteForm(true)} className="text-red-500 font-bold text-sm hover:underline">Delete my account</button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600">This will permanently delete your account and all health data.</p>
            <p className="text-xs text-red-500">Type <strong>DELETE</strong> to confirm:</p>
            <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="Type DELETE" className="w-full px-4 py-2 border border-red-200 rounded-lg text-sm" />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteForm(false); setDeleteConfirm(""); }} className="px-4 py-2 text-gray-500 text-sm font-bold">Cancel</button>
              <button onClick={handleDelete} disabled={deleting || deleteConfirm !== "DELETE"} className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg disabled:opacity-50">
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
