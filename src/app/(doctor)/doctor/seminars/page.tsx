"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Calendar, Loader2, Pencil, Trash2, ChevronDown } from "lucide-react";
import {
  getDoctorSeminars,
  createSeminarAction,
  updateSeminarAction,
  deleteSeminarAction,
  addStudentTicketsAction,
  getSeminarRegistrants,
  getEnhancedSeminarAnalytics,
} from "./actions";
import SeminarRecommendations from "./recommendations";
import PageHeader from "@/components/portal/PageHeader";
import EmptyState from "@/components/portal/EmptyState";
import StatusPill from "@/components/portal/StatusPill";
import StatList from "@/components/portal/StatList";
import { SEMINAR_CONFIG } from "@/config/seminars";
import { seminarStatRows } from "@/lib/portal/seminar-recommendations";

export default function SeminarsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
      <SeminarsPageInner />
    </Suspense>
  );
}

function eventDateNeedsCheck(seminar: { dates?: string | null; start_time?: string | null }) {
  const cutoff = Date.UTC(2020, 0, 1);
  return [seminar.dates, seminar.start_time].some((value) => {
    if (!value) return false;
    const time = new Date(value).getTime();
    return Number.isFinite(time) && time < cutoff;
  });
}

function SeminarsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [seminars, setSeminars] = useState<any[]>([]);
  const [ticketNote, setTicketNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editSeminar, setEditSeminar] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSeminarId, setSelectedSeminarId] = useState<string | null>(null);
  const [registrants, setRegistrants] = useState<any[]>([]);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  async function loadData() {
    setLoading(true);
    const [data, stats] = await Promise.all([getDoctorSeminars(), getEnhancedSeminarAnalytics()]);
    setSeminars(data);
    if (stats) setAnalytics(stats);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const showCreateModal = searchParams.get("create") === "1";

  function closeCreate() {
    if (showCreateModal) router.replace("/doctor/seminars");
  }

  function getSeminarStatus(seminar: any): { label: string; color: string } {
    if (!seminar.is_approved) return { label: "In review", color: "bg-amber-100 text-amber-800" };
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
    closeCreate();
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CE Credit Hours</label>
          <input name="ce_hours" type="number" step="0.5" min="0" defaultValue={defaults?.ce_hours} placeholder="e.g., 8" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <p className="text-xs text-gray-400 mt-1">Number of continuing education hours this seminar provides</p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-portal-info-bg text-white rounded-lg hover:bg-portal-info-bg transition-colors text-sm font-medium disabled:opacity-50"
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
    <div className="space-y-6">
      <PageHeader
        title="Your seminars"
        description="Create one, share the link, and see who registered."
        primary={{ label: "Create seminar", href: "/doctor/seminars?create=1" }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <article className="bg-white border border-portal-border rounded-xl p-4">
          <h2 className="text-lg font-bold text-portal-ink">{SEMINAR_CONFIG.packages.single.name}</h2>
          <p className="mt-1 text-2xl font-bold text-portal-ink">${SEMINAR_CONFIG.packages.single.priceUsd}</p>
          <p className="mt-1 text-sm text-portal-ink-2">One seminar.</p>
        </article>
        <article className="bg-white border border-portal-border rounded-xl p-4">
          <h2 className="text-lg font-bold text-portal-ink">{SEMINAR_CONFIG.packages.annual.name}</h2>
          <p className="mt-1 text-2xl font-bold text-portal-ink">${SEMINAR_CONFIG.packages.annual.priceUsd}</p>
          <p className="mt-1 text-sm text-portal-ink-2">Up to {SEMINAR_CONFIG.packages.annual.seminars} seminars a year.</p>
        </article>
        <article className="bg-white border border-portal-border rounded-xl p-4">
          <h2 className="text-lg font-bold text-portal-ink">{SEMINAR_CONFIG.featuredAddon.name}</h2>
          <p className="mt-1 text-2xl font-bold text-portal-ink">${SEMINAR_CONFIG.featuredAddon.priceUsd}</p>
          <p className="mt-1 text-sm text-portal-ink-2">{SEMINAR_CONFIG.featuredAddon.days} days of featured placement.</p>
        </article>
      </div>

      <details className="group bg-white border border-portal-border rounded-xl">
        <summary className="flex w-full min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-portal-ink [&::-webkit-details-marker]:hidden">
          <span>How hosting works</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-portal-ink transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <ol className="list-decimal space-y-2 px-8 pb-4 text-sm text-portal-ink-2">
          <li>Create your seminar (title, dates, city, price, CE hours).</li>
          <li>
            Pick a package. {SEMINAR_CONFIG.packages.single.name} is ${SEMINAR_CONFIG.packages.single.priceUsd}.{" "}
            {SEMINAR_CONFIG.packages.annual.name} is ${SEMINAR_CONFIG.packages.annual.priceUsd} for up to {SEMINAR_CONFIG.packages.annual.seminars} seminars a year.{" "}
            {SEMINAR_CONFIG.featuredAddon.name} is ${SEMINAR_CONFIG.featuredAddon.priceUsd}.
          </li>
          <li>We review it and email you when it&apos;s live.</li>
          <li>Share your link and see who registered, with CSV export.</li>
        </ol>
      </details>

      {analytics && analytics.totalSeminars > 0 ? (
        <StatList title="Your hosting" rows={seminarStatRows(analytics)} />
      ) : null}

      {/* Recommendations */}
      <div className="mb-6">
        <SeminarRecommendations />
      </div>

      {/* Seminar List */}
      {ticketNote ? <p className="text-sm text-portal-ink-2">{ticketNote}</p> : null}
      {seminars.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No seminars yet"
          sentence="Create one, share the link, and see who registered."
          action={{ label: "Create seminar", href: "/doctor/seminars?create=1" }}
        />
      ) : (
        <div className="space-y-4">
          {seminars.map((sem) => {
            const status = getSeminarStatus(sem);
            return (
              <div key={sem.id} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-portal-ink">{sem.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      {eventDateNeedsCheck(sem) && <StatusPill label="Check this date" tone="follow" />}
                    </div>
                    {sem.description && (
                      <p className="text-gray-500 text-sm line-clamp-1 mt-1">{sem.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {sem.location && <span>{sem.location}</span>}
                      {sem.dates && <span>{new Date(sem.dates).toLocaleDateString()}</span>}
                      {sem.registrations?.[0]?.count != null && (
                        <button
                          onClick={() => setSelectedSeminarId(selectedSeminarId === sem.id ? null : sem.id)}
                          className="text-neuro-orange font-bold hover:underline"
                        >
                          {sem.registrations[0].count} registered
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await addStudentTicketsAction(sem.id);
                        if ("error" in result && result.error) setTicketNote(result.error);
                        else if ("already" in result && result.already) setTicketNote("Student tickets are already on this seminar.");
                        else setTicketNote("Student tickets added.");
                      }}
                      className="min-h-11 px-3 text-sm font-bold text-[#B4501A]"
                    >
                      Add student tickets
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditSeminar(sem)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      aria-label="Edit seminar"
                      title="Edit seminar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(sem.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                      aria-label="Delete seminar"
                      title="Delete seminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Registrant List */}
                {selectedSeminarId === sem.id && (
                  <RegistrantList seminarId={sem.id} />
                )}
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
              <button type="button" onClick={closeCreate} className="p-1 hover:bg-gray-100 rounded" aria-label="Close" title="Close">
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
              <button type="button" onClick={() => setEditSeminar(null)} className="p-1 hover:bg-gray-100 rounded" aria-label="Close" title="Close">
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

function RegistrantList({ seminarId }: { seminarId: string }) {
  const [registrants, setRegistrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSeminarRegistrants(seminarId).then((data) => {
      setRegistrants(data);
      setLoading(false);
    });
  }, [seminarId]);

  if (loading) return <div className="p-4 text-center text-gray-400 text-sm">Loading registrants...</div>;

  if (registrants.length === 0) return <div className="p-4 text-center text-gray-400 text-sm">No registrants yet.</div>;

  return (
    <div className="border-t border-gray-100 p-4">
      <p className="text-xs font-bold text-gray-400 tracking-wide mb-3">Registrants</p>
      <div className="space-y-2">
        {registrants.map((r) => (
          <div key={r.id} className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-neuro-navy">{r.name}</span>
              {r.email && <a href={`mailto:${r.email}`} className="text-neuro-orange ml-2 hover:underline text-xs">{r.email}</a>}
            </div>
            <span className="text-xs text-gray-400">{new Date(r.registeredAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
