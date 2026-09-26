"use client"

import { useState } from "react"
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { parseMentionsBatch, saveMentionsBatch, ParsedMention } from "../actions"

export default function MentionsEntryPage() {
  const [input, setInput] = useState("")
  const [postRef, setPostRef] = useState("")
  const [mentionedOn, setMentionedOn] = useState(new Date().toISOString().slice(0, 10))
  const [parsed, setParsed] = useState<ParsedMention[] | null>(null)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<number | null>(null)
  const [error, setError] = useState("")

  const handleParse = async () => {
    const lines = input.split("\n").map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return

    setParsing(true)
    setError("")
    setParsed(null)
    setSaved(null)

    try {
      const results = await parseMentionsBatch(lines)
      setParsed(results)
    } catch {
      setError("Failed to parse. Try again.")
    }
    setParsing(false)
  }

  const handleSave = async () => {
    if (!parsed) return
    const matched = parsed.filter(p => p.matched && p.lat && p.lng)
    if (matched.length === 0) return

    setSaving(true)
    setError("")

    try {
      const result = await saveMentionsBatch(
        matched.map(m => ({ city: m.city!, state: m.state!, lat: m.lat!, lng: m.lng! })),
        postRef,
        mentionedOn,
      )
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(result.saved)
        setInput("")
        setParsed(null)
      }
    } catch {
      setError("Save failed. Try again.")
    }
    setSaving(false)
  }

  const matchedCount = parsed?.filter(p => p.matched).length || 0
  const unmatchedCount = parsed?.filter(p => !p.matched).length || 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/coverage" className="text-white/40 text-sm hover:text-white/70 flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Coverage Map
        </Link>

        <h1 className="text-xl font-bold mb-1">Add Comment Mentions</h1>
        <p className="text-white/40 text-sm mb-6">
          Paste city/state lines from Instagram comments. One per line. Messy input is fine.
        </p>

        {saved !== null && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            <p className="text-sm text-green-300">Saved {saved} mentions. They'll appear on the coverage map.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Post reference + date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-white/50 mb-1.5">Post Reference</label>
              <input
                type="text"
                value={postRef}
                onChange={e => setPostRef(e.target.value)}
                placeholder="e.g. 'Sept 25 reel' or URL"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-neuro-orange"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 mb-1.5">Date Mentioned</label>
              <input
                type="date"
                value={mentionedOn}
                onChange={e => setMentionedOn(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-neuro-orange"
              />
            </div>
          </div>

          {/* City/state input */}
          <div>
            <label className="block text-xs font-bold text-white/50 mb-1.5">Cities (one per line)</label>
            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); setParsed(null); setSaved(null) }}
              placeholder={"tulsa ok\nAustin, Texas\nSan Diego CA\nportland, oregon\nNASHVILLE TN"}
              rows={10}
              className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-neuro-orange resize-none"
            />
          </div>

          {/* Parse button */}
          {!parsed && (
            <button
              onClick={handleParse}
              disabled={parsing || !input.trim()}
              className="w-full py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {parsing ? <><Loader2 className="w-4 h-4 animate-spin" /> Parsing...</> : "Preview Matches"}
            </button>
          )}

          {/* Results */}
          {parsed && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-400 font-bold">{matchedCount} matched</span>
                {unmatchedCount > 0 && <span className="text-red-400 font-bold">{unmatchedCount} unmatched</span>}
              </div>

              <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                {parsed.map((p, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    p.matched ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                  }`}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${p.matched ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-white/50 font-mono text-xs min-w-[120px]">{p.input}</span>
                    <span className="text-white/30">→</span>
                    {p.matched ? (
                      <span className="text-white font-medium">{p.city}, {p.state}</span>
                    ) : (
                      <span className="text-red-400/70">
                        {p.city && p.state ? `${p.city}, ${p.state} (not in zip_codes)` : 'Could not parse'}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {matchedCount > 0 && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 bg-green-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : `Save ${matchedCount} Mentions`}
                </button>
              )}

              <button
                onClick={() => { setParsed(null); setSaved(null) }}
                className="w-full py-2 text-white/40 text-sm hover:text-white/70"
              >
                Edit input
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
