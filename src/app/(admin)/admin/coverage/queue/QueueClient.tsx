'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getQueueStats,
  getQueueItems,
  claimItem,
  getWorkItem,
  markAsSent,
  escalateItem,
  skipItem,
  releaseItem,
} from './actions'
import type { QueueItem, QueueStats, WorkItem, DoctorPick } from './actions'

// ── Helpers ──

const COUNTRY_FLAGS: Record<string, string> = {
  US: '',
  CA: '\u{1F1E8}\u{1F1E6}',
  GB: '\u{1F1EC}\u{1F1E7}',
  AU: '\u{1F1E6}\u{1F1FA}',
  NZ: '\u{1F1F3}\u{1F1FF}',
}

function tierLabel(tier: 1 | 2 | 3 | 4) {
  switch (tier) {
    case 1: return { text: 'Nearby', color: 'bg-green-500' }
    case 2: return { text: 'Far', color: 'bg-amber-500' }
    case 3: return { text: 'No Doc', color: 'bg-red-500' }
    case 4: return { text: 'Unresolved', color: 'bg-gray-500' }
  }
}

function formatDate(d: string | null) {
  if (!d) return 'Unknown'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysAgo(d: string | null) {
  if (!d) return 0
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
}

const SKIP_REASONS = [
  'no location given',
  'not actually a request',
  'duplicate',
  'spam',
  'unclear',
]

const AMBIGUITY_WORDS = ['area', 'region', 'northwest', 'northeast', 'southwest', 'southeast', 'northern', 'southern', 'eastern', 'western', 'metro', 'greater']

function hasAmbiguity(city: string) {
  const lower = city.toLowerCase()
  return AMBIGUITY_WORDS.some(w => lower.includes(w))
}

// ── Completeness dots ──

function CompletenessDots({ doc }: { doc: DoctorPick }) {
  const dots = [doc.hasPhoto, doc.hasBooking, doc.hasHours]
  return (
    <span className="inline-flex gap-1 ml-2">
      {dots.map((filled, i) => (
        <span key={i} className={`w-2 h-2 rounded-full ${filled ? 'bg-green-400' : 'bg-gray-600'}`} />
      ))}
    </span>
  )
}

// ── Main Component ──

export default function QueueClient() {
  const [mode, setMode] = useState<'queue' | 'work'>('queue')
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [items, setItems] = useState<QueueItem[]>([])
  const [tierFilter, setTierFilter] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Work mode state
  const [workItem, setWorkItem] = useState<WorkItem | null>(null)
  const [copiedComment, setCopiedComment] = useState(false)
  const [copiedDM, setCopiedDM] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [showAlternates, setShowAlternates] = useState(false)
  const [escalateOpen, setEscalateOpen] = useState(false)
  const [escalateReason, setEscalateReason] = useState('')
  const [skipOpen, setSkipOpen] = useState(false)

  const workItemRef = useRef(workItem)
  workItemRef.current = workItem
  const copiedCommentRef = useRef(copiedComment)
  copiedCommentRef.current = copiedComment
  const copiedDMRef = useRef(copiedDM)
  copiedDMRef.current = copiedDM

  // ── Load queue ──

  const loadQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, q] = await Promise.all([
        getQueueStats(),
        getQueueItems(50, 0, tierFilter ? { tier: tierFilter } : undefined),
      ])
      setStats(s)
      setItems(q)
    } catch (e: any) {
      setError(e.message || 'Failed to load queue')
    } finally {
      setLoading(false)
    }
  }, [tierFilter])

  useEffect(() => { loadQueue() }, [loadQueue])

  // ── Claim and enter work mode ──

  const handleClaim = async (id: string) => {
    setError(null)
    const result = await claimItem(id)
    if (!result.success) {
      setError(result.error || 'Failed to claim item')
      return
    }
    const wi = await getWorkItem(id)
    if (!wi) {
      setError('Failed to load work item')
      return
    }
    setWorkItem(wi)
    setCopiedComment(false)
    setCopiedDM(false)
    setSendError(null)
    setShowAlternates(false)
    setEscalateOpen(false)
    setSkipOpen(false)
    setMode('work')
  }

  // ── Work mode actions ──

  const copyToClipboard = async (text: string, which: 'comment' | 'dm') => {
    await navigator.clipboard.writeText(text)
    if (which === 'comment') setCopiedComment(true)
    else setCopiedDM(true)
  }

  const handleMarkAsSent = async () => {
    if (!workItem || !copiedComment || !copiedDM) return
    setSending(true)
    setSendError(null)

    const m = workItem.mention
    const doc = workItem.recommendation
    const commentTplId = workItem.templatePath === 'far' ? 'doctor_comment_far' : workItem.templatePath === 'standard' ? 'doctor_comment' : 'waitlist_comment'
    const dmTplId = workItem.templatePath === 'far' ? 'doctor_dm_far' : workItem.templatePath === 'standard' ? 'doctor_dm' : 'waitlist_dm'

    const result = await markAsSent(
      m.id,
      doc?.id ?? null,
      doc?.distanceMiles ?? null,
      workItem.templatePath,
      commentTplId,
      dmTplId,
      workItem.filledComment,
      workItem.filledDM,
      m.city,
      m.state,
    )

    if (!result.success) {
      setSendError(result.error || 'Failed to mark as sent')
      setSending(false)
      return
    }

    // Auto-advance
    if (result.nextId) {
      await handleClaim(result.nextId)
    } else {
      setWorkItem(null)
      setMode('queue')
      loadQueue()
    }
    setSending(false)
  }

  const handleEscalate = async () => {
    if (!workItem || !escalateReason.trim()) return
    const result = await escalateItem(workItem.mention.id, escalateReason.trim())
    if (result.nextId) {
      await handleClaim(result.nextId)
    } else {
      setMode('queue')
      loadQueue()
    }
    setEscalateOpen(false)
    setEscalateReason('')
  }

  const handleSkip = async (reason: string) => {
    if (!workItem) return
    const result = await skipItem(workItem.mention.id, reason)
    setSkipOpen(false)
    if (result.nextId) {
      await handleClaim(result.nextId)
    } else {
      setMode('queue')
      loadQueue()
    }
  }

  const handleRelease = async () => {
    if (!workItem) return
    await releaseItem(workItem.mention.id)
    setWorkItem(null)
    setMode('queue')
    loadQueue()
  }

  // ── Keyboard shortcuts ──

  useEffect(() => {
    if (mode !== 'work') return
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const wi = workItemRef.current
      if (!wi) return

      if (e.key === '1') {
        e.preventDefault()
        copyToClipboard(wi.filledComment, 'comment')
      } else if (e.key === '2') {
        e.preventDefault()
        copyToClipboard(wi.filledDM, 'dm')
      } else if (e.key === 'Enter' && copiedCommentRef.current && copiedDMRef.current) {
        e.preventDefault()
        handleMarkAsSent()
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        setEscalateOpen(true)
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        setSkipOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mode])

  // ── Render: Queue list ──

  if (mode === 'queue') {
    return (
      <div className="min-h-screen bg-[#15202B] text-white p-6">
        <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Lato, sans-serif' }}>Coverage Queue</h1>

        {/* Stats */}
        {stats && (
          <div className="mb-6">
            <div className="flex gap-4 text-sm text-gray-300 mb-2">
              <span>{stats.unworked} unworked</span>
              <span className="text-gray-600">·</span>
              <span>{stats.workedToday} worked today</span>
              <span className="text-gray-600">·</span>
              <span>{stats.workedTodayByMe} by me</span>
            </div>
            {stats.oldestUnworked && (
              <p className="text-[#D66829] text-lg font-semibold">
                Oldest request: {formatDate(stats.oldestUnworked)} ({daysAgo(stats.oldestUnworked)} days ago)
              </p>
            )}
          </div>
        )}

        {/* Tier filters */}
        <div className="flex gap-2 mb-6">
          {[
            { val: null, label: 'All' },
            { val: 1, label: 'Nearby (<30mi)' },
            { val: 2, label: 'Far (30-75mi)' },
            { val: 3, label: 'No Doc (>75mi)' },
            { val: 4, label: 'Unresolved' },
          ].map(f => (
            <button
              key={f.label}
              onClick={() => setTierFilter(f.val)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                tierFilter === f.val
                  ? 'bg-[#D66829] text-white'
                  : 'bg-[#1a2744] text-gray-300 hover:bg-[#243352]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <p className="text-gray-400">Loading queue...</p>}

        {/* Queue table */}
        {!loading && items.length === 0 && (
          <p className="text-gray-400 text-center py-12">No items in queue. All caught up.</p>
        )}

        {!loading && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 px-3">Location</th>
                  <th className="text-left py-2 px-3">Tier</th>
                  <th className="text-left py-2 px-3">Nearest Doctor</th>
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const t = tierLabel(item.tier)
                  const flag = COUNTRY_FLAGS[item.country] || ''
                  return (
                    <tr key={item.id} className="border-b border-gray-800 hover:bg-[#1a2744]">
                      <td className="py-3 px-3">
                        <span className="font-medium">{item.city}, {item.state}</span>
                        {flag && <span className="ml-2">{flag}</span>}
                        {item.likely_already_worked && (
                          <span className="block text-xs text-gray-500 mt-0.5">may already be replied to</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold text-white ${t.color}`}>
                          {t.text}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {item.nearest_doctor ? (
                          <span>
                            {item.nearest_doctor.name}
                            <span className="text-gray-400 ml-1">
                              ({item.nearest_distance !== null ? `${item.nearest_distance} mi` : '?'})
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-400">{formatDate(item.mentioned_on)}</td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleClaim(item.id)}
                          className="px-3 py-1.5 rounded text-sm font-semibold bg-[#D66829] text-white hover:bg-[#c05a22] transition"
                        >
                          Work this one
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // ── Render: Work mode ──

  if (!workItem) {
    return (
      <div className="min-h-screen bg-[#15202B] text-white flex items-center justify-center">
        <p className="text-gray-400">Loading work item...</p>
      </div>
    )
  }

  const m = workItem.mention
  const rec = workItem.recommendation
  const flag = COUNTRY_FLAGS[m.country] || ''

  return (
    <div className="min-h-screen bg-[#15202B] text-white p-6 max-w-4xl mx-auto">

      {/* Block 1 - Who asked */}
      <div className="bg-[#1a2744] rounded-lg p-5 mb-4">
        <h2 className="text-lg font-bold mb-2" style={{ fontFamily: 'Lato, sans-serif' }}>Who Asked</h2>
        <p className="text-xl font-semibold">
          {m.city}, {m.state} {flag && <span className="ml-1">{flag}</span>}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Mentioned {formatDate(m.mentioned_on)} ({daysAgo(m.mentioned_on)} days ago)
        </p>
        <p className="text-sm text-gray-400">Source: {m.source}{m.post_ref ? ` / ${m.post_ref}` : ''}</p>
        {m.likely_already_worked && (
          <div className="mt-2 bg-amber-900/30 border border-amber-600 text-amber-300 text-sm px-3 py-1.5 rounded">
            This request may already be replied to. Double-check before sending.
          </div>
        )}
      </div>

      {/* Block 2 - Resolution */}
      <div className="bg-[#1a2744] rounded-lg p-5 mb-4">
        <h2 className="text-lg font-bold mb-2" style={{ fontFamily: 'Lato, sans-serif' }}>Resolution</h2>
        <p className="text-2xl font-bold">{m.city}, {m.state}</p>
        {hasAmbiguity(m.city) && (
          <div className="mt-2 bg-amber-900/30 border border-amber-600 text-amber-300 text-sm px-3 py-1.5 rounded">
            Ambiguity warning: &quot;{m.city}&quot; may refer to a region, not a specific city.
          </div>
        )}
      </div>

      {/* Block 3 - Recommendation */}
      <div className="bg-[#1a2744] rounded-lg p-5 mb-4">
        <h2 className="text-lg font-bold mb-2" style={{ fontFamily: 'Lato, sans-serif' }}>Recommendation</h2>
        {rec ? (
          <>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs flex-shrink-0 overflow-hidden">
                {rec.photoUrl ? (
                  <img src={rec.photoUrl} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  'No photo'
                )}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold">
                  {rec.name}
                  <CompletenessDots doc={rec} />
                </p>
                {rec.clinicName && <p className="text-sm text-gray-300">{rec.clinicName}</p>}
                <p className="text-sm text-gray-400">{rec.city}, {rec.state} - {rec.distanceMiles} miles away</p>
                {rec.handle && <p className="text-sm text-gray-400">@{rec.handle}</p>}
                <p className="text-sm text-green-400 mt-1">{rec.pickReason}</p>
              </div>
            </div>

            {workItem.alternates.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowAlternates(!showAlternates)}
                  className="text-sm text-gray-400 hover:text-gray-200 underline"
                >
                  {showAlternates ? 'Hide other options' : `Show other options (${workItem.alternates.length})`}
                </button>
                {showAlternates && (
                  <div className="mt-2 space-y-2">
                    {workItem.alternates.map(alt => (
                      <div key={alt.id} className="bg-[#15202B] rounded p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-500 text-xs flex-shrink-0 overflow-hidden">
                          {alt.photoUrl ? (
                            <img src={alt.photoUrl} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {alt.name}
                            <CompletenessDots doc={alt} />
                          </p>
                          <p className="text-xs text-gray-400">
                            {alt.city}, {alt.state} - {alt.distanceMiles} mi
                            {alt.handle && <span> / @{alt.handle}</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded text-center">
            <p className="text-lg font-bold">No doctor within range</p>
            <p className="text-sm mt-1">This request will use the waitlist template path.</p>
          </div>
        )}
      </div>

      {/* Block 4 - Action */}
      <div className="bg-[#1a2744] rounded-lg p-5 mb-4">
        <h2 className="text-lg font-bold mb-2" style={{ fontFamily: 'Lato, sans-serif' }}>Action</h2>
        <p className="text-sm text-gray-400 mb-4">{workItem.templateReason}</p>

        {/* Send error */}
        {sendError && (
          <div className="bg-red-900/60 border-2 border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm font-semibold">
            {sendError}
          </div>
        )}

        {/* Step 1: Copy Comment */}
        <div className="mb-4">
          <button
            onClick={() => copyToClipboard(workItem.filledComment, 'comment')}
            className={`w-full py-3 rounded font-bold text-lg transition ${
              copiedComment
                ? 'bg-[#D66829]/40 text-[#D66829]/60 cursor-default'
                : 'bg-[#D66829] text-white hover:bg-[#c05a22]'
            }`}
          >
            {copiedComment ? 'Comment Copied' : '1. Copy Comment'}
          </button>
          <div className="mt-2 bg-[#15202B] rounded p-3 text-sm text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {workItem.filledComment || '(empty template)'}
          </div>
        </div>

        {/* Step 2: Copy DM */}
        <div className="mb-4">
          <button
            onClick={() => copyToClipboard(workItem.filledDM, 'dm')}
            className={`w-full py-3 rounded font-bold text-lg transition ${
              copiedDM
                ? 'bg-cyan-500/40 text-cyan-400/60 cursor-default'
                : 'bg-cyan-500 text-white hover:bg-cyan-600'
            }`}
          >
            {copiedDM ? 'DM Copied' : '2. Copy DM'}
          </button>
          <div className="mt-2 bg-[#15202B] rounded p-3 text-sm text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {workItem.filledDM || '(empty template)'}
          </div>
        </div>

        {/* Step 3: Mark as Sent */}
        <button
          onClick={handleMarkAsSent}
          disabled={!copiedComment || !copiedDM || sending}
          className={`w-full py-3 rounded font-bold text-lg transition ${
            copiedComment && copiedDM && !sending
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-green-900/40 text-green-700 cursor-not-allowed'
          }`}
        >
          {sending ? 'Sending...' : '3. Mark as Sent'}
        </button>
      </div>

      {/* Block 5 - Escape hatches */}
      <div className="bg-[#1a2744] rounded-lg p-5 mb-4">
        <div className="flex flex-wrap gap-3">
          {/* Escalate */}
          <button
            onClick={() => setEscalateOpen(!escalateOpen)}
            className="px-4 py-2 rounded text-sm font-medium bg-[#15202B] text-gray-300 hover:bg-[#243352] border border-gray-700 transition"
          >
            Escalate to Ray
          </button>

          {/* Skip */}
          <div className="relative">
            <button
              onClick={() => setSkipOpen(!skipOpen)}
              className="px-4 py-2 rounded text-sm font-medium bg-[#15202B] text-gray-300 hover:bg-[#243352] border border-gray-700 transition"
            >
              Skip
            </button>
            {skipOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-[#1a2744] border border-gray-600 rounded shadow-xl z-10 min-w-[200px]">
                {SKIP_REASONS.map(reason => (
                  <button
                    key={reason}
                    onClick={() => handleSkip(reason)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#243352] first:rounded-t last:rounded-b"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Put back */}
          <button
            onClick={handleRelease}
            className="px-4 py-2 rounded text-sm font-medium bg-[#15202B] text-gray-300 hover:bg-[#243352] border border-gray-700 transition"
          >
            Put back
          </button>
        </div>

        {/* Escalate input */}
        {escalateOpen && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={escalateReason}
              onChange={e => setEscalateReason(e.target.value)}
              placeholder="Reason for escalation..."
              className="flex-1 px-3 py-2 rounded bg-[#15202B] border border-gray-600 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#D66829]"
              onKeyDown={e => { if (e.key === 'Enter') handleEscalate() }}
            />
            <button
              onClick={handleEscalate}
              disabled={!escalateReason.trim()}
              className="px-4 py-2 rounded text-sm font-semibold bg-[#D66829] text-white hover:bg-[#c05a22] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Send
            </button>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts */}
      <div className="text-center text-xs text-gray-600 mt-6 space-x-4">
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded">1</kbd> copy comment</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded">2</kbd> copy DM</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded">Enter</kbd> mark as sent</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded">E</kbd> escalate</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded">S</kbd> skip</span>
      </div>
    </div>
  )
}
