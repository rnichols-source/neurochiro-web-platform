"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, AlertTriangle, Download } from "lucide-react"
import Link from "next/link"
import type { ReferralStats, DoctorReferralRow, CityReplyRow, ReplyLogEntry } from "./actions"

function StatCard({ label, value, sub, color = "text-white" }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
    </div>
  )
}

function daysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
}

export default function ReferralsClient({ data }: {
  data: {
    stats: ReferralStats
    byDoctor: DoctorReferralRow[]
    zeroDoctors: { id: string; name: string; city: string; state: string; tier: string }[]
    byCity: CityReplyRow[]
    log: ReplyLogEntry[]
  }
}) {
  const { stats, byDoctor, zeroDoctors, byCity, log } = data
  const [showZero, setShowZero] = useState(false)
  const [doctorSort, setDoctorSort] = useState<'count' | 'name' | 'last'>('count')
  const [logFilter, setLogFilter] = useState('')

  const sortedDoctors = [...byDoctor].sort((a, b) => {
    if (doctorSort === 'count') return b.referral_count - a.referral_count
    if (doctorSort === 'name') return a.name.localeCompare(b.name)
    return (b.last_referral || '').localeCompare(a.last_referral || '')
  })

  const filteredLog = logFilter
    ? log.filter(l => l.template_id === logFilter)
    : log

  const templateLabel = (id: string) => {
    const labels: Record<string, string> = {
      doctor_comment: 'Comment',
      doctor_dm: 'DM',
      doctor_comment_far: 'Comment (far)',
      doctor_dm_far: 'DM (far)',
      sent_to_patient: 'Sent',
      waitlist_dm: 'Waitlist DM',
      waitlist_comment: 'Waitlist comment',
      contact_request_link: 'Request link',
    }
    return labels[id] || id
  }

  const exportCsv = () => {
    const rows = [['Date', 'Template', 'Doctor', 'City', 'State'].join(',')]
    for (const l of filteredLog) {
      rows.push([
        l.created_at?.slice(0, 10) || '',
        templateLabel(l.template_id),
        l.doctor_name || 'Waitlist',
        l.searched_city || '',
        l.searched_state || '',
      ].map(v => `"${v}"`).join(','))
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `referrals-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-xl font-bold">Introductions</h1>

        {/* 1.1 Summary — Outreach */}
        <div>
          <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider mb-2">My Outreach</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Replies Sent" value={stats.total} color="text-cyan-400" />
            <StatCard label="Last 7 days" value={stats.last7} />
            <StatCard label="Last 30 days" value={stats.last30} />
            <StatCard label="To a Doctor" value={stats.toDoctor} color="text-green-400" sub={stats.toDoctorFar > 0 ? `${stats.toDoctorFar} far-distance` : undefined} />
            <StatCard label="To Waitlist" value={stats.toWaitlist} color="text-amber-400" sub="No doctor available" />
            <StatCard label="Doctors Reached" value={`${stats.distinctDoctors} of ${stats.verifiedDoctors}`} sub="At least one introduction" />
          </div>
        </div>

        {/* 1.1b — Patient Actions (separate from outreach) */}
        <div>
          <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider mb-2">Patient Actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Appointment Requests" value={stats.appointmentRequests} sub="From the directory" color="text-emerald-400" />
            <StatCard label="Contact Requests" value={stats.contactRequests} sub="Asked to be called" color="text-purple-400" />
            <StatCard label="From My DMs" value={stats.contactFromDm} sub="Via outreach link" color="text-cyan-400" />
            <StatCard label="From Doctor Joined" value={stats.contactFromJoined} sub="Via notification email" color="text-blue-400" />
            <StatCard label="DM Links Sent" value={stats.dmLinksSent} sub="Request links I copied" color="text-white" />
          </div>
          {stats.dmLinksSent > 0 && (
            <div className="bg-white/5 rounded-xl p-3 mt-2">
              <p className="text-xs text-white/50">
                DM outreach conversion: {stats.dmLinksSent} links sent → {stats.contactFromDm} requests received
                <span className="text-cyan-400 font-bold ml-2">
                  {Math.round((stats.contactFromDm / stats.dmLinksSent) * 100)}%
                </span>
              </p>
            </div>
          )}
        </div>

        {/* 1.2 By Doctor */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">By Doctor</h2>
            <div className="flex gap-1">
              {(['count', 'name', 'last'] as const).map(s => (
                <button key={s} onClick={() => setDoctorSort(s)}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${doctorSort === s ? 'bg-neuro-orange text-white' : 'text-white/30'}`}>
                  {s === 'count' ? 'Most' : s === 'name' ? 'A-Z' : 'Recent'}
                </button>
              ))}
            </div>
          </div>

          {sortedDoctors.length > 0 ? (
            <div className="bg-white/5 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-2 text-[10px] text-white/30 uppercase font-bold tracking-wider border-b border-white/5">
                <span>Doctor</span>
                <span className="text-right">Tier</span>
                <span className="text-right">Intros</span>
                <span className="text-right">Last</span>
              </div>
              {sortedDoctors.map(d => (
                <div key={d.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-2.5 border-b border-white/5 last:border-0 items-center">
                  <div className="min-w-0">
                    <Link href={`/admin/directory?search=${encodeURIComponent(d.name)}`} className="text-sm font-bold text-white hover:text-neuro-orange truncate block">{d.name}</Link>
                    <p className="text-[11px] text-white/30 truncate">{d.city}, {d.state}</p>
                  </div>
                  <span className={`text-[10px] font-bold ${d.tier === 'founder' ? 'text-purple-400' : d.tier === 'pro' ? 'text-green-400' : 'text-white/20'}`}>{d.tier}</span>
                  <span className="text-sm font-bold text-cyan-400 text-right">{d.referral_count}</span>
                  <span className="text-[11px] text-white/40 text-right">{d.last_referral ? daysSince(d.last_referral) + 'd ago' : '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/30 py-4">No introductions yet.</p>
          )}

          {/* Zero referral doctors */}
          <button onClick={() => setShowZero(!showZero)}
            className="flex items-center gap-2 mt-3 text-xs text-white/40 hover:text-white/60">
            {showZero ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {zeroDoctors.length} doctors with zero introductions
          </button>
          {showZero && (
            <div className="mt-2 bg-rose-500/5 border border-rose-500/10 rounded-xl p-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {zeroDoctors.map(d => (
                  <Link key={d.id} href={`/admin/directory?search=${encodeURIComponent(d.name)}`}
                    className="text-xs text-white/50 hover:text-white/80">
                    {d.name} <span className="text-white/20">({d.city}, {d.state})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 1.3 By City */}
        <section>
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">By City</h2>
          <div className="bg-white/5 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-4 py-2 text-[10px] text-white/30 uppercase font-bold tracking-wider border-b border-white/5">
              <span>City</span>
              <span className="text-right">Replies</span>
              <span className="text-right">To doc</span>
              <span className="text-right">Waitlist</span>
              <span className="text-right">Mentions</span>
            </div>
            {byCity.map((c, i) => {
              const dropped = c.demand_mentions > c.total_replies
              return (
                <div key={i} className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-4 py-2 border-b border-white/5 last:border-0 items-center ${dropped ? 'bg-rose-500/5' : ''}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {dropped && <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />}
                    <span className="text-sm text-white truncate">{c.city}, {c.state}</span>
                  </div>
                  <span className="text-sm text-white/70 text-right">{c.total_replies}</span>
                  <span className="text-sm text-green-400 text-right">{c.to_doctor}</span>
                  <span className="text-sm text-amber-400 text-right">{c.to_waitlist}</span>
                  <span className={`text-sm text-right ${dropped ? 'text-rose-400 font-bold' : 'text-cyan-400'}`}>{c.demand_mentions}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* 1.4 Full Log */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Full Log</h2>
            <div className="flex items-center gap-2">
              <select value={logFilter} onChange={e => setLogFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg text-xs text-white/60 px-2 py-1">
                <option value="">All types</option>
                <option value="doctor_comment">Comment</option>
                <option value="doctor_dm">DM</option>
                <option value="doctor_comment_far">Comment (far)</option>
                <option value="doctor_dm_far">DM (far)</option>
                <option value="sent_to_patient">Sent to patient</option>
                <option value="waitlist_dm">Waitlist DM</option>
                <option value="waitlist_comment">Waitlist comment</option>
              </select>
              <button onClick={exportCsv} className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-white/40 hover:text-white/70">
                <Download className="w-3 h-3" /> CSV
              </button>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl overflow-hidden">
            {filteredLog.length > 0 ? filteredLog.map(l => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0">
                <span className="text-[11px] text-white/30 shrink-0 w-20">{l.created_at?.slice(0, 10)}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  l.template_id.startsWith('doctor') || l.template_id === 'sent_to_patient' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                }`}>{templateLabel(l.template_id)}</span>
                <span className="text-sm text-white truncate flex-1">{l.doctor_name || 'Waitlist'}</span>
                <span className="text-[11px] text-white/30 shrink-0">{l.searched_city}{l.searched_state ? ', ' + l.searched_state : ''}</span>
              </div>
            )) : (
              <p className="text-sm text-white/30 py-6 text-center">No replies logged yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
