'use client'

import { useState, useEffect, useRef } from 'react'
import type { DoctorOption, GeneratedCaptions } from './actions'
import { getDoctorsForClips, generateCaptions, updateClipHook } from './actions'
import TabNav from './TabNav'

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

// ── Output Card ──

function OutputCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a2744] rounded-xl p-5 space-y-3">
      <p className="text-[11px] text-white/40 uppercase font-bold tracking-wider">{label}</p>
      {children}
    </div>
  )
}

// ── Main Component ──

export default function ClipsClient() {
  // Doctor selector state
  const [doctors, setDoctors] = useState<DoctorOption[]>([])
  const [doctorSearch, setDoctorSearch] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Transcript state
  const [transcript, setTranscript] = useState('')

  // Optional context
  const [topic, setTopic] = useState('')
  const [clipLength, setClipLength] = useState('30s')

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawOutput, setRawOutput] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedCaptions | null>(null)
  const [captionId, setCaptionId] = useState<string | null>(null)

  // Hook selection
  const [selectedHook, setSelectedHook] = useState<number>(0)

  // Load doctors on mount
  useEffect(() => {
    getDoctorsForClips().then(setDoctors).catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Filtered doctors
  const filtered = doctorSearch.trim()
    ? doctors.filter((d) => {
        const q = doctorSearch.toLowerCase()
        return (
          d.name.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          (d.handle && d.handle.toLowerCase().includes(q))
        )
      })
    : doctors

  // Word count
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0

  // Can generate
  const canGenerate = !!selectedDoctor && transcript.trim().length > 0 && !generating

  // Generate handler
  const handleGenerate = async () => {
    if (!selectedDoctor || !transcript.trim()) return
    setGenerating(true)
    setError(null)
    setRawOutput(null)
    setResult(null)
    setCaptionId(null)
    setSelectedHook(0)

    const res = await generateCaptions(
      selectedDoctor.id,
      transcript.trim(),
      topic.trim() || undefined,
      clipLength,
    )

    setGenerating(false)

    if (res.success) {
      setResult(res.data)
      setCaptionId(res.captionId)
    } else {
      setError(res.error)
      if ('rawOutput' in res && res.rawOutput) setRawOutput(res.rawOutput)
    }
  }

  // Hook selection handler
  const handleHookSelect = async (index: number) => {
    setSelectedHook(index)
    if (captionId && result) {
      await updateClipHook(captionId, result.hooks[index])
    }
  }

  // Copy all for Metricool
  const buildMetricoolBlock = (): string => {
    if (!result) return ''
    const hookText = result.hooks[selectedHook] || result.hooks[0]
    return [
      `HOOK: ${hookText}`,
      '',
      `ON-SCREEN TEXT: ${result.on_screen_text}`,
      '',
      `INSTAGRAM REELS CAPTION:`,
      result.instagram_caption,
      '',
      `TIKTOK CAPTION:`,
      result.tiktok_caption,
      '',
      `YOUTUBE SHORTS TITLE: ${result.youtube_title}`,
      '',
      `YOUTUBE SHORTS DESCRIPTION:`,
      result.youtube_description,
    ].join('\n')
  }

  // Instagram caption with 125-char marker
  const renderInstagramCaption = (caption: string) => {
    if (caption.length <= 125) {
      return <p className="text-white/90 text-sm whitespace-pre-wrap">{caption}</p>
    }
    const before = caption.slice(0, 125)
    const after = caption.slice(125)
    return (
      <p className="text-white/90 text-sm whitespace-pre-wrap">
        {before}
        <span className="bg-[#D66829]/30 text-[#D66829] text-[10px] font-bold px-1 py-0.5 rounded mx-0.5 inline-block">
          ...more
        </span>
        {after}
      </p>
    )
  }

  return (
    <div className="min-h-screen bg-[#15202B] text-white p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <TabNav />

      <h1 className="text-2xl font-bold">Clip Caption Generator</h1>

      {/* ── Section 1: Doctor Selector ── */}
      <div className="space-y-3">
        <label className="text-sm text-white/50 font-semibold uppercase tracking-wider block">
          Select Doctor
        </label>
        <div ref={dropdownRef} className="relative">
          <input
            type="text"
            value={doctorSearch}
            onChange={(e) => {
              setDoctorSearch(e.target.value)
              setShowDropdown(true)
              if (selectedDoctor) setSelectedDoctor(null)
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search by name, city, or handle..."
            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D66829]/50"
          />
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-[#1a2744] border border-white/10 rounded-lg max-h-64 overflow-y-auto shadow-xl">
              {filtered.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDoctor(d)
                    setDoctorSearch(d.name)
                    setShowDropdown(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition border-b border-white/5 last:border-0"
                >
                  <span className="text-white font-medium">{d.name}</span>
                  <span className="text-white/40">
                    {' '}
                    {'\u2014'} {d.city}, {d.state} {'\u2014'}{' '}
                    {d.handle ? (
                      <span className="text-[#D66829]">{d.handle}</span>
                    ) : (
                      <span className="text-white/25 italic">no IG</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Confirmation card */}
        {selectedDoctor && (
          <div className="bg-[#1a2744] rounded-xl p-4 space-y-1">
            <p className="text-white font-semibold">{selectedDoctor.name}</p>
            <p className="text-white/50 text-sm">
              {selectedDoctor.city}, {selectedDoctor.state}
            </p>
            {selectedDoctor.handle ? (
              <p className="text-[#D66829] text-sm">{selectedDoctor.handle}</p>
            ) : (
              <p className="text-orange-400 text-sm">
                No Instagram handle on file. Captions will be generated without a tag.
              </p>
            )}
            <a
              href={selectedDoctor.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 hover:text-white/50 underline"
            >
              {selectedDoctor.profileUrl}
            </a>
          </div>
        )}
      </div>

      {/* ── Section 2: Transcript Input ── */}
      <div className="space-y-2">
        <label className="text-sm text-white/50 font-semibold uppercase tracking-wider block">
          Transcript
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste the clip transcript here."
          rows={10}
          style={{ minHeight: '240px', resize: 'vertical' }}
          className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D66829]/50"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">{wordCount} words</p>
          {wordCount > 0 && wordCount < 20 && (
            <p className="text-xs text-yellow-400/80">
              Short transcripts may produce weak captions
            </p>
          )}
        </div>
      </div>

      {/* ── Section 3: Optional Context ── */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-white/50 font-semibold uppercase tracking-wider block">
            Topic / Angle
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Optional. What's the point of this clip?"
            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D66829]/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/50 font-semibold uppercase tracking-wider block">
            Clip Length
          </label>
          <div className="flex gap-2">
            {['15s', '30s', '60s', '90s'].map((len) => (
              <button
                key={len}
                onClick={() => setClipLength(len)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  clipLength === len
                    ? 'bg-[#D66829] text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                }`}
              >
                {len}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 4: Generate Button ── */}
      <div className="space-y-4">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={`w-full py-3 rounded-xl text-sm font-bold transition ${
            canGenerate
              ? 'bg-[#D66829] text-white hover:bg-[#c25a22] cursor-pointer'
              : 'bg-[#D66829]/30 text-white/30 cursor-not-allowed'
          }`}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating captions for {selectedDoctor?.name}...
            </span>
          ) : (
            'Generate Captions'
          )}
        </button>

        {/* Error display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-2">
            <p className="text-red-400 text-sm font-medium">{error}</p>
            {rawOutput && (
              <pre className="text-xs text-white/50 bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                {rawOutput}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* ── Section 5: Output ── */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white/80">Generated Captions</h2>
            <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-medium">
              Saved to library
            </span>
          </div>

          {/* Hooks */}
          <OutputCard label="Hook Options">
            <div className="space-y-2">
              {result.hooks.map((hook, i) => (
                <label
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                    selectedHook === i
                      ? 'bg-[#D66829]/20 border border-[#D66829]/40'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="hook"
                    checked={selectedHook === i}
                    onChange={() => handleHookSelect(i)}
                    className="mt-0.5 accent-[#D66829]"
                  />
                  <span className="text-sm text-white/90">{hook}</span>
                </label>
              ))}
            </div>
          </OutputCard>

          {/* On-screen text */}
          <OutputCard label="On-Screen Text">
            <div className="flex items-center justify-between">
              <p className="text-white/90 text-sm">{result.on_screen_text}</p>
              <CopyButton text={result.on_screen_text} />
            </div>
          </OutputCard>

          {/* Instagram Reels Caption */}
          <OutputCard label="Instagram Reels Caption">
            <div className="space-y-2">
              {renderInstagramCaption(result.instagram_caption)}
              <div className="flex justify-end">
                <CopyButton text={result.instagram_caption} />
              </div>
            </div>
          </OutputCard>

          {/* TikTok Caption */}
          <OutputCard label="TikTok Caption">
            <div className="space-y-2">
              <p className="text-white/90 text-sm whitespace-pre-wrap">{result.tiktok_caption}</p>
              <div className="flex justify-end">
                <CopyButton text={result.tiktok_caption} />
              </div>
            </div>
          </OutputCard>

          {/* YouTube Shorts Title */}
          <OutputCard label="YouTube Shorts Title">
            <div className="flex items-center justify-between gap-4">
              <p className="text-white/90 text-sm">{result.youtube_title}</p>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs ${
                    result.youtube_title.length > 100 ? 'text-red-400' : 'text-white/30'
                  }`}
                >
                  {result.youtube_title.length}/100
                </span>
                <CopyButton text={result.youtube_title} />
              </div>
            </div>
          </OutputCard>

          {/* YouTube Shorts Description */}
          <OutputCard label="YouTube Shorts Description">
            <div className="space-y-2">
              <p className="text-white/90 text-sm whitespace-pre-wrap">
                {result.youtube_description}
              </p>
              <div className="flex justify-end">
                <CopyButton text={result.youtube_description} />
              </div>
            </div>
          </OutputCard>

          {/* Copy All for Metricool */}
          <div className="pt-2">
            <CopyButton text={buildMetricoolBlock()} label="Copy All for Metricool" />
          </div>
        </div>
      )}
    </div>
  )
}
