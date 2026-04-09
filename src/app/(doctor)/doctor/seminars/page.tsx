"use client";

import { useState, useEffect } from "react";
import { Plus, X, Calendar, Loader2, Pencil, Trash2 } from "lucide-react";
import {
  getDoctorSeminars,
  createSeminarAction,
  updateSeminarAction,
  deleteSeminarAction,
} from "./actions";

export default function SeminarsPage() {
  const [seminars, setSeminars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editSeminar, setEditSeminar] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    const data = await getDoctorSeminars();
    setSeminars(data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function getSeminarStatus(seminar: any): { label: string; color: string } {
    if (seminar.is_approved && seminar.dates) {
      const seminarDate = new Date(seminar.dates);
      if (seminarDate < new Date()) return { label: "Past", color: "bg-gray-100 text-gray-600" };
      return { label: "Approved", color: "bg-green-100 text-green-700" };
    }
    return { label: "Pending", color: "bg-yellow-100 text-yellow-700" };
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await createSeminarAction(formData);
    setShowCreateModal(false);
    setSubmitting(false);
    loadData();
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await updateSeminarAction(editSeminar.id, formData);
    setEditSeminar(null);
    setSubmitting(false);
    loadData();
  }

  async function handleDelete(seminarId: string) {
    if (!confirm("Delete this seminar?")) return;
    await deleteSeminarAction(seminarId);
    loadData();
  }

  function SeminarForm({ onSubmit, defaults }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; defaults?: any }) {
    return (
      <form onSubmit={onSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input name="title" required defaultValue={defaults?.title} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" rows={3} defaultValue={defaults?.description} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location (City, Country)</label>
          <input name="location" defaultValue={defaults?.location} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input name="dates" type="date" defaultValue={defaults?.dates?.split("T")[0]} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Registration Link</label>
          <input name="registration_link" type="url" defaultValue={defaults?.registration_link} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input name="price" type="number" defaultValue={defaults?.price} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input name="max_capacity" type="number" defaultValue={defaults?.max_capacity} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Saving..." : defaults ? "Update Seminar" : "Create Seminar"}
        </button>
      </form>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-black text-neuro-navy">Seminars</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Create Seminar
        </button>
      </div>

      {/* Seminar List */}
      {seminars.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>No seminars yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {seminars.map((sem) => {
            const status = getSeminarStatus(sem);
            return (
              <div key={sem.id} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{sem.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    {sem.description && (
                      <p className="text-gray-500 text-sm line-clamp-1 mt-1">{sem.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {sem.location && <span>{sem.location}</span>}
                      {sem.dates && <span>{new Date(sem.dates).toLocaleDateString()}</span>}
                      {sem.registrations?.[0]?.count != null && (
                        <span>{sem.registrations[0].count} registered</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditSeminar(sem)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sem.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Create Seminar</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SeminarForm onSubmit={handleCreate} />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editSeminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Edit Seminar</h2>
              <button onClick={() => setEditSeminar(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SeminarForm onSubmit={handleEdit} defaults={editSeminar} />
          </div>
        </div>
      )}
    </div>
  );
}
