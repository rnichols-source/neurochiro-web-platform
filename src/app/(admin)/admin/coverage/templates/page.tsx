"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Save, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { getReplyTemplates, updateReplyTemplate, type ReplyTemplate } from "../actions"

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ReplyTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [edits, setEdits] = useState<Record<string, string>>({})

  useEffect(() => {
    getReplyTemplates().then(t => {
      setTemplates(t)
      const e: Record<string, string> = {}
      for (const tpl of t) e[tpl.id] = tpl.body
      setEdits(e)
      setLoading(false)
    })
  }, [])

  const handleSave = async (id: string) => {
    setSaving(id)
    setError("")
    setSaved(null)
    const result = await updateReplyTemplate(id, edits[id] || "")
    if (result.ok) {
      setSaved(id)
      setTimeout(() => setSaved(null), 2000)
    } else {
      setError(result.error || "Save failed")
    }
    setSaving(null)
  }

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/coverage" className="text-white/40 text-sm hover:text-white/70 flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Coverage Map
        </Link>

        <h1 className="text-xl font-bold mb-1">Reply Templates</h1>
        <p className="text-white/40 text-sm mb-8">
          Edit the messages that get copied when you reply to Instagram comments. Changes take effect immediately.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {templates.map(tpl => {
            const isDirty = edits[tpl.id] !== tpl.body
            return (
              <div key={tpl.id} className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{tpl.label}</h3>
                    {tpl.variables.length > 0 && (
                      <p className="text-[10px] text-white/30 mt-1">
                        Variables: {tpl.variables.map(v => `{${v}}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleSave(tpl.id)}
                    disabled={!isDirty || saving === tpl.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      saved === tpl.id
                        ? 'bg-green-500/20 text-green-400'
                        : isDirty
                        ? 'bg-neuro-orange text-white hover:bg-neuro-orange/90'
                        : 'bg-white/5 text-white/20'
                    }`}
                  >
                    {saved === tpl.id ? <><Check className="w-3 h-3" /> Saved</> :
                     saving === tpl.id ? 'Saving...' :
                     <><Save className="w-3 h-3" /> Save</>}
                  </button>
                </div>
                <textarea
                  value={edits[tpl.id] || ''}
                  onChange={e => setEdits(prev => ({ ...prev, [tpl.id]: e.target.value }))}
                  rows={tpl.body.split('\n').length + 2}
                  className="w-full px-3 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-neuro-orange resize-none leading-relaxed"
                />
                {isDirty && (
                  <button
                    onClick={() => setEdits(prev => ({ ...prev, [tpl.id]: tpl.body }))}
                    className="text-[10px] text-white/30 hover:text-white/60 mt-2"
                  >
                    Reset to saved
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
