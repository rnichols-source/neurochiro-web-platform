"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { deleteAccount } from "@/app/actions/account";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setMessage({ type: "error", text: error.message });
    else {
      setMessage({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    setDeleting(true);
    const res = await deleteAccount();
    if (res.error) { setMessage({ type: "error", text: res.error }); setDeleting(false); return; }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/?deleted=1");
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-heading font-black text-neuro-navy mb-8">Account Settings</h1>

      <form onSubmit={handleUpdatePassword} className="space-y-4 mb-12">
        <h2 className="text-lg font-bold text-neuro-navy">Change Password</h2>
        {message && (
          <p className={`text-sm font-bold ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>{message.text}</p>
        )}
        <input type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
        <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
        <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
        <button type="submit" className="px-6 py-3 bg-neuro-navy text-white rounded-xl font-bold hover:bg-neuro-navy/90 transition-colors">Update Password</button>
      </form>

      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h2>
        <button onClick={handleDelete} disabled={deleting} className="text-red-600 font-bold text-sm hover:underline disabled:opacity-50">
          {deleting ? "Deleting..." : "Delete my account"}
        </button>
      </div>
    </div>
  );
}
