"use client"

import { useState, useEffect } from "react"
import { Phone, Clock, Check, X, AlertTriangle, Loader2, User, MapPin } from "lucide-react"
import { getContactRequests, adminAcknowledgeRequest } from "./actions"

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400",
  acknowledged: "bg-green-500/20 text-green-400",
  withdrawn: "bg-gray-500/20 text-gray-500",
  doctor_unreachable: "bg-red-500/20 text-red-400",
}

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState<Record<string, string>>({})
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const data = await getContactRequests()
    setRequests(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAcknowledge(requestId: string, outcome: 'patient_contacted_confirmed' | 'doctor_unreachable') {
    setActionLoading(requestId)
    await adminAcknowledgeRequest({
      requestId,
      outcome,
      note: noteInput[requestId] || undefined,
    })
    await load()
    setActionLoading(null)
    setShowNoteFor(null)
  }

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter)
  const newCount = requests.filter(r => r.status === 'new').length
  const ackCount = requests.filter(r => r.status === 'acknowledged').length
  const unreachableCount = requests.filter(r => r.status === 'doctor_unreachable').length

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>
  }

  return (
    <div className="min-h-screen bg-[#0B1118] text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Contact Requests</h1>
            <p className="text-sm text-gray-500 mt-1">{requests.length} total, {newCount} unacknowledged</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {[
            { key: "all", label: `All (${requests.length})` },
            { key: "new", label: `Open (${newCount})` },
            { key: "acknowledged", label: `Confirmed (${ackCount})` },
            { key: "doctor_unreachable", label: `Unreachable (${unreachableCount})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                filter === f.key ? "bg-neuro-orange text-white" : "bg-white/5 text-gray-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Requests */}
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className={`bg-white/[0.03] border rounded-xl p-4 ${
              r.status === 'new' && r.hours_elapsed > 48 ? 'border-red-500/30' :
              r.status === 'new' && r.hours_elapsed > 24 ? 'border-amber-500/30' :
              'border-white/10'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-white">{r.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${STATUS_COLORS[r.status] || 'bg-gray-500/20 text-gray-400'}`}>
                      {r.status === 'doctor_unreachable' ? 'unreachable' : r.status}
                    </span>
                    {r.status === 'new' && r.hours_elapsed > 48 && (
                      <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {r.hours_elapsed}h overdue
                      </span>
                    )}
                    {r.status === 'new' && r.hours_elapsed > 24 && r.hours_elapsed <= 48 && (
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-bold">
                        {r.hours_elapsed}h
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {r.phone}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  {r.note && <p className="text-xs text-gray-400 mb-2">"{r.note}"</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {r.doctor_name}</span>
                    <span>{r.doctor_clinic}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.doctor_city}, {r.doctor_state}</span>
                  </div>
                  {r.acknowledged_at && (
                    <p className="text-xs text-green-400 mt-2">
                      Acknowledged {new Date(r.acknowledged_at).toLocaleString()} via {r.acknowledged_via}
                      {r.contact_outcome && ` — ${r.contact_outcome.replace(/_/g, ' ')}`}
                    </p>
                  )}
                  {r.admin_note && <p className="text-xs text-gray-400 mt-1">Note: {r.admin_note}</p>}
                </div>
              </div>

              {/* Admin actions for unacknowledged requests */}
              {r.status === 'new' && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  {showNoteFor === r.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteInput[r.id] || ''}
                        onChange={e => setNoteInput(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="What happened? (optional)"
                        rows={2}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcknowledge(r.id, 'patient_contacted_confirmed')}
                          disabled={actionLoading === r.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold min-h-[44px] disabled:opacity-50"
                        >
                          {actionLoading === r.id ? '...' : 'Patient contacted'}
                        </button>
                        <button
                          onClick={() => handleAcknowledge(r.id, 'doctor_unreachable')}
                          disabled={actionLoading === r.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold min-h-[44px] disabled:opacity-50"
                        >
                          {actionLoading === r.id ? '...' : 'Doctor unreachable'}
                        </button>
                        <button onClick={() => setShowNoteFor(null)} className="text-xs text-gray-500">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowNoteFor(r.id)}
                        className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg text-xs font-bold min-h-[44px] hover:bg-green-600/30"
                      >
                        <Check className="w-3 h-3 inline mr-1" /> Mark outcome
                      </button>
                      <a
                        href={`tel:${r.doctor_phone}`}
                        className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-xs font-bold min-h-[44px] hover:bg-white/10 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> Call doctor
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
