"use client";

import { useState, useEffect, useRef } from "react";
import { getAllDoctors, updateDoctorManually, deleteDoctorManually, bulkDeleteDoctors, migrateDoctorsFromCSV, sendMigrationEmails, registerAllUnlinkedDoctors } from "./actions";
import { Trash2, Upload, CheckSquare, Square, AlertTriangle, CheckCircle2, Loader2, X, Mail, UserPlus } from "lucide-react";

export default function DirectoryManager() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkEmailing, setBulkEmailing] = useState(false);
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number } | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<{ registered: number; failed: number; total: number } | null>(null);
  const [showMigrate, setShowMigrate] = useState(false);
  const [migrateStatus, setMigrateStatus] = useState<any>(null);
  const [migrating, setMigrating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async (query?: string) => {
    setLoading(true);
    try { setDoctors(await getAllDoctors(query)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors(searchQuery);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setIsUpdating(true);
    const updates = {
      first_name: selectedDoctor.first_name,
      last_name: selectedDoctor.last_name,
      email: selectedDoctor.email,
      slug: selectedDoctor.slug,
      clinic_name: selectedDoctor.clinic_name,
      address: selectedDoctor.address,
      city: selectedDoctor.city,
      state: selectedDoctor.state,
      country: selectedDoctor.country,
      latitude: parseFloat(selectedDoctor.latitude) || 0,
      longitude: parseFloat(selectedDoctor.longitude) || 0,
      bio: selectedDoctor.bio,
      website_url: selectedDoctor.website_url,
      instagram_url: selectedDoctor.instagram_url,
      verification_status: selectedDoctor.verification_status,
      membership_tier: selectedDoctor.membership_tier,
    };
    const res = await updateDoctorManually(selectedDoctor.id, updates);
    if (res.success) {
      setSelectedDoctor(null);
      fetchDoctors(searchQuery);
    } else {
      alert("Error: " + res.error);
    }
    setIsUpdating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this doctor? This cannot be undone.")) return;
    const prev = [...doctors];
    setDoctors(doctors.filter((d) => d.id !== id));
    const res = await deleteDoctorManually(id);
    if (!res.success) {
      alert("Error: " + res.error);
      setDoctors(prev);
    } else {
      fetchDoctors(searchQuery);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === doctors.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(doctors.map(d => d.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} doctor${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    const result = await bulkDeleteDoctors(Array.from(selected));
    if (result.success) {
      setSelected(new Set());
      fetchDoctors(searchQuery);
      alert(`Deleted ${result.deleted} doctor${result.deleted !== 1 ? 's' : ''}.${result.failed ? ` ${result.failed} failed.` : ''}`);
    } else {
      alert("Error: " + result.error);
    }
    setBulkDeleting(false);
  };

  const handleBulkEmail = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Send "Your new profile is ready" email to ${selected.size} doctor${selected.size > 1 ? 's' : ''}?`)) return;
    setBulkEmailing(true);
    setEmailResult(null);
    const result = await sendMigrationEmails(Array.from(selected));
    setEmailResult({ sent: result.sent, failed: result.failed });
    setBulkEmailing(false);
    if (result.errors.length > 0) {
      console.warn("Email errors:", result.errors);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMigrating(true);
    setMigrateStatus(null);

    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',');

    // Find column indices
    const emailIdx = headers.findIndex(h => h.toLowerCase().includes('customer email'));
    const nameIdx = headers.findIndex(h => h.toLowerCase().includes('customer name'));
    const custIdIdx = headers.findIndex(h => h.toLowerCase().includes('customer id'));
    const subIdIdx = headers.findIndex(h => h.toLowerCase() === 'id');
    const amountIdx = headers.findIndex(h => h.toLowerCase().includes('amount'));
    const statusIdx = headers.findIndex(h => h.toLowerCase() === 'status');

    const rows = lines.slice(1).map(line => {
      // Handle CSV with commas in quoted fields
      const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '').trim()) || line.split(',');
      return {
        email: cols[emailIdx] || '',
        name: cols[nameIdx] || '',
        stripeCustomerId: cols[custIdIdx] || '',
        subscriptionId: cols[subIdIdx] || '',
        amount: cols[amountIdx] || '0',
        status: cols[statusIdx] || '',
      };
    }).filter(r => r.email && r.status.toLowerCase() === 'active');

    const result = await migrateDoctorsFromCSV(rows);
    setMigrateStatus(result);
    setMigrating(false);
    fetchDoctors(searchQuery);

    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
  };

  const statusColor = (s: string) =>
    s === "verified" ? "bg-green-500/10 text-green-400" :
    s === "pending" ? "bg-yellow-500/10 text-yellow-400" :
    "bg-gray-500/10 text-gray-400";

  return (
    <div className="p-6 max-w-6xl mx-auto text-white space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Doctors</h1>
          <p className="text-gray-500 text-sm">{doctors.length} doctors in database</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              if (!confirm('Register auth accounts for ALL doctors without one? This lets them use "Forgot Password" to log in.')) return;
              setRegistering(true);
              setRegisterResult(null);
              const result = await registerAllUnlinkedDoctors();
              setRegisterResult(result);
              setRegistering(false);
              fetchDoctors(searchQuery);
            }}
            disabled={registering}
            className="px-4 py-2 bg-green-600 rounded-lg text-sm hover:bg-green-500 flex items-center gap-2 disabled:opacity-50"
          >
            {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {registering ? 'Registering...' : 'Register All'}
          </button>
          <button
            onClick={() => setShowMigrate(!showMigrate)}
            className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-500 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Migrate from Stripe
          </button>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, clinic, email..."
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm w-64 focus:outline-none focus:border-white/30"
            />
            <button type="submit" className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Migration Panel */}
      {showMigrate && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Migrate Existing Members</h2>
              <p className="text-gray-400 text-sm">Upload your Stripe subscriptions CSV to import active members.</p>
            </div>
            <button onClick={() => setShowMigrate(false)} className="text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-lg text-sm font-bold cursor-pointer hover:bg-blue-500 transition-colors">
              <Upload className="w-4 h-4" />
              {migrating ? 'Importing...' : 'Upload CSV'}
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                disabled={migrating}
              />
            </label>
            {migrating && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
          </div>

          {migrateStatus && (
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="font-bold">Migration Complete</span>
              </div>
              <p className="text-sm text-gray-300">
                <span className="text-green-400 font-bold">{migrateStatus.created}</span> created
                {' '}&middot;{' '}
                <span className="text-yellow-400 font-bold">{migrateStatus.skipped}</span> already existed (updated)
              </p>
              {migrateStatus.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-red-400 font-bold mb-1">{migrateStatus.errors.length} errors:</p>
                  <div className="max-h-32 overflow-y-auto text-xs text-red-300 space-y-1">
                    {migrateStatus.errors.map((err: string, i: number) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>Expected CSV columns: Customer Email, Customer Name, Customer ID, Status, Amount</p>
            <p>Only rows with Status = &quot;active&quot; will be imported.</p>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="font-bold text-red-300">{selected.size} doctor{selected.size !== 1 ? 's' : ''} selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(new Set())}
              className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20"
            >
              Clear Selection
            </button>
            <button
              onClick={handleBulkEmail}
              disabled={bulkEmailing}
              className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-500 flex items-center gap-2 disabled:opacity-50"
            >
              {bulkEmailing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {bulkEmailing ? 'Sending...' : `Email ${selected.size}`}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="px-4 py-2 bg-red-600 rounded-lg text-sm hover:bg-red-500 flex items-center gap-2 disabled:opacity-50"
            >
              {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {bulkDeleting ? 'Deleting...' : `Delete ${selected.size}`}
            </button>
          </div>
        </div>
      )}

      {/* Register Result */}
      {registerResult && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm font-bold text-green-300">
              {registerResult.registered} of {registerResult.total} doctors registered
              {registerResult.failed > 0 && <span className="text-red-400"> &middot; {registerResult.failed} failed</span>}
            </span>
          </div>
          <button onClick={() => setRegisterResult(null)} className="text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Email Result */}
      {emailResult && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm font-bold text-green-300">
              {emailResult.sent} email{emailResult.sent !== 1 ? 's' : ''} sent
              {emailResult.failed > 0 && <span className="text-red-400"> &middot; {emailResult.failed} failed</span>}
            </span>
          </div>
          <button onClick={() => setEmailResult(null)} className="text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      {loading && !doctors.length ? (
        <p className="text-gray-500 text-center py-12">Loading...</p>
      ) : (
        <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                    {selected.size === doctors.length && doctors.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">No doctors found.</td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc.id} className={`hover:bg-white/5 ${selected.has(doc.id) ? 'bg-blue-500/5' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(doc.id)} className="hover:text-white transition-colors">
                        {selected.has(doc.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium">Dr. {doc.first_name} {doc.last_name}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{doc.email || "-"}</td>
                    <td className="px-4 py-3 text-gray-400">{doc.city}{doc.state ? `, ${doc.state}` : ""}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColor(doc.verification_status)}`}>
                        {doc.verification_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 capitalize">{doc.membership_tier}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => setSelectedDoctor({ ...doc })} className="px-3 py-1 bg-white/10 rounded text-xs hover:bg-white/20">Edit</button>
                      <button onClick={() => handleDelete(doc.id)} className="px-3 py-1 bg-red-500/10 text-red-400 rounded text-xs hover:bg-red-500/20">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#0d1117] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold">Edit Doctor</h2>
              <button onClick={() => setSelectedDoctor(null)} className="text-gray-500 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["first_name", "First Name"],
                  ["last_name", "Last Name"],
                  ["clinic_name", "Clinic Name"],
                  ["city", "City"],
                  ["state", "State"],
                  ["email", "Email"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input
                      value={selectedDoctor[key] || ""}
                      onChange={(e) => setSelectedDoctor({ ...selectedDoctor, [key]: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Verification Status</label>
                  <select
                    value={selectedDoctor.verification_status}
                    onChange={(e) => setSelectedDoctor({ ...selectedDoctor, verification_status: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
                  >
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="hidden">Hidden</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Membership Tier</label>
                  <select
                    value={selectedDoctor.membership_tier}
                    onChange={(e) => setSelectedDoctor({ ...selectedDoctor, membership_tier: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
                  >
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSelectedDoctor(null)} className="px-4 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10">Cancel</button>
                <button type="submit" disabled={isUpdating} className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50">
                  {isUpdating ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
