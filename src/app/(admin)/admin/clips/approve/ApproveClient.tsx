'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ClipCaption, GeneratedCaptions } from '../actions'
import { getDraftClips, approveClip, updateClipGenerated, deleteClip } from '../actions'
import TabNav from '../TabNav'

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

export default function ApproveClient() {
  const [drafts, setDrafts] = useState<ClipCaption[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Editable fields
  const [editHooks, setEditHooks] = useState<[string, string, string]>(['', '', ''])
  const [editOnScreen, setEditOnScreen] = useState('')
  const [editInstagram, setEditInstagram] = useState('')
  const [editTiktok, setEditTiktok] = useState('')
  const [editYoutubeTitle, setEditYoutubeTitle] = useState('')
  const [editYoutubeDesc, setEditYoutubeDesc] = useState('')

  const loadDrafts = useCallback(async () => {
    setLoading(true)
    const data = await getDraftClips()
    setDrafts(data)
    setCurrentIdx(0)
    setEditing(false)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadDrafts()
  }, [loadDrafts])

  const current = drafts[currentIdx] || null
  const generated = current?.generated

  // Populate edit fields when entering edit mode
  const enterEdit = () => {
    if (!generated) return
    setEditHooks([...generated.hooks])
    setEditOnScreen(generated.on_screen_text)
    setEditInstagram(generated.instagram_caption)
    setEditTiktok(generated.tiktok_caption)
    setEditYoutubeTitle(generated.youtube_title)
    setEditYoutubeDesc(generated.youtube_description)
    setEditing(true)
  }

  const handleApprove = async () => {
    if (!current) return
    setSaving(true)
    await approveClip(current.id)
    console.log('[APPROVE] Approved clip', current.id, 'for', current.doctor_name)
    // Remove from list and advance
    const next = drafts.filter((_, i) => i !== currentIdx)
    setDrafts(next)
    if (currentIdx >= next.length && next.length > 0) {
      setCurrentIdx(next.length - 1)
    }
    setEditing(false)
    setSaving(false)
  }

  const handleSaveAndApprove = async () => {
    if (!current) return
    setSaving(true)

    const editedFields: string[] = []
    if (generated) {
      if (editHooks[0] !== generated.hooks[0]) editedFields.push('hook1')
      if (editHooks[1] !== generated.hooks[1]) editedFields.push('hook2')
      if (editHooks[2] !== generated.hooks[2]) editedFields.push('hook3')
      if (editOnScreen !== generated.on_screen_text) editedFields.push('on_screen_text')
      if (editInstagram !== generated.instagram_caption) editedFields.push('instagram_caption')
      if (editTiktok !== generated.tiktok_caption) editedFields.push('tiktok_caption')
      if (editYoutubeTitle !== generated.youtube_title) editedFields.push('youtube_title')
      if (editYoutubeDesc !== generated.youtube_description) editedFields.push('youtube_description')
    }

    if (editedFields.length > 0) {
      console.log('[APPROVE] Edited fields:', editedFields.join(', '), 'for clip', current.id)
    }

    const updatedGenerated: GeneratedCaptions = {
      hooks: editHooks,
      on_screen_text: editOnScreen,
      instagram_caption: editInstagram,
      tiktok_caption: editTiktok,
      youtube_title: editYoutubeTitle,
      youtube_description: editYoutubeDesc,
    }

    await updateClipGenerated(current.id, updatedGenerated)
    await approveClip(current.id)

    const next = drafts.filter((_, i) => i !== currentIdx)
    setDrafts(next)
    if (currentIdx >= next.length && next.length > 0) {
      setCurrentIdx(next.length - 1)
    }
    setEditing(false)
    setSaving(false)
  }

  const handleReject = async () => {
    if (!current) return
    if (!confirm('Delete this clip? This cannot be undone.')) return
    setSaving(true)
    console.log('[APPROVE] Rejected clip', current.id, 'for', current.doctor_name)
    await deleteClip(current.id)
    const next = drafts.filter((_, i) => i !== currentIdx)
    setDrafts(next)
    if (currentIdx >= next.length && next.length > 0) {
      setCurrentIdx(next.length - 1)
    }
    setEditing(false)
    setSaving(false)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (saving) return

      if (e.key === 'a' || e.key === 'A') {
        if (editing) handleSaveAndApprove()
        else handleApprove()
      }
      if (e.key === 'e' || e.key === 'E') {
        if (!editing) enterEdit()
      }
      if (e.key === 'r' || e.key === 'R') {
        handleReject()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15202B] text-white p-6 md:p-10 max-w-4xl mx-auto space-y-8">
        <TabNav />
        <p className="text-white/30 text-center py-20">Loading drafts...</p>
      </div>
    )
  }

  if (drafts.length === 0) {
    return (
      <div className="min-h-screen bg-[#15202B] text-white p-6 md:p-10 max-w-4xl mx-auto space-y-8">
        <TabNav />
        <h1 className="text-2xl font-bold">Approve Clips</h1>
        <div className="bg-[#1a2744] rounded-xl p-12 text-center">
          <p className="text-white/50 text-lg">No drafts to review</p>
          <p className="text-white/30 text-sm mt-2">All caught up. Generate more clips to get started.</p>
        </div>
      </div>
    )
  }

  if (!current || !generated) {
    return (
      <div className="min-h-screen bg-[#15202B] text-white p-6 md:p-10 max-w-4xl mx-auto space-y-8">
        <TabNav />
        <p className="text-white/30 text-center py-20">No clip data available</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#15202B] text-white p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <TabNav />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Approve Clips</h1>
        <span className="text-sm text-white/40">
          {currentIdx + 1} of {drafts.length} drafts remaining
        </span>
      </div>

      {/* Doctor info */}
      <div className="bg-[#1a2744] rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-white font-semibold">{current.doctor_name}</p>
          <p className="text-white/40 text-sm">{current.doctor_city}</p>
        </div>
        <p className="text-xs text-white/30">{new Date(current.created_at).toLocaleDateString()}</p>
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-4">
          <OutputCard label="Hook Options (editable)">
            <div className="space-y-2">
              {editHooks.map((hook, i) => (
                <input
                  key={i}
                  type="text"
                  value={hook}
                  onChange={(e) => {
                    const next = [...editHooks] as [string, string, string]
                    next[i] = e.target.value
                    setEditHooks(next)
                  }}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D66829]/50"
                />
              ))}
            </div>
          </OutputCard>

          <OutputCard label="On-Screen Text (editable)">
            <input
              type="text"
              value={editOnScreen}
              onChange={(e) => setEditOnScreen(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D66829]/50"
            />
          </OutputCard>

          <OutputCard label="Instagram Reels Caption (editable)">
            <textarea
              value={editInstagram}
              onChange={(e) => setEditInstagram(e.target.value)}
              rows={6}
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D66829]/50 resize-vertical"
            />
          </OutputCard>

          <OutputCard label="TikTok Caption (editable)">
            <textarea
              value={editTiktok}
              onChange={(e) => setEditTiktok(e.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D66829]/50 resize-vertical"
            />
          </OutputCard>

          <OutputCard label="YouTube Shorts Title (editable)">
            <div className="space-y-1">
              <input
                type="text"
                value={editYoutubeTitle}
                onChange={(e) => setEditYoutubeTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D66829]/50"
              />
              <p className={`text-xs ${editYoutubeTitle.length > 100 ? 'text-red-400' : 'text-white/30'}`}>
                {editYoutubeTitle.length}/100
              </p>
            </div>
          </OutputCard>

          <OutputCard label="YouTube Shorts Description (editable)">
            <textarea
              value={editYoutubeDesc}
              onChange={(e) => setEditYoutubeDesc(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D66829]/50 resize-vertical"
            />
          </OutputCard>
        </div>
      ) : (
        <div className="space-y-4">
          <OutputCard label="Hook Options">
            <div className="space-y-2">
              {generated.hooks.map((hook: string, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-sm text-white/90">{hook}</span>
                  <CopyButton text={hook} />
                </div>
              ))}
            </div>
          </OutputCard>

          <OutputCard label="On-Screen Text">
            <div className="flex items-center justify-between">
              <p className="text-white/90 text-sm">{generated.on_screen_text}</p>
              <CopyButton text={generated.on_screen_text} />
            </div>
          </OutputCard>

          <OutputCard label="Instagram Reels Caption">
            <div className="space-y-2">
              <p className="text-white/90 text-sm whitespace-pre-wrap">{generated.instagram_caption}</p>
              <div className="flex justify-end">
                <CopyButton text={generated.instagram_caption} />
              </div>
            </div>
          </OutputCard>

          <OutputCard label="TikTok Caption">
            <div className="space-y-2">
              <p className="text-white/90 text-sm whitespace-pre-wrap">{generated.tiktok_caption}</p>
              <div className="flex justify-end">
                <CopyButton text={generated.tiktok_caption} />
              </div>
            </div>
          </OutputCard>

          <OutputCard label="YouTube Shorts Title">
            <div className="flex items-center justify-between gap-4">
              <p className="text-white/90 text-sm">{generated.youtube_title}</p>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs ${generated.youtube_title.length > 100 ? 'text-red-400' : 'text-white/30'}`}>
                  {generated.youtube_title.length}/100
                </span>
                <CopyButton text={generated.youtube_title} />
              </div>
            </div>
          </OutputCard>

          <OutputCard label="YouTube Shorts Description">
            <div className="space-y-2">
              <p className="text-white/90 text-sm whitespace-pre-wrap">{generated.youtube_description}</p>
              <div className="flex justify-end">
                <CopyButton text={generated.youtube_description} />
              </div>
            </div>
          </OutputCard>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2 sticky bottom-6">
        {editing ? (
          <>
            <button
              onClick={handleSaveAndApprove}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
            >
              Save + Approve (A)
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-white/10 text-white/70 hover:bg-white/20 transition"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleApprove}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
            >
              Approve (A)
            </button>
            <button
              onClick={enterEdit}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#D66829] text-white hover:bg-[#c25a22] transition disabled:opacity-50"
            >
              Edit (E)
            </button>
            <button
              onClick={handleReject}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
            >
              Reject (R)
            </button>
          </>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-white/20 text-center">
        Keyboard: A = approve, E = edit, R = reject
      </p>
    </div>
  )
}
