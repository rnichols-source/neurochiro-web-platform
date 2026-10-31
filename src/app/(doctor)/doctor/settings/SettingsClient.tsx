"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { deleteAccount } from "@/app/actions/account";
import { saveNotificationPrefs, unblockUser } from "@/app/actions/messaging-actions";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/portal/PageHeader";

type Prefs = {
  appointment_requests: boolean;
  referrals: boolean;
  messages: boolean;
  system_updates: boolean;
};

export default function SettingsClient({
  email,
  initialPrefs,
  initialBlocked,
}: {
  email: string;
  initialPrefs: Prefs;
  initialBlocked: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(initialPrefs);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [blocked, setBlocked] = useState(initialBlocked);

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    await saveNotificationPrefs(notifPrefs);
    setSavingPrefs(false);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setMessage({ type: "error", text: error.message });
    else {
      setMessage({ type: "success", text: "Password updated!" });
      setNewPassword(""); setConfirmPassword(""); setCurrentPassword("");
    }
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

  const toggleClass = (enabled: boolean) =>
    `relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-neuro-orange' : 'bg-gray-200'}`;
  const dotClass = (enabled: boolean) =>
    `absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${enabled ? 'left-5' : 'left-0.5'}`;

  return (
    <div className="max-w-xl mx-auto py-8 px-6 space-y-10">
      <PageHeader title="Settings" description="Notifications, password, and account." />

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-portal-ink-2 mb-4">Email</h2>
        <p className="text-sm text-neuro-navy font-medium">{email || "No email on this account"}</p>
        <p className="text-sm text-portal-ink-2 mt-1">To change your email, contact <a href="mailto:support@neurochirodirectory.com" className="text-neuro-orange hover:underline">support@neurochirodirectory.com</a></p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-portal-ink-2 mb-4">Notifications</h2>
        <div className="space-y-4">
          {[
            { key: 'appointment_requests', label: 'Appointment Requests', desc: 'When a patient requests an appointment' },
            { key: 'referrals', label: 'Referrals', desc: 'When a doctor sends you a referral' },
            { key: 'messages', label: 'Messages', desc: 'When you receive a new message' },
            { key: 'system_updates', label: 'Platform Updates', desc: 'News and feature updates from NeuroChiro' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-neuro-navy">{item.label}</p>
                <p className="text-sm text-portal-ink-2">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifPrefs(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                className={toggleClass(notifPrefs[item.key as keyof typeof notifPrefs])}
                aria-label={item.label}
              >
                <div className={dotClass(notifPrefs[item.key as keyof typeof notifPrefs])} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={handleSavePrefs}
          disabled={savingPrefs}
          className="mt-4 min-h-11 px-5 py-2 bg-neuro-navy text-white rounded-xl font-bold text-sm hover:bg-neuro-navy/90 disabled:opacity-50"
        >
          {prefsSaved ? 'Saved!' : savingPrefs ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-portal-ink-2 mb-4">Blocked people</h2>
        {blocked.length === 0 ? <p className="text-sm text-portal-ink-2">No one is blocked.</p> : (
          <ul className="space-y-2">
            {blocked.map((person) => (
              <li key={person.id} className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-neuro-navy">{person.full_name}</span>
                <button type="button" className="min-h-11 px-3 text-sm font-bold text-neuro-orange" onClick={async () => {
                  await unblockUser(person.id);
                  setBlocked((prev) => prev.filter((row) => row.id !== person.id));
                }}>Unblock</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-portal-ink-2 mb-4">Password</h2>
        {message && (
          <p className={`text-sm font-bold mb-3 ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>{message.text}</p>
        )}
        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <input type="password" placeholder="New password (8+ characters)" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-neuro-orange" />
          <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-neuro-orange" />
          <button type="submit" className="min-h-11 px-5 py-2 bg-neuro-navy text-white rounded-xl font-bold text-sm hover:bg-neuro-navy/90">Update Password</button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 p-6">
        <h2 className="text-sm font-bold text-red-500 mb-2">Danger Zone</h2>
        {!showDeleteForm ? (
          <button onClick={() => setShowDeleteForm(true)} className="min-h-11 text-red-500 font-bold text-sm hover:underline">
            Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600">This will permanently delete your account, profile, and all data.</p>
            <p className="text-sm text-red-500">Type <strong>DELETE</strong> to confirm:</p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-2 border border-red-200 rounded-lg text-base focus:outline-none focus:border-red-400"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteForm(false); setDeleteConfirm(""); }} className="min-h-11 px-4 py-2 text-gray-500 text-sm font-bold">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting || deleteConfirm !== "DELETE"}
                className="min-h-11 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
