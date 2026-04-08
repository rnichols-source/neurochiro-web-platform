"use client";

import { useState, useEffect } from "react";
import { getAllDoctors, updateDoctorManually, deleteDoctorManually } from "./actions";

export default function DirectoryManager() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const statusColor = (s: string) =>
    s === "verified" ? "bg-green-500/10 text-green-400" :
    s === "pending" ? "bg-yellow-500/10 text-yellow-400" :
    "bg-gray-500/10 text-gray-400";

  return (
    <div className="p-6 max-w-6xl mx-auto text-white space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Doctors</h1>
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

      {loading && !doctors.length ? (
        <p className="text-gray-500 text-center py-12">Loading...</p>
      ) : (
        <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Clinic</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">No doctors found.</td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-medium">Dr. {doc.first_name} {doc.last_name}</td>
                    <td className="px-4 py-3 text-gray-400">{doc.clinic_name || "-"}</td>
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
