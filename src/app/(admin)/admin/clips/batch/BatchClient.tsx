'use client'

import { useState, useEffect, useRef } from 'react'
import type { DoctorOption, GeneratedCaptions } from '../actions'
import { getDoctorsForClips, generateCaptions } from '../actions'
import TabNav from '../TabNav'

interface BatchResult {
  index: number
  firstLine: string
  success: boolean
  data?: GeneratedCaptions
  captionId?: string
  error?: string
}

export default function BatchClient() {
  // Doctor selector
  const [doctors, setDoctors] = useState<DoctorOption[]>([])
  const [doctorSearch, setDoctorSearch] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Batch state
  const [rawText, setRawText] = useState('')
  const [transcripts, setTranscripts] = useState<string[]>([])
  const [parsed, setParsed] = useState(false)

  // Processing
  const [processing, setProcessing] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<BatchResult[]>([])
  const [done, setDone] = useState(false)
  const cancelRef = useRef(false)

  useEffect(() => {
    getDoctorsForClips().then(setDoctors).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = doctorSearch.trim()
    ? doctors.filter((d) => {
        const q = doctorSearch.toLowerCase()
        return d.name.toLowerCase().includes(q) || d.city.toLowerCase().includes(q) || (d.handle && d.handle.toLowerCase().includes(q))
      })
    : doctors

  const handleParse = () => {
    const parts = rawText
      .split(/\n---\n/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
    setTranscripts(parts)
    setParsed(true)
    setResults([])
    setDone(false)
  }

  const handleGenerateAll = async () => {
    if (!selectedDoctor || transcripts.length === 0) return
    setProcessing(true)
    setDone(false)
    setResults([])
    cancelRef.current = false

    const allResults: BatchResult[] = []

    for (let i = 0; i < transcripts.length; i++) {
      if (cancelRef.current) break
      setCurrentIndex(i)
      const transcript = transcripts[i]
      const firstLine = transcript.split('\n')[0].slice(0, 80)

      const res = await generateCaptions(selectedDoctor.id, transcript)

      const result: BatchResult = {
        index: i,
        firstLine,
        success: res.success,
        data: res.success ? res.data : undefined,
        captionId: res.success ? res.captionId : undefined,
        error: !res.success ? res.error : undefined,
      }
      allResults.push(result)
      setResults([...allResults])

      // 1-second delay between calls
      if (i < transcripts.length - 1 && !cancelRef.current) {
        await new Promise((r) => setTimeout(r, 1000))
      }
    }

    setProcessing(false)
    setDone(true)
  }

  const handleRetryFailed = async () => {
    if (!selectedDoctor) return
    const failedIndices = results.filter((r) => !r.success).map((r) => r.index)
    if (failedIndices.length === 0) return

    setProcessing(true)
    cancelRef.current = false

    const updatedResults = [...results]

    for (let i = 0; i < failedIndices.length; i++) {
      if (cancelRef.current) break
      const idx = failedIndices[i]
      setCurrentIndex(idx)
      const transcript = transcripts[idx]
      const firstLine = transcript.split('\n')[0].slice(0, 80)

      const res = await generateCaptions(selectedDoctor.id, transcript)

      const resultIdx = updatedResults.findIndex((r) => r.index === idx)
      updatedResults[resultIdx] = {
        index: idx,
        firstLine,
        success: res.success,
        data: res.success ? res.data : undefined,
        captionId: res.success ? res.captionId : undefined,
        error: !res.success ? res.error : undefined,
      }
      setResults([...updatedResults])

      if (i < failedIndices.length - 1 && !cancelRef.current) {
        await new Promise((r) => setTimeout(r, 1000))
      }
    }

    setProcessing(false)
    setDone(true)
  }

  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return (
    <div className="min-h-screen bg-[#15202B] text-white p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <TabNav />
      <h1 className="text-2xl font-bold">Batch Caption Generator</h1>

      {/* Doctor Selector */}
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
                    {'\u2014'} {d.city}, {d.state}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedDoctor && (
          <div className="bg-[#1a2744] rounded-xl p-4 space-y-1">
            <p className="text-white font-semibold">{selectedDoctor.name}</p>
            <p className="text-white/50 text-sm">
              {selectedDoctor.city}, {selectedDoctor.state}
            </p>
            {selectedDoctor.handle && (
              <p className="text-[#D66829] text-sm">{selectedDoctor.handle}</p>
            )}
          </div>
        )}
      </div>

      {/* Transcript textarea */}
      <div className="space-y-2">
        <label className="text-sm text-white/50 font-semibold uppercase tracking-wider block">
          Transcripts (separated by ---)
        </label>
        <textarea
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value)
            setParsed(false)
            setResults([])
            setDone(false)
          }}
          placeholder={`Paste transcript 1 here...\n---\nPaste transcript 2 here...\n---\nPaste transcript 3 here...`}
          rows={16}
          style={{ minHeight: '300px', resize: 'vertical' }}
          className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D66829]/50 font-mono"
        />
      </div>

      {/* Parse button */}
      <button
        onClick={handleParse}
        disabled={!rawText.trim() || processing}
        className={`px-6 py-3 rounded-xl text-sm font-bold transition ${
          rawText.trim() && !processing
            ? 'bg-white/10 text-white hover:bg-white/20 cursor-pointer'
            : 'bg-white/5 text-white/30 cursor-not-allowed'
        }`}
      >
        Parse Transcripts
      </button>

      {/* Parse preview */}
      {parsed && transcripts.length > 0 && (
        <div className="bg-[#1a2744] rounded-xl p-5 space-y-3">
          <p className="text-sm font-medium text-white/80">
            Found {transcripts.length} transcript{transcripts.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {transcripts.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-white/30 w-6 text-right shrink-0">{i + 1}.</span>
                <span className="text-sm text-white/60 truncate">
                  {t.split('\n')[0].slice(0, 100)}
                </span>
                {results[i] && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      results.find((r) => r.index === i)?.success
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {results.find((r) => r.index === i)?.success ? 'Done' : 'Failed'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate All button */}
      {parsed && transcripts.length > 0 && !done && (
        <div className="space-y-3">
          <button
            onClick={processing ? () => { cancelRef.current = true } : handleGenerateAll}
            disabled={!selectedDoctor}
            className={`w-full py-3 rounded-xl text-sm font-bold transition ${
              selectedDoctor
                ? processing
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer'
                  : 'bg-[#D66829] text-white hover:bg-[#c25a22] cursor-pointer'
                : 'bg-[#D66829]/30 text-white/30 cursor-not-allowed'
            }`}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating {currentIndex + 1} of {transcripts.length}... (click to cancel)
              </span>
            ) : (
              `Generate All ${transcripts.length} Captions`
            )}
          </button>
        </div>
      )}

      {/* Summary */}
      {done && (
        <div className="bg-[#1a2744] rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-bold">Batch Complete</h3>
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold text-green-400">{succeeded}</p>
              <p className="text-xs text-white/40">Succeeded</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{failed}</p>
              <p className="text-xs text-white/40">Failed</p>
            </div>
          </div>
          {failed > 0 && (
            <button
              onClick={handleRetryFailed}
              className="px-4 py-2 text-sm rounded-lg bg-[#D66829] text-white hover:bg-[#c25a22] transition"
            >
              Retry {failed} Failed
            </button>
          )}

          {/* Failed details */}
          {results.filter((r) => !r.success).length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-sm text-white/50 font-semibold">Failed transcripts:</p>
              {results
                .filter((r) => !r.success)
                .map((r) => (
                  <div key={r.index} className="bg-red-500/10 rounded-lg p-3">
                    <p className="text-sm text-white/70">
                      #{r.index + 1}: {r.firstLine}
                    </p>
                    <p className="text-xs text-red-400 mt-1">{r.error}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
