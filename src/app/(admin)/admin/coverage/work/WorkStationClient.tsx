'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  workLookup,
  workMarkSent,
  workEscalate,
  getWorkSessionStats,
  type WorkLookupResult,
  type LookupResult,
  type AmbiguousResult,
  type DoctorPick,
} from './actions'

// ── Helpers ──

function normalizeHandle(raw: string): string {
  let v = raw.trim().toLowerCase()
  // Strip instagram URL
  const urlMatch = v.match(/instagram\.com\/([a-z0-9._]+)/)
  if (urlMatch) v = urlMatch[1]
  // Strip leading @
  v = v.replace(/^@/, '')
  return v
}

// ── Component ──

export default function WorkStationClient() {
  // Refs
  const locationRef = useRef<HTMLInputElement>(null)
  const handleRef = useRef<HTMLInputElement>(null)
  const escalationRef = useRef<HTMLInputElement>(null)

  // Inputs
  const [location, setLocation] = useState('')
  const [handle, setHandle] = useState('')
  const [country, setCountry] = useState('US')

  // Result
  const [result, setResult] = useState<WorkLookupResult | null>(null)
  const [loading, setLoading] = useState(false)

  // Alternates
  const [showAlternates, setShowAlternates] = useState(false)
  const [selectedAlternate, setSelectedAlternate] = useState<DoctorPick | null>(null)
  const [alternateReason, setAlternateReason] = useState('')

  // Copy states (persist until cleared)
  const [commentCopied, setCommentCopied] = useState(false)
  const [dmCopied, setDmCopied] = useState(false)

  // Escalation
  const [showEscalation, setShowEscalation] = useState(false)
  const [escalationReason, setEscalationReason] = useState('')
  const [escalationLoading, setEscalationLoading] = useState(false)

  // Session
  const [sessionCount, setSessionCount] = useState(0)
  const [todayCount, setTodayCount] = useState(0)

  // Error
  const [actionError, setActionError] = useState<string | null>(null)

  // Mark sent loading
  const [markSentLoading, setMarkSentLoading] = useState(false)

  // ── Focus helper ──
  const focusLocation = useCallback(() => {
    setTimeout(() => {
      locationRef.current?.focus()
      locationRef.current?.select()
    }, 0)
  }, [])

  // ── Load session stats on mount ──
  useEffect(() => {
    getWorkSessionStats().then((stats) => {
      setSessionCount(stats.todayByMe)
      setTodayCount(stats.today)
    })
  }, [])

  // ── Auto-focus on mount ──
  useEffect(() => {
    locationRef.current?.focus()
  }, [])

  // ── Lookup ──
  const doLookup = useCallback(async (query?: string) => {
    const q = (query || location).trim()
    if (!q) return
    setLoading(true)
    setActionError(null)
    try {
      const r = await workLookup(q, country)
      setResult(r)
      setShowAlternates(false)
      setSelectedAlternate(null)
      setAlternateReason('')
    } catch (err: any) {
      setResult({ success: false, error: err.message || 'Lookup failed', preserveInput: true })
    } finally {
      setLoading(false)
      focusLocation()
    }
  }, [location, country, focusLocation])

  // ── Copy to clipboard ──
  const copyComment = useCallback(() => {
    if (!result || !result.success || result.isAmbiguous) return
    const r = result as LookupResult
    navigator.clipboard.writeText(r.filledComment)
    setCommentCopied(true)
  }, [result])

  const copyDM = useCallback(() => {
    if (!result || !result.success || result.isAmbiguous) return
    const r = result as LookupResult
    navigator.clipboard.writeText(r.filledDM)
    setDmCopied(true)
  }, [result])

  // ── Clear all ──
  const clearAll = useCallback(() => {
    setLocation('')
    setHandle('')
    setResult(null)
    setCommentCopied(false)
    setDmCopied(false)
    setActionError(null)
    setShowAlternates(false)
    setSelectedAlternate(null)
    setAlternateReason('')
    setShowEscalation(false)
    setEscalationReason('')
    focusLocation()
  }, [focusLocation])

  // ── Mark sent ──
  const doMarkSent = useCallback(async (force?: boolean) => {
    if (!result || !result.success || result.isAmbiguous) return
    const r = result as LookupResult
    if (!force && (!commentCopied || !dmCopied)) return

    setMarkSentLoading(true)
    setActionError(null)

    const outcome = r.doctor
      ? `${r.templatePath}: ${r.doctor.name} (${r.doctor.distanceMiles}mi)`
      : `${r.templatePath}: no doctor`

    const normalizedHandle = handle.trim() ? normalizeHandle(handle) : null

    try {
      const res = await workMarkSent({
        resolvedCity: r.resolvedCity,
        resolvedState: r.resolvedState,
        resolvedCountry: r.resolvedCountry,
        resolvedLat: r.resolvedLat,
        resolvedLng: r.resolvedLng,
        doctorId: r.doctor?.id || null,
        distanceMiles: r.doctor?.distanceMiles || null,
        outcome,
        commentTemplateId: r.commentTemplateId,
        dmTemplateId: r.dmTemplateId,
        instagramHandle: normalizedHandle,
        copiedBoth: commentCopied && dmCopied,
      })
      if (!res.success) {
        setActionError(res.error || 'Mark sent failed')
        setMarkSentLoading(false)
        return
      }
      setSessionCount((c) => c + 1)
      setTodayCount((c) => c + 1)
      clearAll()
    } catch (err: any) {
      setActionError(err.message || 'Mark sent failed')
    } finally {
      setMarkSentLoading(false)
    }
  }, [result, commentCopied, dmCopied, handle, clearAll])

  // ── Escalate ──
  const doEscalate = useCallback(async () => {
    if (!result || !result.success || result.isAmbiguous) return
    if (!escalationReason.trim()) return
    const r = result as LookupResult

    setEscalationLoading(true)
    try {
      await workEscalate({
        resolvedCity: r.resolvedCity,
        resolvedState: r.resolvedState,
        resolvedCountry: r.resolvedCountry,
        resolvedLat: r.resolvedLat,
        resolvedLng: r.resolvedLng,
        reason: escalationReason.trim(),
        instagramHandle: handle.trim() ? normalizeHandle(handle) : null,
      })
      clearAll()
    } catch (err: any) {
      setActionError(err.message || 'Escalation failed')
    } finally {
      setEscalationLoading(false)
    }
  }, [result, escalationReason, handle, clearAll])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      // Don't fire shortcuts while typing in inputs
      if (isInput) {
        // Enter in location input triggers lookup
        if (e.key === 'Enter' && e.target === locationRef.current) {
          e.preventDefault()
          doLookup()
        }
        // Enter in escalation input triggers escalate
        if (e.key === 'Enter' && e.target === escalationRef.current) {
          e.preventDefault()
          doEscalate()
        }
        return
      }

      if (e.key === '1') {
        e.preventDefault()
        copyComment()
      } else if (e.key === '2') {
        e.preventDefault()
        copyDM()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        doMarkSent()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [doLookup, copyComment, copyDM, doMarkSent, doEscalate])

  // ── Derived state ──
  const isLookupResult = result && result.success && !result.isAmbiguous
  const lookupResult = isLookupResult ? (result as LookupResult) : null
  const isAmbiguous = result && result.success && result.isAmbiguous
  const ambiguousResult = isAmbiguous ? (result as AmbiguousResult) : null
  const isFailed = result && !result.success
  const bothCopied = commentCopied && dmCopied

  return (
    <div className="flex flex-col h-screen bg-[#15202B] text-white" style={{ minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
      {/* ── Section E: Session counter (absolute top-right) ── */}
      <div className="absolute top-4 right-6 text-sm text-white/50 z-10">
        Session: {sessionCount} &middot; Today: {todayCount}
      </div>

      {/* ── Section A: Input bar ── */}
      <div className="flex-shrink-0 px-6 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Location input */}
          <div className="relative flex-1 max-w-md">
            <input
              ref={locationRef}
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Paste zip or city"
              className="w-full px-4 py-3 text-lg rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Handle input */}
          <div className="relative w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm select-none pointer-events-none">@</span>
            <input
              ref={handleRef}
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onBlur={() => {
                if (handle.trim()) setHandle(normalizeHandle(handle))
              }}
              placeholder="handle (optional)"
              className="w-full pl-7 pr-3 py-3 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Country selector */}
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="px-3 py-3 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 appearance-none cursor-pointer"
          >
            <option value="US">US</option>
            <option value="CA">CA</option>
            <option value="GB">GB</option>
            <option value="AU">AU</option>
            <option value="NZ">NZ</option>
          </select>

          {/* Lookup button */}
          <button
            onClick={() => doLookup()}
            disabled={loading || !location.trim()}
            className="px-5 py-3 text-sm font-semibold rounded-lg bg-[#D66829] text-white hover:bg-[#c55d24] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Lookup
          </button>
        </div>
      </div>

      {/* ── Section B: Result area ── */}
      <div className="flex-1 px-6 overflow-y-auto" style={{ minHeight: '400px' }}>
        {/* Action error banner */}
        {actionError && (
          <div className="mb-3 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
            {actionError}
          </div>
        )}

        {!result && !loading && (
          <div className="flex items-center justify-center h-full text-white/20 text-lg">
            Paste a zip code or city to get started
          </div>
        )}

        {/* Failed result */}
        {isFailed && (
          <div className="px-4 py-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
            {(result as any).error}
          </div>
        )}

        {/* Ambiguous result */}
        {ambiguousResult && (
          <div className="space-y-3">
            <p className="text-white/60 text-sm">{ambiguousResult.label}</p>
            <div className="flex flex-wrap gap-2">
              {ambiguousResult.options.map((opt) => (
                <button
                  key={`${opt.city}-${opt.state}`}
                  onClick={() => {
                    setLocation(`${opt.city}, ${opt.state}`)
                    doLookup(`${opt.city}, ${opt.state}`)
                  }}
                  className="px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  {opt.city}, {opt.state}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Successful lookup */}
        {lookupResult && (
          <div className="space-y-3">
            {/* Resolution line */}
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">
                Resolved to: <span className="text-white font-medium">{lookupResult.resolvedCity}, {lookupResult.resolvedState}</span>
              </span>
            </div>

            {/* Fallback warning */}
            {lookupResult.isFallback && (
              <div className="px-3 py-2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm">
                Geocoder fallback match. Double-check before sending.
              </div>
            )}

            {/* Doctor card */}
            {lookupResult.doctor && (
              <div className="p-4 rounded-lg bg-[#1a2744] border border-white/5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{lookupResult.doctor.name}</h3>
                    {lookupResult.doctor.clinicName && (
                      <p className="text-sm text-white/50">{lookupResult.doctor.clinicName}</p>
                    )}
                    <p className="text-sm text-white/40 mt-0.5">
                      {lookupResult.doctor.city}, {lookupResult.doctor.state} &middot; {lookupResult.doctor.distanceMiles} mi
                    </p>
                    {lookupResult.doctor.handle && (
                      <p className="text-sm text-cyan-400 mt-0.5">@{lookupResult.doctor.handle}</p>
                    )}
                    <p className="text-sm text-white/30 italic mt-1">{lookupResult.doctor.pickReason}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span title="Photo">
                      <span className={`inline-block w-2 h-2 rounded-full ${lookupResult.doctor.hasPhoto ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="ml-1 text-white/30">photo</span>
                    </span>
                    <span title="Booking">
                      <span className={`inline-block w-2 h-2 rounded-full ${lookupResult.doctor.hasBooking ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="ml-1 text-white/30">booking</span>
                    </span>
                    <span title="Hours">
                      <span className={`inline-block w-2 h-2 rounded-full ${lookupResult.doctor.hasHours ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="ml-1 text-white/30">hours</span>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-white/25 mt-2">{lookupResult.doctor.introCount30d} intros in last 30 days</p>
              </div>
            )}

            {/* No doctor */}
            {!lookupResult.doctor && (
              <div className="p-4 rounded-lg bg-[#1a2744] border border-white/5 text-white/40 text-sm">
                No doctor found for this area. Waitlist templates loaded.
              </div>
            )}

            {/* Template tier */}
            <p className="text-xs text-white/40">{lookupResult.templateReason}</p>

            {/* Alternates */}
            {lookupResult.alternates.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAlternates(!showAlternates)}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  {showAlternates ? 'Hide' : 'Show'} other options ({lookupResult.alternates.length})
                </button>
                {showAlternates && (
                  <div className="mt-2 space-y-1">
                    {lookupResult.alternates.map((alt) => (
                      <div
                        key={alt.id}
                        className={`flex items-center justify-between px-3 py-2 rounded text-sm cursor-pointer transition-colors ${
                          selectedAlternate?.id === alt.id ? 'bg-white/10 border border-white/20' : 'bg-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => setSelectedAlternate(selectedAlternate?.id === alt.id ? null : alt)}
                      >
                        <span className="text-white/70">
                          {alt.name} &middot; {alt.city}, {alt.state} &middot; {alt.distanceMiles} mi
                        </span>
                        {alt.handle && <span className="text-cyan-400/60 text-xs">@{alt.handle}</span>}
                      </div>
                    ))}
                    {selectedAlternate && (
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          value={alternateReason}
                          onChange={(e) => setAlternateReason(e.target.value)}
                          placeholder="Reason for picking this alternate"
                          className="flex-1 px-3 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Section C: Copy blocks ── */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              {/* Comment block */}
              <div>
                <p className="text-xs text-white/40 mb-1 font-medium">1. Comment [1]</p>
                <textarea
                  readOnly
                  value={lookupResult.filledComment}
                  className="w-full h-28 px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white/70 resize-none focus:outline-none"
                />
                <button
                  onClick={copyComment}
                  className={`w-full mt-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    commentCopied
                      ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                      : 'bg-[#D66829]/20 border border-[#D66829]/40 text-[#D66829] hover:bg-[#D66829]/30'
                  }`}
                >
                  {commentCopied ? 'Copied \u2713' : 'Copy comment'}
                </button>
              </div>

              {/* DM block */}
              <div>
                <p className="text-xs text-white/40 mb-1 font-medium">2. DM [2]</p>
                <textarea
                  readOnly
                  value={lookupResult.filledDM}
                  className="w-full h-28 px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white/70 resize-none focus:outline-none"
                />
                <button
                  onClick={copyDM}
                  className={`w-full mt-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    dmCopied
                      ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                      : 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30'
                  }`}
                >
                  {dmCopied ? 'Copied \u2713' : 'Copy DM'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section D: Commit bar ── */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-white/5 bg-[#15202B]">
        {/* Escalation input (shown inline, no layout shift) */}
        {showEscalation && (
          <div className="flex items-center gap-2 mb-2">
            <input
              ref={escalationRef}
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              placeholder="Why are you flagging this?"
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none"
              autoFocus
            />
            <button
              onClick={doEscalate}
              disabled={!escalationReason.trim() || escalationLoading}
              className="px-4 py-2 text-sm rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 disabled:opacity-40 transition-colors"
            >
              {escalationLoading ? 'Flagging...' : 'Send flag'}
            </button>
            <button
              onClick={() => {
                setShowEscalation(false)
                setEscalationReason('')
                focusLocation()
              }}
              className="px-3 py-2 text-sm text-white/30 hover:text-white/50"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Mark sent */}
          <button
            onClick={() => doMarkSent()}
            disabled={!isLookupResult || !bothCopied || markSentLoading}
            title={
              !isLookupResult
                ? 'Run a lookup first'
                : !bothCopied
                  ? 'Copy both the comment and DM first'
                  : 'Mark as sent and clear'
            }
            className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#22c55e] hover:bg-[#22c55e]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {markSentLoading ? 'Saving...' : 'Mark sent and next [Enter]'}
          </button>

          {/* Mark sent anyway */}
          {isLookupResult && !bothCopied && (
            <button
              onClick={() => doMarkSent(true)}
              disabled={markSentLoading}
              className="text-xs text-white/25 hover:text-white/40 transition-colors underline underline-offset-2"
            >
              Mark sent anyway
            </button>
          )}

          {/* Skip */}
          <button
            onClick={clearAll}
            className="px-4 py-2 text-sm text-white/30 hover:text-white/50 transition-colors"
          >
            Skip
          </button>

          {/* Flag for Ray */}
          {isLookupResult && (
            <button
              onClick={() => {
                setShowEscalation(!showEscalation)
                if (!showEscalation) {
                  setTimeout(() => escalationRef.current?.focus(), 50)
                }
              }}
              className="px-4 py-2 text-sm text-amber-400/40 hover:text-amber-400/70 transition-colors"
            >
              Flag for Ray
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />
        </div>
      </div>

      {/* ── Keyboard shortcuts legend ── */}
      <div className="flex-shrink-0 px-6 py-1.5 text-[10px] text-white/15 flex gap-4 border-t border-white/[0.03]">
        <span>1 = copy comment</span>
        <span>2 = copy DM</span>
        <span>Enter = mark sent (when both copied)</span>
        <span>Tab = move between inputs</span>
      </div>
    </div>
  )
}
