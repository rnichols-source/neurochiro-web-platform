"use client"

import { useEffect, useState } from "react"
import { Phone, Mail, Clock, Loader2, AlertTriangle } from "lucide-react"
import {
  clearLeadAttention,
  getContactRequests,
  markLeadContacted,
  markLeadUnreachable,
  resendLeadToDoctor,
  sendLeadReminderNow,
} from "./actions"

const FILTERS = [
  { key: "attention", label: "Needs attention" },
  { key: "all", label: "All" },
  { key: "new", label: "Open" },
  { key: "acknowledged", label: "Confirmed" },
  { key: "doctor_unreachable", label: "Unreachable" },
]

function formatEt(value: string | null | undefined): string {
  if (!value) return ""
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("attention")
  const [focus, setFocus] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    try {
      setRequests(await getContactRequests())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load requests")
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("focus")
    setFocus(id)
    if (id) setFilter("all")
  }, [])

  useEffect(() => {
    if (!focus || loading) return
    document.getElementById(`lead-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [focus, loading, requests])

  async function run(id: string, action: () => Promise<{ error?: string; success?: boolean }>) {
    setBusy(id)
    setError("")
    const result = await action()
    if (result?.error) setError(result.error)
    await load()
    setBusy(null)
  }

  const attention = requests.filter((row) => row.needsAttention)
  const filtered = filter === "attention"
    ? attention
    : filter === "all"
      ? requests
      : requests.filter((row) => row.status === filter)

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>
  }

  return (
    <div className="min-h-screen bg-[#0B1118] text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-black uppercase tracking-tight">Contact Requests</h1>
        <p className="text-sm text-gray-500 mt-1 mb-4">{attention.length} need attention · {requests.length} total</p>
        {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTERS.map((item) => {
            const count = item.key === "attention" ? attention.length : item.key === "all" ? requests.length : requests.filter((row) => row.status === item.key).length
            return (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === item.key ? "bg-neuro-orange text-white" : "bg-white/5 text-gray-400"}`}
              >
                {item.label} ({count})
              </button>
            )
          })}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? <p className="text-sm text-gray-500">Nothing in this tab.</p> : null}
          {filtered.map((row) => (
            <article
              id={`lead-${row.id}`}
              key={row.id}
              className={`bg-white/[0.03] border rounded-xl p-4 ${focus === row.id ? "border-neuro-orange" : row.needsAttention ? "border-amber-500/40" : "border-white/10"}`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold">{row.name}</h2>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{row.status}</span>
                    {row.needsAttention ? <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Attention</span> : null}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{row.source || "unknown source"} · {row.hours_elapsed}h · {row.contact_outcome || "no outcome"}{row.patient_checkin_response ? ` · patient said ${row.patient_checkin_response}` : ""}</p>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatEt(row.created_at)} ET</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Patient</p>
                  {row.phone ? <a className="flex items-center gap-1 text-neuro-orange font-bold" href={`tel:${row.phone}`}><Phone className="w-3 h-3" /> {row.phone}</a> : <p className="text-gray-500">No phone</p>}
                  {row.email ? <a className="flex items-center gap-1 text-neuro-orange" href={`mailto:${row.email}`}><Mail className="w-3 h-3" /> {row.email}</a> : null}
                  {row.preferred_time ? <p className="text-gray-400 text-xs mt-1">Best time: {row.preferred_time}</p> : null}
                  {row.message ? <p className="text-gray-300 text-xs mt-1">{row.message}</p> : null}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Doctor</p>
                  <p className="font-bold">{row.doctor_name}</p>
                  <p className="text-xs text-gray-500">{row.doctor_clinic} · {row.doctor_city}, {row.doctor_state}</p>
                  {row.doctor_phone ? <a className="flex items-center gap-1 text-neuro-orange text-sm" href={`tel:${row.doctor_phone}`}><Phone className="w-3 h-3" /> {row.doctor_phone}</a> : null}
                  {row.doctor_email ? <a className="flex items-center gap-1 text-neuro-orange text-sm" href={`mailto:${row.doctor_email}`}><Mail className="w-3 h-3" /> {row.doctor_email}</a> : <p className="text-xs text-red-300">No doctor email</p>}
                </div>
              </div>

              {row.attention_reason ? <p className="text-xs text-amber-200 mt-3">Flag: {row.attention_reason}</p> : null}
              {row.admin_note ? <p className="text-xs text-gray-400 mt-1">Note: {row.admin_note}</p> : null}

              <ol className="mt-3 space-y-1">
                {(row.timeline || []).length === 0 ? <li className="text-xs text-gray-600">No sends logged yet.</li> : null}
                {(row.timeline || []).map((item: any) => (
                  <li key={item.id} className="text-xs text-gray-400">
                    {formatEt(item.created_at)} ET · {item.kind} · {item.channel} · {item.recipient || "—"} · <span className={item.status === "failed" || item.status === "bounced" ? "text-red-300" : "text-gray-200"}>{item.status}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-3 flex flex-wrap gap-2">
                <button disabled={busy === row.id} onClick={() => run(row.id, () => resendLeadToDoctor(row.id))} className="px-3 py-2 rounded-lg bg-white/10 text-xs font-bold min-h-[44px]">Resend to doctor</button>
                <button disabled={busy === row.id} onClick={() => run(row.id, () => sendLeadReminderNow(row.id))} className="px-3 py-2 rounded-lg bg-white/10 text-xs font-bold min-h-[44px]">Send reminder now</button>
                <button disabled={busy === row.id} onClick={() => run(row.id, () => markLeadContacted(row.id, notes[row.id]))} className="px-3 py-2 rounded-lg bg-green-700 text-xs font-bold min-h-[44px]">Mark contacted</button>
                <button disabled={busy === row.id} onClick={() => run(row.id, () => markLeadUnreachable(row.id, notes[row.id]))} className="px-3 py-2 rounded-lg bg-red-700 text-xs font-bold min-h-[44px]">Mark doctor unreachable</button>
                <button disabled={busy === row.id} onClick={() => run(row.id, () => clearLeadAttention(row.id, notes[row.id]))} className="px-3 py-2 rounded-lg bg-white/10 text-xs font-bold min-h-[44px]">Clear attention flag</button>
              </div>
              <input
                value={notes[row.id] || ""}
                onChange={(event) => setNotes((prev) => ({ ...prev, [row.id]: event.target.value }))}
                placeholder="Note for mark / clear"
                className="mt-2 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
              />
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
