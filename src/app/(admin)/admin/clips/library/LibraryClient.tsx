'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DoctorOption, ClipCaption, GeneratedCaptions } from '../actions'
import {
  getDoctorsForClips,
  getClipLibrary,
  updateClipStatus,
  deleteClip,
  bulkUpdateClipStatus,
  exportClipsCSV,
} from '../actions'
import TabNav from '../TabNav'

// ── Copy Button ──

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition text-white/70 hover:text-white"
    >
      {copied ? 'Copied' : label || 'Copy'}
    </button>
  )
}

function OutputCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a2744] rounded-xl p-5 space-y-3">
      <p className="text-[11px] text-white/40 uppercase font-bold tracking-wider">{label}</p>
      {children}
    </div>
  )
}

const STATUS_OPTIONS = ['draft', 'approved', 'scheduled', 'posted'] as const
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-blue-500/20 text-blue-400',
  scheduled: 'bg-purple-500/20 text-purple-400',
  posted: 'bg-green-500/20 text-green-400',
}

export default function LibraryClient() {
  const [doctors, setDoctors] = useState<DoctorOption[]>([])
  const [clips, setClips] = useState<ClipCaption[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterDoctor, setFilterDoctor] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Modal
  const [modalClip, setModalClip] = useState<ClipCaption | null>(null)

  // Load doctors
  useEffect(() => {
    getDoctorsForClips().then(setDoctors).catch(() => {})
  }, [])

  // Load clips
  const loadClips = useCallback(async () => {
    setLoading(true)
    const result = await getClipLibrary({
      doctorId: filterDoctor || undefined,
      status: filterStatus || undefined,
      search: filterSearch || undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    })
    setClips(result.clips)
    setTotal(result.total)
    setSelected(new Set())
    setLoading(false)
  }, [filterDoctor, filterStatus, filterSearch, page])

  useEffect(() => {
    loadClips()
  }, [loadClips])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [filterDoctor, filterStatus, filterSearch])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === clips.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(clips.map((c) => c.id)))
    }
  }

  const handleBulkStatus = async (status: string) => {
    if (selected.size === 0) return
    await bulkUpdateClipStatus([...selected], status)
    await loadClips()
  }

  const handleStatusChange = async (id: string, status: string) => {
    await updateClipStatus(id, status)
    await loadClips()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this clip?')) return
    await deleteClip(id)
    if (modalClip?.id === id) setModalClip(null)
    await loadClips()
  }

  const handleExport = async () => {
    const csv = await exportClipsCSV({
      doctorId: filterDoctor || undefined,
      status: filterStatus || undefined,
    })
    if (!csv) return alert('No clips to export')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clip-captions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getHook = (clip: ClipCaption): string => {
    if (clip.hook_selected) return clip.hook_selected
    if (clip.generated?.hooks?.[0]) return clip.generated.hooks[0]
    return ''
  }

  return (
    <div className="min-h-screen bg-[#15202B] text-white p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <TabNav />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clip Library</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition text-white/70 hover:text-white"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterDoctor}
          onChange={(e) => setFilterDoctor(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D66829]/50"
        >
          <option value="">All Doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} - {d.city}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D66829]/50"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          placeholder="Search transcripts, topics..."
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D66829]/50 flex-1 min-w-[200px]"
        />
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-[#1a2744] rounded-lg px-4 py-3">
          <span className="text-sm text-white/60">{selected.size} selected</span>
          <button
            onClick={() => handleBulkStatus('approved')}
            className="text-xs px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
          >
            Mark Approved
          </button>
          <button
            onClick={() => handleBulkStatus('scheduled')}
            className="text-xs px-3 py-1.5 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition"
          >
            Mark Scheduled
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40 text-left">
              <th className="py-3 px-2 w-8">
                <input
                  type="checkbox"
                  checked={clips.length > 0 && selected.size === clips.length}
                  onChange={toggleAll}
                  className="accent-[#D66829]"
                />
              </th>
              <th className="py-3 px-2">Doctor</th>
              <th className="py-3 px-2">City</th>
              <th className="py-3 px-2">Hook</th>
              <th className="py-3 px-2 w-24">Status</th>
              <th className="py-3 px-2 w-28">Created</th>
              <th className="py-3 px-2 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-white/30">
                  Loading...
                </td>
              </tr>
            ) : clips.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-white/30">
                  No clips found
                </td>
              </tr>
            ) : (
              clips.map((clip) => (
                <tr
                  key={clip.id}
                  className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                >
                  <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(clip.id)}
                      onChange={() => toggleSelect(clip.id)}
                      className="accent-[#D66829]"
                    />
                  </td>
                  <td className="py-3 px-2 text-white/90" onClick={() => setModalClip(clip)}>
                    {clip.doctor_name}
                  </td>
                  <td className="py-3 px-2 text-white/50" onClick={() => setModalClip(clip)}>
                    {clip.doctor_city}
                  </td>
                  <td
                    className="py-3 px-2 text-white/70 max-w-[300px] truncate"
                    onClick={() => setModalClip(clip)}
                  >
                    {getHook(clip)}
                  </td>
                  <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={clip.status}
                      onChange={(e) => handleStatusChange(clip.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${STATUS_COLORS[clip.status] || 'bg-white/10 text-white/50'}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-2 text-white/40" onClick={() => setModalClip(clip)}>
                    {new Date(clip.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(clip.id)}
                      className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/40">
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {modalClip && modalClip.generated && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-10 overflow-y-auto"
          onClick={() => setModalClip(null)}
        >
          <div
            className="bg-[#15202B] border border-white/10 rounded-2xl p-6 max-w-2xl w-full mx-4 mb-10 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{modalClip.doctor_name}</h2>
                <p className="text-sm text-white/40">{modalClip.doctor_city}</p>
              </div>
              <button
                onClick={() => setModalClip(null)}
                className="text-white/40 hover:text-white text-xl"
              >
                x
              </button>
            </div>

            {/* Hooks */}
            <OutputCard label="Hook Options">
              <div className="space-y-2">
                {modalClip.generated.hooks.map((hook: string, i: number) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      modalClip.hook_selected === hook
                        ? 'bg-[#D66829]/20 border border-[#D66829]/40'
                        : 'bg-white/5'
                    }`}
                  >
                    <span className="text-sm text-white/90">{hook}</span>
                    <CopyButton text={hook} />
                  </div>
                ))}
              </div>
            </OutputCard>

            <OutputCard label="On-Screen Text">
              <div className="flex items-center justify-between">
                <p className="text-white/90 text-sm">{modalClip.generated.on_screen_text}</p>
                <CopyButton text={modalClip.generated.on_screen_text} />
              </div>
            </OutputCard>

            <OutputCard label="Instagram Reels Caption">
              <div className="space-y-2">
                <p className="text-white/90 text-sm whitespace-pre-wrap">
                  {modalClip.generated.instagram_caption}
                </p>
                <div className="flex justify-end">
                  <CopyButton text={modalClip.generated.instagram_caption} />
                </div>
              </div>
            </OutputCard>

            <OutputCard label="TikTok Caption">
              <div className="space-y-2">
                <p className="text-white/90 text-sm whitespace-pre-wrap">
                  {modalClip.generated.tiktok_caption}
                </p>
                <div className="flex justify-end">
                  <CopyButton text={modalClip.generated.tiktok_caption} />
                </div>
              </div>
            </OutputCard>

            <OutputCard label="YouTube Shorts Title">
              <div className="flex items-center justify-between gap-4">
                <p className="text-white/90 text-sm">{modalClip.generated.youtube_title}</p>
                <CopyButton text={modalClip.generated.youtube_title} />
              </div>
            </OutputCard>

            <OutputCard label="YouTube Shorts Description">
              <div className="space-y-2">
                <p className="text-white/90 text-sm whitespace-pre-wrap">
                  {modalClip.generated.youtube_description}
                </p>
                <div className="flex justify-end">
                  <CopyButton text={modalClip.generated.youtube_description} />
                </div>
              </div>
            </OutputCard>

            <div className="flex justify-between items-center pt-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[modalClip.status] || 'bg-white/10 text-white/50'}`}>
                {modalClip.status}
              </span>
              <CopyButton
                text={[
                  `HOOK: ${getHook(modalClip)}`,
                  '',
                  `ON-SCREEN TEXT: ${modalClip.generated.on_screen_text}`,
                  '',
                  `INSTAGRAM REELS CAPTION:`,
                  modalClip.generated.instagram_caption,
                  '',
                  `TIKTOK CAPTION:`,
                  modalClip.generated.tiktok_caption,
                  '',
                  `YOUTUBE SHORTS TITLE: ${modalClip.generated.youtube_title}`,
                  '',
                  `YOUTUBE SHORTS DESCRIPTION:`,
                  modalClip.generated.youtube_description,
                ].join('\n')}
                label="Copy All for Metricool"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
