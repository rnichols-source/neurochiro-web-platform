'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DeliveryRow } from '../actions'
import { getDeliveryData, getClipLibrary } from '../actions'
import type { ClipCaption } from '../actions'
import TabNav from '../TabNav'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-blue-500/20 text-blue-400',
  scheduled: 'bg-purple-500/20 text-purple-400',
  posted: 'bg-green-500/20 text-green-400',
}

export default function DeliveryClient() {
  const [rows, setRows] = useState<DeliveryRow[]>([])
  const [loading, setLoading] = useState(true)

  // Doctor detail panel
  const [detailDoctor, setDetailDoctor] = useState<{ id: string; name: string } | null>(null)
  const [detailClips, setDetailClips] = useState<ClipCaption[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    getDeliveryData()
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDoctorClick = async (doctorId: string, doctorName: string) => {
    setDetailDoctor({ id: doctorId, name: doctorName })
    setDetailLoading(true)
    const result = await getClipLibrary({ doctorId, limit: 200 })
    setDetailClips(result.clips)
    setDetailLoading(false)
  }

  // Stats
  const totalMembers = rows.length
  const totalGenerated = rows.reduce((s, r) => s + r.generated, 0)
  const totalPosted = rows.reduce((s, r) => s + r.posted, 0)
  const totalTarget = rows.reduce((s, r) => s + r.target, 0)
  const overallPercent = totalTarget > 0 ? Math.round(((totalPosted + rows.reduce((s, r) => s + r.scheduled, 0)) / totalTarget) * 100) : 0

  const getVarianceColor = (v: number): string => {
    if (v < -10) return 'text-red-400'
    if (v < 0) return 'text-amber-400'
    return 'text-green-400'
  }

  const getVarianceBg = (v: number): string => {
    if (v < -10) return 'bg-red-500/10'
    if (v < 0) return 'bg-amber-500/10'
    return ''
  }

  return (
    <div className="min-h-screen bg-[#15202B] text-white p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <TabNav />
      <h1 className="text-2xl font-bold">Clip Delivery Tracker</h1>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: totalMembers },
          { label: 'Clips Generated', value: totalGenerated },
          { label: 'Clips Posted', value: totalPosted },
          { label: 'Overall Delivery', value: `${overallPercent}%` },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1a2744] rounded-xl p-4">
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-white/40 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40 text-left text-xs">
              <th className="py-3 px-2">Doctor</th>
              <th className="py-3 px-2">City</th>
              <th className="py-3 px-2 text-center">Added</th>
              <th className="py-3 px-2 text-center">Target</th>
              <th className="py-3 px-2 text-center">Gen</th>
              <th className="py-3 px-2 text-center">Appr</th>
              <th className="py-3 px-2 text-center">Sched</th>
              <th className="py-3 px-2 text-center">Posted</th>
              <th className="py-3 px-2 text-center">% Del</th>
              <th className="py-3 px-2 text-center">Expected</th>
              <th className="py-3 px-2 text-center">Variance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-white/30">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-white/30">
                  No data
                </td>
              </tr>
            ) : (
              rows
                .sort((a, b) => a.variance - b.variance)
                .map((row) => (
                  <tr
                    key={row.doctorId}
                    className={`border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${getVarianceBg(row.variance)}`}
                    onClick={() => handleDoctorClick(row.doctorId, row.doctorName)}
                  >
                    <td className="py-3 px-2 text-white/90 font-medium">{row.doctorName}</td>
                    <td className="py-3 px-2 text-white/50">{row.city}</td>
                    <td className="py-3 px-2 text-center text-white/40">
                      {new Date(row.membershipStart).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-center text-white/60">{row.target}</td>
                    <td className="py-3 px-2 text-center text-white/60">{row.generated}</td>
                    <td className="py-3 px-2 text-center text-white/60">{row.approved}</td>
                    <td className="py-3 px-2 text-center text-white/60">{row.scheduled}</td>
                    <td className="py-3 px-2 text-center text-white/60">{row.posted}</td>
                    <td className="py-3 px-2 text-center text-white/60">{row.percentDelivered}%</td>
                    <td className="py-3 px-2 text-center text-white/40">{row.expected}</td>
                    <td className={`py-3 px-2 text-center font-bold ${getVarianceColor(row.variance)}`}>
                      {row.variance > 0 ? '+' : ''}{row.variance}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Doctor detail modal */}
      {detailDoctor && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-10 overflow-y-auto"
          onClick={() => setDetailDoctor(null)}
        >
          <div
            className="bg-[#15202B] border border-white/10 rounded-2xl p-6 max-w-3xl w-full mx-4 mb-10 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{detailDoctor.name} - Clip Inventory</h2>
              <button
                onClick={() => setDetailDoctor(null)}
                className="text-white/40 hover:text-white text-xl"
              >
                x
              </button>
            </div>

            {detailLoading ? (
              <p className="text-white/30 py-8 text-center">Loading...</p>
            ) : detailClips.length === 0 ? (
              <p className="text-white/30 py-8 text-center">No clips for this doctor</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 text-left text-xs">
                      <th className="py-2 px-2">Hook</th>
                      <th className="py-2 px-2 w-24">Status</th>
                      <th className="py-2 px-2 w-28">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailClips.map((clip) => (
                      <tr key={clip.id} className="border-b border-white/5">
                        <td className="py-2 px-2 text-white/70 truncate max-w-[400px]">
                          {clip.hook_selected || clip.generated?.hooks?.[0] || 'No hook'}
                        </td>
                        <td className="py-2 px-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[clip.status] || 'bg-white/10 text-white/50'}`}>
                            {clip.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-white/40">
                          {new Date(clip.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
