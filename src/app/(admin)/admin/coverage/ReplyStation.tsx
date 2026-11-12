'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, ChevronUp, Copy, ExternalLink, MessageSquare, Search, Send } from 'lucide-react'
import { getCountriesWithDemand } from '@/config/countries'
import { isPracticeListing, listingDisplayName } from '@/lib/listing-display'
import {
  autoLogDemand,
  checkHandleAgainstMembers,
  getDemandCountNearby,
  getFarDistanceThreshold,
  getSentDoctorIds,
  logDoctorOutreachCopy,
  logReply,
  lookupNearby,
  selectVariant,
  undoAutoLogDemand,
  type LookupResult,
  type OutreachScenario,
  type ReplyTemplate,
} from './actions'

const DOCTOR_SCENARIOS: OutreachScenario[] = [
  { key: 'doctor_commented', label: 'Doctor Commented', commentKey: 'doctor_commented_ig_comment', dmKey: 'doctor_commented_ig_dm' },
  { key: 'patient_tagged_their_doctor', label: 'Patient Tagged', commentKey: 'patient_tagged_doctor_ig_comment', dmKey: 'patient_tagged_doctor_ig_dm' },
  { key: 'someone_tagged_an_office', label: 'Office Tagged', commentKey: 'someone_tagged_office_ig_comment', dmKey: 'someone_tagged_office_ig_dm' },
  { key: 'doctor_dmed_me', label: 'Doctor DM\'d Me', commentKey: null, dmKey: 'doctor_dmed_me_ig_dm' },
  { key: 'student_or_associate', label: 'Student', commentKey: 'student_ig_comment', dmKey: 'student_ig_dm' },
]

const CLOSING_SCENARIOS: OutreachScenario[] = [
  { key: 'skip_the_call_close', label: 'Skip Call Close', commentKey: null, dmKey: 'skip_the_call_close_ig_dm' },
  { key: 'post_call_close', label: 'Post Call Close', commentKey: null, dmKey: 'post_call_close_ig_dm' },
  { key: 'objection_price_close', label: 'Price Objection', commentKey: null, dmKey: 'objection_price_ig_dm' },
  { key: 'objection_timing_close', label: 'Timing Objection', commentKey: null, dmKey: 'objection_timing_ig_dm' },
  { key: 'went_quiet', label: 'Went Quiet', commentKey: null, dmKey: 'went_quiet_ig_dm' },
  { key: 'ready_but_no_payment', label: 'No Payment', commentKey: null, dmKey: 'ready_no_payment_ig_dm' },
]

type OutreachLinks = {
  calendly_url: string
  mastermind_url: string
  checkout_url_monthly: string
  checkout_url_annual: string
}

type Variant = { variant_key: string; body: string }

function fillTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] || `{${key}}`)
}

function parseSearchCity(searchedCity: string): { city: string; state?: string } {
  const parts = searchedCity.split(',').map((part) => part.trim())
  return { city: parts[0] || searchedCity, state: parts[1] || undefined }
}

function humanDistance(miles: number): string {
  if (miles <= 20) return String(Math.round(miles))
  return String(Math.round(miles / 5) * 5)
}

export default function ReplyStation({
  templates,
  outreachLinks,
  lookupMax = 100,
}: {
  templates: ReplyTemplate[]
  outreachLinks: OutreachLinks
  lookupMax?: number
}) {
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupCountry, setLookupCountry] = useState('US')
  const [lookupResults, setLookupResults] = useState<LookupResult[] | null>(null)
  const [lookupLabel, setLookupLabel] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupSort, setLookupSort] = useState<'distance' | 'name' | 'tier'>('distance')
  const [sentDoctorIds, setSentDoctorIds] = useState<Set<string>>(new Set())
  const [farThreshold, setFarThreshold] = useState(30)
  const [sessionCount, setSessionCount] = useState(0)
  const [todayCount, setTodayCount] = useState(0)
  const [couldNotResolve, setCouldNotResolve] = useState(false)
  const [resolvedCity, setResolvedCity] = useState('')
  const [resolvedState, setResolvedState] = useState('')
  const [resolvedLat, setResolvedLat] = useState<number | undefined>(undefined)
  const [resolvedLng, setResolvedLng] = useState<number | undefined>(undefined)
  const [confidence, setConfidence] = useState<'exact' | 'dominant' | 'ambiguous' | 'approximate' | undefined>(undefined)
  const [rejectedCandidates, setRejectedCandidates] = useState<{ city: string; state: string }[] | null>(null)
  const [showOtherResults, setShowOtherResults] = useState(false)
  const [autoLogResult, setAutoLogResult] = useState<{ id: string; reason: string } | null>(null)
  const [replyMode, setReplyMode] = useState<'patient' | 'doctor'>('patient')
  const [doctorScenario, setDoctorScenario] = useState<OutreachScenario | null>(null)
  const [doctorHandle, setDoctorHandle] = useState('')
  const [demandCount50, setDemandCount50] = useState<number | null>(null)
  const [ambiguousOptions, setAmbiguousOptions] = useState<{ city: string; state: string }[] | null>(null)

  const lookupInputRef = useRef<HTMLInputElement>(null)
  const replyBtnRef = useRef<HTMLButtonElement>(null)
  const dmBtnRef = useRef<HTMLButtonElement>(null)
  const sentBtnRef = useRef<HTMLButtonElement>(null)
  const demandCountries = getCountriesWithDemand()

  useEffect(() => {
    const saved = window.localStorage.getItem('nc_lookup_country')
    if (!saved) return
    const timer = window.setTimeout(() => setLookupCountry(saved), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    getSentDoctorIds().then((ids) => {
      if (cancelled) return
      setSentDoctorIds(new Set(ids))
      setTodayCount(ids.length)
    }).catch(() => {})
    getFarDistanceThreshold().then((miles) => {
      if (!cancelled) setFarThreshold(miles)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const clearResults = useCallback(() => {
    setLookupQuery('')
    setLookupResults(null)
    setLookupLabel('')
    setAmbiguousOptions(null)
    setCouldNotResolve(false)
    setResolvedCity('')
    setResolvedState('')
    setResolvedLat(undefined)
    setResolvedLng(undefined)
    setConfidence(undefined)
    setRejectedCandidates(null)
    setShowOtherResults(false)
    setAutoLogResult(null)
    setDemandCount50(null)
    setDoctorScenario(null)
    window.setTimeout(() => { lookupInputRef.current?.focus(); lookupInputRef.current?.select() }, 50)
  }, [])

  const handleSentFromParent = useCallback(() => {
    setLookupQuery('')
    setLookupResults(null)
    setLookupLabel('')
    setAmbiguousOptions(null)
    setCouldNotResolve(false)
    setResolvedCity('')
    setResolvedState('')
    setConfidence(undefined)
    setRejectedCandidates(null)
    setShowOtherResults(false)
    setDemandCount50(null)
    setDoctorScenario(null)
    setSessionCount((prev) => prev + 1)
    setTodayCount((prev) => prev + 1)
    window.setTimeout(() => { lookupInputRef.current?.focus(); lookupInputRef.current?.select() }, 50)
  }, [])

  const handleLookup = async (overrideQuery?: string) => {
    const query = overrideQuery || lookupQuery.trim()
    if (!query) return
    setLookupLoading(true)
    setAmbiguousOptions(null)
    setCouldNotResolve(false)
    setShowOtherResults(false)
    setConfidence(undefined)
    setRejectedCandidates(null)
    try {
      const result = await lookupNearby(query, lookupCountry)
      if (result.couldNotResolve === true) {
        setCouldNotResolve(true)
        setLookupResults(null)
        setLookupLabel('')
        setLookupLoading(false)
        return
      }
      if (result.detectedCountry && result.detectedCountry !== lookupCountry) {
        setLookupCountry(result.detectedCountry)
        try { window.localStorage.setItem('nc_lookup_country', result.detectedCountry) } catch { /* ignore */ }
        setLookupLabel(`Detected ${result.detectedCountry} postal code. ${result.label}`)
      } else if (result.ambiguous && result.ambiguous.length > 0) {
        setAmbiguousOptions(result.ambiguous)
        setLookupLabel(result.label)
        setLookupResults(null)
        setLookupLoading(false)
        return
      } else {
        setLookupLabel(result.label)
      }
      setLookupResults(result.doctors)
      setConfidence(result.confidence)
      setRejectedCandidates(result.rejectedCandidates || null)
      setResolvedCity(result.resolvedCity || '')
      setResolvedState(result.resolvedState || '')
      setResolvedLat(result.resolvedLat)
      setResolvedLng(result.resolvedLng)
      setDemandCount50(null)
      if (result.resolvedLat && result.resolvedLng) {
        getDemandCountNearby(result.resolvedLat, result.resolvedLng, 50).then(setDemandCount50).catch(() => {})
      }
      setAutoLogResult(null)
      const resolved = result.confidence === 'exact' || result.confidence === 'dominant' || result.confidence === 'approximate'
      if (result.resolvedCity && result.resolvedState && result.resolvedLat && result.resolvedLng && resolved && !result.ambiguous && !result.couldNotResolve) {
        const nearest = result.doctors[0]
        autoLogDemand({
          city: result.resolvedCity,
          state: result.resolvedState,
          lat: result.resolvedLat,
          lng: result.resolvedLng,
          country: lookupCountry,
          nearestDoctorId: nearest?.id,
          nearestDoctorName: nearest ? `${nearest.first_name} ${nearest.last_name}` : undefined,
          nearestDistanceMi: nearest?.distance_miles,
          doctorCount: result.doctors.length,
        }).then((logged) => {
          if (logged.logged && logged.id) setAutoLogResult({ id: logged.id, reason: logged.reason || '' })
        }).catch(() => {})
      }
    } catch {
      setLookupLabel('Lookup failed')
      setLookupResults([])
    }
    setLookupLoading(false)
    window.setTimeout(() => { lookupInputRef.current?.focus(); lookupInputRef.current?.select() }, 50)
  }

  const handlePickAmbiguous = (city: string, state: string) => {
    const query = `${city}, ${state}`
    setLookupQuery(query)
    setAmbiguousOptions(null)
    void handleLookup(query)
  }

  const sortedLookupResults = lookupResults ? [...lookupResults].sort((a, b) => {
    if (lookupSort === 'distance') return a.distance_miles - b.distance_miles
    if (lookupSort === 'name') return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
    return ({ verified: 0, pending: 1 }[a.verification_status] ?? 2) - ({ verified: 0, pending: 1 }[b.verification_status] ?? 2)
  }) : null
  const pickDoctor = sortedLookupResults && sortedLookupResults.length > 0 ? sortedLookupResults[0] : null
  const otherDoctors = sortedLookupResults && sortedLookupResults.length > 1 ? sortedLookupResults.slice(1) : []

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target
      const element = target instanceof HTMLElement ? target : null
      const inInput = Boolean(element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable))
      if (event.key === '/' && !inInput) {
        event.preventDefault()
        lookupInputRef.current?.focus()
        lookupInputRef.current?.select()
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        clearResults()
        return
      }
      if (inInput) return
      if (event.key === '1' && replyBtnRef.current) {
        event.preventDefault()
        replyBtnRef.current.click()
        return
      }
      if (event.key === '2' && dmBtnRef.current) {
        event.preventDefault()
        dmBtnRef.current.click()
        return
      }
      if (event.key === 'Enter' && sentBtnRef.current) {
        event.preventDefault()
        sentBtnRef.current.click()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [clearResults])

  const placeholder = lookupCountry === 'US' ? '29651 or Greenville, SC'
    : lookupCountry === 'CA' ? 'V5K 1A1 or Vancouver, BC'
      : lookupCountry === 'GB' ? 'SW1A 1AA or Manchester'
        : lookupCountry === 'NZ' ? '1010 or Auckland'
          : lookupCountry === 'AU' ? '3000 or Melbourne, VIC'
            : 'City or postal code'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white/60">Doctor Lookup</p>
            <Link href="/admin/coverage/mentions" className="rounded-lg bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-400/70 hover:text-cyan-400">+ Mentions</Link>
            <Link href="/admin/coverage/templates" className="rounded-lg bg-white/5 px-2 py-1 text-[10px] font-bold text-white/40 hover:text-white/70">Templates</Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/30">Session: {sessionCount} · Today: {todayCount}</span>
            <select
              value={lookupCountry}
              onChange={(event) => {
                setLookupCountry(event.target.value)
                try { window.localStorage.setItem('nc_lookup_country', event.target.value) } catch { /* ignore */ }
                setLookupResults(null)
                setLookupLabel('')
                setAmbiguousOptions(null)
                setCouldNotResolve(false)
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-base text-white/60"
            >
              {demandCountries.map((country) => (
                <option key={country.iso2} value={country.iso2}>{country.flag} {country.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder={placeholder}
              value={lookupQuery}
              ref={lookupInputRef}
              onChange={(event) => setLookupQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') void handleLookup() }}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-9 pr-3 text-base text-white placeholder:text-white/25 focus:border-neuro-orange focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleLookup()}
            disabled={lookupLoading || !lookupQuery.trim()}
            className="min-h-11 rounded-xl bg-neuro-orange px-4 py-3 text-base font-bold text-white disabled:opacity-50"
          >
            {lookupLoading ? '...' : 'Search'}
          </button>
        </div>
        {couldNotResolve ? (
          <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-3">
            <p className="text-sm font-bold text-red-400">We could not find that location. Try a postal code instead.</p>
          </div>
        ) : null}
        {autoLogResult ? (
          <div className="mb-2 flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">
            <span className="text-[11px] text-cyan-400">{autoLogResult.reason}</span>
            <button
              type="button"
              onClick={() => { void undoAutoLogDemand(autoLogResult.id).then(() => setAutoLogResult(null)) }}
              className="ml-3 shrink-0 text-[11px] text-cyan-400/60 hover:text-cyan-300"
            >
              Undo
            </button>
          </div>
        ) : null}
        {lookupLabel && !couldNotResolve ? (
          <div className="mb-2">
            <p className="text-xs text-white/50">{lookupLabel}</p>
            {confidence === 'dominant' && rejectedCandidates && rejectedCandidates.length > 0 && resolvedCity ? (
              <p className="mt-1 text-[10px] text-white/30">
                Matched to {resolvedCity}, {resolvedState}. Also exists in {rejectedCandidates.map((item) => item.state).join(', ')}.
              </p>
            ) : null}
            {confidence === 'approximate' ? (
              <p className="mt-1 text-[10px] text-amber-400/70">Approximate match. Double-check this is right.</p>
            ) : null}
          </div>
        ) : null}
        {ambiguousOptions ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {ambiguousOptions.map((option) => (
              <button
                key={`${option.city}-${option.state}`}
                type="button"
                onClick={() => handlePickAmbiguous(option.city, option.state)}
                className="min-h-11 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:border-neuro-orange hover:bg-neuro-orange/30"
              >
                {option.city}, {option.state}
              </button>
            ))}
          </div>
        ) : null}
        {!couldNotResolve && lookupResults !== null && resolvedCity ? (
          <div className="mb-3 flex items-center gap-1">
            <button type="button" onClick={() => setReplyMode('patient')} className={`min-h-11 rounded-lg px-3 py-1.5 text-xs font-bold ${replyMode === 'patient' ? 'bg-neuro-orange text-white' : 'bg-white/5 text-white/40'}`}>Patient</button>
            <button type="button" onClick={() => setReplyMode('doctor')} className={`min-h-11 rounded-lg px-3 py-1.5 text-xs font-bold ${replyMode === 'doctor' ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/40'}`}>Doctor</button>
          </div>
        ) : null}
        {replyMode === 'patient' && !couldNotResolve && sortedLookupResults && sortedLookupResults.length > 0 ? (
          <>
            <div className="mb-2 flex gap-2">
              {(['distance', 'name', 'tier'] as const).map((sort) => (
                <button key={sort} type="button" onClick={() => setLookupSort(sort)} className={`min-h-11 rounded px-2 py-1 text-[10px] font-bold ${lookupSort === sort ? 'bg-neuro-orange text-white' : 'text-white/40'}`}>
                  {sort === 'distance' ? 'Nearest' : sort === 'name' ? 'A-Z' : 'Status'}
                </button>
              ))}
            </div>
            {pickDoctor ? (
              <LookupResultRow
                doctor={pickDoctor}
                searchedCity={lookupQuery}
                templates={templates}
                sentDoctorIds={sentDoctorIds}
                farThreshold={farThreshold}
                isPick
                onSent={handleSentFromParent}
                replyBtnRef={replyBtnRef}
                dmBtnRef={dmBtnRef}
                sentBtnRef={sentBtnRef}
              />
            ) : null}
            {otherDoctors.length > 0 ? (
              <div className="mt-2">
                <button type="button" onClick={() => setShowOtherResults(!showOtherResults)} className="flex min-h-11 items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white/60">
                  {showOtherResults ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {showOtherResults ? 'Hide other options' : `Show other options (${otherDoctors.length})`}
                </button>
                {showOtherResults ? (
                  <div className="mt-2 max-h-[40vh] space-y-1.5 overflow-y-auto">
                    {otherDoctors.map((doctor) => (
                      <LookupResultRow key={doctor.id} doctor={doctor} searchedCity={lookupQuery} templates={templates} sentDoctorIds={sentDoctorIds} farThreshold={farThreshold} onSent={handleSentFromParent} />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
        {replyMode === 'patient' && !couldNotResolve && sortedLookupResults && sortedLookupResults.length === 0 ? (
          <div className="py-4 text-center">
            {resolvedCity ? (
              <p className="mb-3 text-xs text-white/30">We found {resolvedCity}, {resolvedState} but no doctor within {lookupMax} miles.</p>
            ) : (
              <p className="mb-3 text-xs text-white/30">No doctors within {lookupMax} miles</p>
            )}
            <WaitlistReplyButtons searchedCity={lookupQuery} templates={templates} />
          </div>
        ) : null}
        {replyMode === 'doctor' && !couldNotResolve && lookupResults !== null && resolvedCity ? (
          <DoctorReplyPanel
            city={resolvedCity}
            state={resolvedState}
            country={lookupCountry}
            demandCount50={demandCount50}
            outreachLinks={outreachLinks}
            scenario={doctorScenario}
            onScenarioChange={setDoctorScenario}
            handle={doctorHandle}
            onHandleChange={setDoctorHandle}
            onCopied={() => {
              setSessionCount((prev) => prev + 1)
              setTodayCount((prev) => prev + 1)
            }}
            resolvedLat={resolvedLat}
            resolvedLng={resolvedLng}
          />
        ) : null}
        <div className="mt-4 border-t border-white/5 pt-3">
          <p className="text-[10px] text-white/20">
            <span className="font-bold">/</span> focus search &nbsp;
            <span className="font-bold">1</span> copy reply &nbsp;
            <span className="font-bold">2</span> copy DM &nbsp;
            <span className="font-bold">Enter</span> mark sent &nbsp;
            <span className="font-bold">Esc</span> clear
          </p>
        </div>
      </div>
    </div>
  )
}

function TemplateCopyButton({ label, text, templateId, searchedCity, doctorId, variantKey }: {
  label: string
  text: string
  templateId: string
  searchedCity: string
  doctorId?: string
  variantKey?: string
}) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
      const { city, state } = parseSearchCity(searchedCity)
      void logReply(templateId, city, state, doctorId, undefined, variantKey)
    } catch { /* clipboard can fail */ }
  }
  return (
    <button type="button" onClick={() => void handleCopy()} className="flex min-h-11 items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-bold text-white/50 hover:bg-white/10 hover:text-white/80">
      {copied ? <><Check className="h-3 w-3 text-green-400" /> Copied</> : <><Copy className="h-3 w-3" /> {label}</>}
    </button>
  )
}

function LookupResultRow({ doctor, searchedCity, templates, farThreshold, isPick, onSent, replyBtnRef, dmBtnRef, sentBtnRef }: {
  doctor: LookupResult
  searchedCity: string
  templates: ReplyTemplate[]
  sentDoctorIds?: Set<string>
  farThreshold: number
  isPick?: boolean
  onSent?: () => void
  replyBtnRef?: RefObject<HTMLButtonElement | null>
  dmBtnRef?: RefObject<HTMLButtonElement | null>
  sentBtnRef?: RefObject<HTMLButtonElement | null>
}) {
  const [copiedReply, setCopiedReply] = useState(false)
  const [copiedDM, setCopiedDM] = useState(false)
  const [copiedNoCovComment, setCopiedNoCovComment] = useState(false)
  const [copiedNoCovDM, setCopiedNoCovDM] = useState(false)
  const [copiedHandle, setCopiedHandle] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedReqLink, setCopiedReqLink] = useState(false)
  const [localIntroCount, setLocalIntroCount] = useState(doctor.intro_count)
  const [justSent, setJustSent] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const [commentVariant, setCommentVariant] = useState<Variant | null>(null)
  const [dmVariant, setDmVariant] = useState<Variant | null>(null)
  const [noCovCommentVariant, setNoCovCommentVariant] = useState<Variant | null>(null)
  const [noCovDmVariant, setNoCovDmVariant] = useState<Variant | null>(null)

  const profileUrl = `https://neurochiro.co/directory/${doctor.slug || doctor.id}`
  const contactRequestUrl = `https://neurochiro.co/contact-request?doctor=${doctor.slug || doctor.id}&source=dm_outreach`
  const accountName = `Dr. ${doctor.first_name} ${doctor.last_name}`.trim()
  const doctorName = listingDisplayName(doctor)
  const clinicBase = (doctor.clinic_name || '').replace(/\s*[-–—]\s*\w+$/, '').trim()
  const practiceIntro = isPracticeListing(doctor)
    ? doctorName
    : (doctor.profile_style === 'practice' && clinicBase ? `${accountName} at ${clinicBase}` : accountName)
  const handle = doctor.instagram_handle || ''
  const isFar = doctor.distance_miles >= farThreshold
  const commentTplId = isFar ? 'doctor_comment_far' : 'doctor_comment'
  const dmTplId = isFar ? 'doctor_dm_far' : 'doctor_dm'
  const commentTpl = templates.find((template) => template.id === commentTplId)
  const dmTpl = templates.find((template) => template.id === dmTplId)

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      selectVariant(commentTplId),
      selectVariant(dmTplId),
      isFar ? selectVariant('waitlist_comment') : Promise.resolve(null),
      isFar ? selectVariant('waitlist_dm') : Promise.resolve(null),
    ]).then(([comment, dm, noCovComment, noCovDm]) => {
      if (cancelled) return
      setCommentVariant(comment)
      setDmVariant(dm)
      setNoCovCommentVariant(noCovComment)
      setNoCovDmVariant(noCovDm)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [commentTplId, dmTplId, isFar, doctor.id])

  const vars: Record<string, string> = {
    handle,
    city: doctor.city || '',
    state: doctor.state || '',
    doctor_name: doctorName,
    practice_intro: practiceIntro,
    doctor_city: doctor.city || '',
    profile_url: profileUrl,
    contact_request_url: contactRequestUrl,
    distance: humanDistance(doctor.distance_miles),
  }
  const replyText = handle ? fillTemplate(commentVariant?.body || commentTpl?.body || '', vars) : ''
  const dmText = fillTemplate(dmVariant?.body || dmTpl?.body || '', vars)
  const { city: searchCity } = parseSearchCity(searchedCity)
  const noCovCommentText = fillTemplate(noCovCommentVariant?.body || templates.find((template) => template.id === 'waitlist_comment')?.body || '', { city: searchCity })
  const noCovDmText = fillTemplate(noCovDmVariant?.body || templates.find((template) => template.id === 'waitlist_dm')?.body || '', { city: searchCity })

  const quickCopy = async (text: string, setter: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text)
      setter(true)
      window.setTimeout(() => setter(false), 1500)
    } catch { /* clipboard can fail */ }
  }

  const handleSent = async () => {
    setLocalIntroCount((prev) => prev + 1)
    setJustSent(true)
    const { city, state } = parseSearchCity(searchedCity)
    const logged = await logReply('sent_to_patient', city, state, doctor.id)
    if (logged.redirectUrl) setRedirectUrl(logged.redirectUrl)
    onSent?.()
  }

  return (
    <div className={`rounded-xl px-3 py-2 ${isPick ? 'border-2 border-neuro-orange/30 bg-neuro-orange/10' : localIntroCount > 0 ? 'border border-green-500/20 bg-green-500/5' : 'bg-white/5'}`}>
      {isPick ? <p className="mb-1 text-[10px] font-bold text-neuro-orange">Closest verified doctor. {doctor.distance_miles} miles.</p> : null}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p className={`truncate font-bold text-white ${isPick ? 'text-base' : 'text-sm'}`}>{doctorName}</p>
          {handle ? (
            <button type="button" onClick={() => void quickCopy(handle, setCopiedHandle)} className="flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-cyan-400 hover:text-cyan-300">
              {handle} {copiedHandle ? <Check className="h-2.5 w-2.5 text-green-400" /> : <Copy className="h-2 w-2 opacity-30" />}
            </button>
          ) : <span className="shrink-0 text-[10px] text-red-400/60">no IG</span>}
          <span className="flex shrink-0 items-center gap-0.5" title="Photo · Booking · Hours">
            <span className={`h-1.5 w-1.5 rounded-full ${doctor.has_photo ? 'bg-green-400' : 'bg-red-400/60'}`} />
            <span className={`h-1.5 w-1.5 rounded-full ${doctor.has_booking ? 'bg-green-400' : 'bg-red-400/60'}`} />
            <span className={`h-1.5 w-1.5 rounded-full ${doctor.has_hours ? 'bg-green-400' : 'bg-red-400/60'}`} />
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {localIntroCount > 0 ? <span className="text-[10px] text-white/30">{localIntroCount} sent</span> : null}
          <span className={`font-bold text-neuro-orange ${isPick ? 'text-sm' : 'text-xs'}`}>{doctor.distance_miles} mi</span>
        </div>
      </div>
      <p className="mt-0.5 truncate text-[11px] text-white/40">{isPracticeListing(doctor) ? '' : (doctor.clinic_name ? `${doctor.clinic_name} · ` : '')}{doctor.city}, {doctor.state}</p>
      <div className="mt-1.5 flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
        {handle ? (
          <button
            type="button"
            ref={isPick ? replyBtnRef : undefined}
            onClick={() => {
              void quickCopy(replyText, () => {})
              setCopiedReply(true)
              void logReply(commentTplId, vars.city, vars.state, doctor.id, undefined, commentVariant?.variant_key).then((logged) => {
                if (logged.redirectUrl) setRedirectUrl(logged.redirectUrl)
              })
            }}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold ${copiedReply ? 'bg-green-500/20 text-green-400' : isFar ? 'bg-amber-500/20 text-amber-400' : 'bg-neuro-orange/20 text-neuro-orange'}`}
          >
            {copiedReply ? <><Check className="h-4 w-4 text-green-400" /> Copied</> : <><Copy className="h-4 w-4" /> {isFar ? '1. Reply (far)' : '1. Reply'}</>}
          </button>
        ) : null}
        <button
          type="button"
          ref={isPick ? dmBtnRef : undefined}
          onClick={() => {
            void quickCopy(dmText, () => {})
            setCopiedDM(true)
            void logReply(dmTplId, vars.city, vars.state, doctor.id, undefined, dmVariant?.variant_key).then((logged) => {
              if (logged.redirectUrl) setRedirectUrl(logged.redirectUrl)
            })
          }}
          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold ${copiedDM ? 'bg-green-500/20 text-green-400' : isFar ? 'bg-amber-500/15 text-amber-400' : 'bg-cyan-500/15 text-cyan-400'}`}
        >
          {copiedDM ? <><Check className="h-4 w-4 text-green-400" /> Copied</> : <><Copy className="h-4 w-4" /> {isFar ? '2. DM (far)' : '2. DM'}</>}
        </button>
        <button
          type="button"
          ref={isPick ? sentBtnRef : undefined}
          onClick={() => void handleSent()}
          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold ${justSent ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/50'}`}
        >
          {justSent ? <><Check className="h-4 w-4" /> Logged</> : <><Send className="h-4 w-4" /> Sent</>}
        </button>
        <span className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => void quickCopy(redirectUrl || profileUrl, setCopiedUrl)} title={redirectUrl ? 'Copy tracked redirect link' : 'Copy profile link'} className={`min-h-11 min-w-11 rounded p-1 ${redirectUrl ? 'bg-green-500/10 text-green-400/60' : 'bg-white/5 text-white/30'}`}>
            {copiedUrl ? <Check className="h-3 w-3 text-green-400" /> : <ExternalLink className="h-3 w-3" />}
          </button>
          <button type="button" onClick={() => void quickCopy(contactRequestUrl, setCopiedReqLink)} title="Copy contact request link" className="min-h-11 min-w-11 rounded bg-white/5 p-1 text-white/30">
            {copiedReqLink ? <Check className="h-3 w-3 text-green-400" /> : <MessageSquare className="h-3 w-3" />}
          </button>
        </span>
      </div>
      {isFar ? (
        <div className="mt-1.5 flex items-center gap-1.5 border-t border-white/5 pt-1.5">
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-rose-400/60">No coverage</span>
          <button type="button" onClick={() => { void quickCopy(noCovCommentText, () => {}); setCopiedNoCovComment(true); void logReply('waitlist_comment', searchCity, '', undefined, undefined, noCovCommentVariant?.variant_key) }} className={`flex min-h-11 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${copiedNoCovComment ? 'bg-green-500/20 text-green-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {copiedNoCovComment ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Comment</>}
          </button>
          <button type="button" onClick={() => { void quickCopy(noCovDmText, () => {}); setCopiedNoCovDM(true); void logReply('waitlist_dm', searchCity, '', undefined, undefined, noCovDmVariant?.variant_key) }} className={`flex min-h-11 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${copiedNoCovDM ? 'bg-green-500/20 text-green-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {copiedNoCovDM ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> DM</>}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function DoctorReplyPanel({ city, state, country, demandCount50, outreachLinks, scenario, onScenarioChange, handle, onHandleChange, onCopied, resolvedLat, resolvedLng }: {
  city: string
  state: string
  country: string
  demandCount50: number | null
  outreachLinks: OutreachLinks
  scenario: OutreachScenario | null
  onScenarioChange: (next: OutreachScenario | null) => void
  handle: string
  onHandleChange: (next: string) => void
  onCopied: () => void
  resolvedLat?: number
  resolvedLng?: number
}) {
  const [commentVariant, setCommentVariant] = useState<Variant | null>(null)
  const [dmVariant, setDmVariant] = useState<Variant | null>(null)
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [copiedComment, setCopiedComment] = useState(false)
  const [copiedDM, setCopiedDM] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [prospectInfo, setProspectInfo] = useState<string | null>(null)
  const [memberCheck, setMemberCheck] = useState<{ blocked: boolean; memberName?: string; memberTier?: string } | null>(null)
  const [memberCheckLoading, setMemberCheckLoading] = useState(false)
  const [firstName, setFirstName] = useState('')
  const demandStr = demandCount50 != null && demandCount50 > 0 ? String(demandCount50) : ''
  const isClosingScenario = scenario ? CLOSING_SCENARIOS.some((item) => item.key === scenario.key) : false

  useEffect(() => {
    const normalized = handle.replace(/^@/, '').trim()
    const timer = window.setTimeout(() => {
      if (normalized.length < 2) {
        setMemberCheck(null)
        setCopyError(null)
        setMemberCheckLoading(false)
        return
      }
      setMemberCheckLoading(true)
      checkHandleAgainstMembers(normalized).then((result) => {
        setMemberCheck(result.isMember ? result : null)
        setMemberCheckLoading(false)
        if (result.blocked) setCopyError(`${result.memberName} is already a paying member. Do not send.`)
        else if (result.isMember && result.memberTier !== 'pro') setProspectInfo(`${result.memberName} has a directory listing on a legacy free tier.`)
        else setCopyError(null)
      }).catch(() => setMemberCheckLoading(false))
    }, normalized.length < 2 ? 0 : 500)
    return () => window.clearTimeout(timer)
  }, [handle])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!scenario) {
        setCommentVariant(null)
        setDmVariant(null)
        setVariantsLoading(false)
        return
      }
      setVariantsLoading(true)
      setCopiedComment(false)
      setCopiedDM(false)
      const availableVars: Record<string, string> = {
        handle: handle || '',
        city,
        state,
        demand_50mi: demandStr,
        calendly_link: outreachLinks.calendly_url,
        mastermind_link: outreachLinks.mastermind_url,
        checkout_link_monthly: outreachLinks.checkout_url_monthly,
        checkout_link_annual: outreachLinks.checkout_url_annual,
      }
      void Promise.all([
        scenario.commentKey ? selectVariant(scenario.commentKey, undefined, 'outreach', availableVars) : Promise.resolve(null),
        scenario.dmKey ? selectVariant(scenario.dmKey, undefined, 'outreach', availableVars) : Promise.resolve(null),
      ]).then(([comment, dm]) => {
        if (cancelled) return
        setCommentVariant(comment)
        setDmVariant(dm)
        setVariantsLoading(false)
      }).catch(() => {
        if (!cancelled) setVariantsLoading(false)
      })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [scenario, demandCount50, demandStr, handle, city, state, outreachLinks.calendly_url, outreachLinks.mastermind_url, outreachLinks.checkout_url_monthly, outreachLinks.checkout_url_annual])

  const vars: Record<string, string> = {
    handle: handle.startsWith('@') ? handle : handle ? `@${handle}` : '',
    first_name: firstName.trim() || 'Doc',
    city,
    state,
    demand_50mi: demandStr,
    calendly_link: outreachLinks.calendly_url,
    mastermind_link: outreachLinks.mastermind_url,
    checkout_link_monthly: outreachLinks.checkout_url_monthly,
    checkout_link_annual: outreachLinks.checkout_url_annual,
  }
  const commentText = commentVariant ? fillTemplate(commentVariant.body, vars) : ''
  const dmText = dmVariant ? fillTemplate(dmVariant.body, vars) : ''
  const isBlocked = memberCheck?.blocked === true
  const missingCheckoutUrl = isClosingScenario && (!outreachLinks.checkout_url_monthly || !outreachLinks.checkout_url_annual)
  const canCopyComment = !isBlocked && !missingCheckoutUrl
  const canCopyDM = !isBlocked && !missingCheckoutUrl

  const doCopy = (channel: 'ig_comment' | 'ig_dm') => {
    if (!scenario || isBlocked) return
    const templateKey = channel === 'ig_comment' ? scenario.commentKey : scenario.dmKey
    const variantUsed = channel === 'ig_comment' ? commentVariant : dmVariant
    const textToCopy = channel === 'ig_comment' ? commentText : dmText
    if (!templateKey || !textToCopy) return
    void navigator.clipboard.writeText(textToCopy).catch(() => {})
    if (channel === 'ig_comment') setCopiedComment(true)
    else setCopiedDM(true)
    if (handle.trim()) {
      void logDoctorOutreachCopy({
        templateKey,
        channel,
        intent: scenario.key,
        scenarioKey: scenario.key,
        renderedBody: textToCopy,
        variantKey: variantUsed?.variant_key,
        city,
        state,
        country,
        handle: vars.handle,
        lat: resolvedLat,
        lng: resolvedLng,
        prospectType: scenario.key === 'student_or_associate' ? 'student' : 'doctor',
        demandCount50: demandCount50 ?? undefined,
      }).then((result) => {
        if (!result.ok) {
          setCopyError(`Copied, but prospect not recorded: ${result.reason || 'unknown error'}`)
        } else if (result.existingProspect) {
          const createdAt = result.existingProspect.createdAt ? new Date(result.existingProspect.createdAt).getTime() : 0
          const ageSeconds = (Date.now() - createdAt) / 1000
          if (ageSeconds >= 60) {
            const ago = result.existingProspect.lastContactAt
              ? `Last contact: ${new Date(result.existingProspect.lastContactAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : 'No prior contact logged'
            setProspectInfo(`Existing prospect (${result.existingProspect.status}). ${ago}`)
          }
        }
      }).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'network error'
        setCopyError(`Copied, but prospect not recorded: ${message}`)
      })
    }
    onCopied()
  }

  const handleReshuffle = async () => {
    if (!scenario) return
    setVariantsLoading(true)
    setCopiedComment(false)
    setCopiedDM(false)
    setCopyError(null)
    setProspectInfo(null)
    const availableVars: Record<string, string> = {
      handle: handle || '',
      city,
      state,
      demand_50mi: demandStr,
      calendly_link: outreachLinks.calendly_url,
      mastermind_link: outreachLinks.mastermind_url,
      checkout_link_monthly: outreachLinks.checkout_url_monthly,
      checkout_link_annual: outreachLinks.checkout_url_annual,
    }
    const [comment, dm] = await Promise.all([
      scenario.commentKey ? selectVariant(scenario.commentKey, commentVariant?.variant_key, 'outreach', availableVars) : Promise.resolve(null),
      scenario.dmKey ? selectVariant(scenario.dmKey, dmVariant?.variant_key, 'outreach', availableVars) : Promise.resolve(null),
    ])
    setCommentVariant(comment)
    setDmVariant(dm)
    setVariantsLoading(false)
  }

  const choose = (next: OutreachScenario) => {
    onScenarioChange(scenario?.key === next.key ? null : next)
    setCopyError(null)
    setProspectInfo(null)
    setCopiedComment(false)
    setCopiedDM(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-purple-400">Doctor Mode</span>
        <span className="text-[10px] text-white/30">{city}, {state}</span>
        {demandCount50 !== null ? (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${demandCount50 > 0 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/30'}`}>
            {demandCount50} demand within 50mi
          </span>
        ) : null}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30">@</span>
        <input
          type="text"
          placeholder="their_instagram_handle"
          value={handle.replace(/^@/, '')}
          onChange={(event) => onHandleChange(event.target.value.replace(/^@/, '').replace(/[^A-Za-z0-9._]/g, '').slice(0, 30))}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-7 pr-3 text-base text-white placeholder:text-white/25 focus:border-purple-400 focus:outline-none"
        />
        {!handle ? <p className="mt-1 text-[10px] text-white/20">Optional. Tracks the prospect.</p> : null}
        {memberCheckLoading ? <p className="mt-1 text-[10px] text-white/30">Checking...</p> : null}
      </div>
      <input
        type="text"
        placeholder="Their first name (optional, defaults to Doc)"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-white placeholder:text-white/25 focus:border-neuro-orange focus:outline-none"
      />
      {isClosingScenario && missingCheckoutUrl ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-3">
          <p className="text-sm font-bold text-red-400">checkout_url not configured in platform_settings. Cannot render closing templates.</p>
        </div>
      ) : null}
      {copyError ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-3">
          <p className="text-sm font-bold text-red-400">{copyError}</p>
        </div>
      ) : null}
      {prospectInfo ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <p className="text-[11px] text-amber-400">{prospectInfo}</p>
        </div>
      ) : null}
      <div>
        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-white/30">First Contact</p>
        <div className="flex flex-wrap gap-1.5">
          {DOCTOR_SCENARIOS.map((item) => (
            <button key={item.key} type="button" onClick={() => choose(item)} className={`min-h-11 rounded-lg px-3 py-2 text-xs font-bold ${scenario?.key === item.key ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/50'}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-neuro-orange/60">Closing</p>
        <div className="flex flex-wrap gap-1.5">
          {CLOSING_SCENARIOS.map((item) => (
            <button key={item.key} type="button" onClick={() => choose(item)} className={`min-h-11 rounded-lg px-3 py-2 text-xs font-bold ${scenario?.key === item.key ? 'bg-neuro-orange text-white' : 'bg-white/5 text-white/50'}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {scenario && !variantsLoading ? (
        <div className="space-y-2">
          {commentVariant ? (
            <div className="rounded-xl bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Comment Reply</span>
                {commentVariant.variant_key ? <span className="text-[9px] text-white/20">{commentVariant.variant_key}</span> : null}
              </div>
              <p className="mb-2 whitespace-pre-wrap text-sm leading-relaxed text-white/80">{commentText}</p>
              <button type="button" onClick={() => doCopy('ig_comment')} disabled={!canCopyComment} className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold ${copiedComment ? 'bg-green-500/20 text-green-400' : !canCopyComment ? 'cursor-not-allowed bg-white/5 text-white/20' : 'bg-purple-500/20 text-purple-400'}`}>
                {copiedComment ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy Comment</>}
              </button>
            </div>
          ) : null}
          {dmVariant ? (
            <div className="rounded-xl bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">DM</span>
                {dmVariant.variant_key ? <span className="text-[9px] text-white/20">{dmVariant.variant_key}</span> : null}
              </div>
              <p className="mb-2 whitespace-pre-wrap text-sm leading-relaxed text-white/80">{dmText}</p>
              <button type="button" onClick={() => doCopy('ig_dm')} disabled={!canCopyDM} className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold ${copiedDM ? 'bg-green-500/20 text-green-400' : !canCopyDM ? 'cursor-not-allowed bg-white/5 text-white/20' : 'bg-cyan-500/20 text-cyan-400'}`}>
                {copiedDM ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy DM</>}
              </button>
            </div>
          ) : null}
          {!commentVariant && !dmVariant ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
              <p className="text-xs text-red-400">No eligible templates for this scenario. Missing variables may be blocking all variants.</p>
            </div>
          ) : null}
          {commentVariant || dmVariant ? (
            <button type="button" onClick={() => void handleReshuffle()} className="min-h-11 text-[10px] font-bold text-white/30 hover:text-white/50">
              Reshuffle variants
            </button>
          ) : null}
        </div>
      ) : null}
      {scenario && variantsLoading ? (
        <div className="py-4 text-center">
          <p className="text-xs text-white/30">Loading variants...</p>
        </div>
      ) : null}
    </div>
  )
}

function WaitlistReplyButtons({ searchedCity, templates }: { searchedCity: string; templates: ReplyTemplate[] }) {
  const waitlistDm = templates.find((template) => template.id === 'waitlist_dm')
  const waitlistComment = templates.find((template) => template.id === 'waitlist_comment')
  const { city } = parseSearchCity(searchedCity)
  const [wlDmVariant, setWlDmVariant] = useState<Variant | null>(null)
  const [wlCommentVariant, setWlCommentVariant] = useState<Variant | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([selectVariant('waitlist_dm'), selectVariant('waitlist_comment')]).then(([dm, comment]) => {
      if (cancelled) return
      setWlDmVariant(dm)
      setWlCommentVariant(comment)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [searchedCity])

  return (
    <>
      {(waitlistDm || waitlistComment) ? (
        <div className="flex items-center justify-center gap-2">
          {waitlistDm ? (
            <TemplateCopyButton label="Copy waitlist DM" text={fillTemplate(wlDmVariant?.body || waitlistDm.body || '', { city })} templateId="waitlist_dm" searchedCity={searchedCity} variantKey={wlDmVariant?.variant_key} />
          ) : null}
          {waitlistComment ? (
            <TemplateCopyButton label="Copy comment" text={fillTemplate(wlCommentVariant?.body || waitlistComment.body || '', { city })} templateId="waitlist_comment" searchedCity={searchedCity} variantKey={wlCommentVariant?.variant_key} />
          ) : null}
        </div>
      ) : null}
    </>
  )
}
