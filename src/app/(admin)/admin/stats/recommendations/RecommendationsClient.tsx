'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DailyCount, RangeStats, RecommendationDetail } from './actions'
import { getRecommendationStats, getDailyData, getRangeStats, getDayDrilldown } from './actions'

// ── Helpers ──

function formatDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${parseInt(m)}/${parseInt(day)}`
}

function formatFullDate(d: string): string {
  return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function todayET(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

function startOfMonth(dateStr: string): string {
  return dateStr.slice(0, 7) + '-01'
}

type RangePreset = '7' | '30' | '90' | 'this_month' | 'last_month' | 'all' | 'custom'

function getPresetRange(preset: RangePreset, trackingSince: string): { start: string; end: string } {
  const today = todayET()
  switch (preset) {
    case '7': return { start: addDays(today, -6), end: today }
    case '30': return { start: addDays(today, -29), end: today }
    case '90': return { start: addDays(today, -89), end: today }
    case 'this_month': return { start: startOfMonth(today), end: today }
    case 'last_month': {
      const d = new Date(today + 'T12:00:00Z')
      d.setUTCMonth(d.getUTCMonth() - 1)
      const lm = d.toISOString().slice(0, 7)
      const lastDay = new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0).getDate()
      return { start: lm + '-01', end: lm + '-' + String(lastDay).padStart(2, '0') }
    }
    case 'all': return { start: trackingSince, end: today }
    default: return { start: addDays(today, -6), end: today }
  }
}

// ── Stat Card ──

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#1a2744', borderRadius: 12, padding: '16px 20px' }}>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1.2, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '4px 0 0' }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: '2px 0 0' }}>{sub}</p>}
    </div>
  )
}

// ── Main Component ──

export default function RecommendationsClient() {
  const [stats, setStats] = useState<RangeStats | null>(null)
  const [daily, setDaily] = useState<DailyCount[]>([])
  const [preset, setPreset] = useState<RangePreset>('7')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [rangeData, setRangeData] = useState<Awaited<ReturnType<typeof getRangeStats>> | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [drilldown, setDrilldown] = useState<RecommendationDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Load initial data
  useEffect(() => {
    Promise.all([getRecommendationStats(), getDailyData()]).then(([s, d]) => {
      setStats(s)
      setDaily(d)
      setLoading(false)
    })
  }, [])

  // Load range stats when preset/custom changes
  const loadRange = useCallback(async (p: RangePreset, cStart?: string, cEnd?: string) => {
    if (!stats) return
    let range: { start: string; end: string }
    if (p === 'custom' && cStart && cEnd) {
      range = { start: cStart, end: cEnd }
    } else if (p === 'custom') {
      return
    } else {
      range = getPresetRange(p, stats.trackingSince)
    }
    const data = await getRangeStats(range.start, range.end)
    setRangeData(data)
  }, [stats])

  useEffect(() => {
    if (stats) loadRange(preset, customStart, customEnd)
  }, [stats, preset, customStart, customEnd, loadRange])

  // Day drilldown
  const handleDayClick = async (date: string) => {
    if (selectedDay === date) {
      setSelectedDay(null)
      setDrilldown([])
      return
    }
    setSelectedDay(date)
    const details = await getDayDrilldown(date)
    setDrilldown(details)
  }

  // CSV export
  const exportCsv = () => {
    if (!rangeData || !stats) return
    const range = preset === 'custom' && customStart && customEnd
      ? { start: customStart, end: customEnd }
      : getPresetRange(preset, stats.trackingSince)
    const filtered = daily.filter(d => d.date >= range.start && d.date <= range.end)

    // We need the drilldown data for CSV -- use daily data as summary fallback
    // For full CSV we need to export based on what we have
    const rows = ['date,recommendations,waitlist']
    for (const d of filtered) {
      rows.push(`${d.date},${d.recommendations},${d.waitlist}`)
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recommendations-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Copy marketing sentence
  const copyMarketing = () => {
    if (!rangeData?.marketingSentence) return
    navigator.clipboard.writeText(rangeData.marketingSentence)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#15202B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Loading recommendation stats...</p>
      </div>
    )
  }

  if (!stats) return null

  const today = todayET()
  const yesterday = addDays(today, -1)
  const todayRecs = daily.find(d => d.date === today)?.recommendations ?? 0
  const yesterdayRecs = daily.find(d => d.date === yesterday)?.recommendations ?? 0

  // 7-day coverage
  const last7 = daily.filter(d => d.date >= addDays(today, -6) && d.date <= today)
  const last7Recs = last7.reduce((s, d) => s + d.recommendations, 0)
  const last7Wl = last7.reduce((s, d) => s + d.waitlist, 0)
  const last7Coverage = last7Recs + last7Wl > 0
    ? Math.round(last7Recs / (last7Recs + last7Wl) * 1000) / 10
    : 0

  // Filter daily data to selected range for chart
  const currentRange = preset === 'custom' && customStart && customEnd
    ? { start: customStart, end: customEnd }
    : getPresetRange(preset, stats.trackingSince)
  const chartData = daily.filter(d => d.date >= currentRange.start && d.date <= currentRange.end)

  const maxBar = Math.max(...chartData.map(d => d.recommendations + d.waitlist), 1)

  // Trailing 7-day averages for anomaly detection
  const trailing7Avg = (date: string): number => {
    const idx = daily.findIndex(d => d.date === date)
    if (idx < 7) return Infinity // not enough data, no anomaly
    let sum = 0
    for (let i = idx - 7; i < idx; i++) sum += daily[i].recommendations
    return sum / 7
  }

  const presetButtons: { key: RangePreset; label: string }[] = [
    { key: '7', label: 'Last 7' },
    { key: '30', label: 'Last 30' },
    { key: '90', label: 'Last 90' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#15202B', color: '#fff', padding: '24px 16px 80px', fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', fontFamily: 'Lato, sans-serif' }}>Recommendation Stats</h1>
        <p style={{ fontSize: 13, color: '#D66829', fontWeight: 600, margin: '0 0 24px' }}>Tracking since Sep 27, 2026</p>

        {/* Top Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 32 }}>
          <StatCard label="Today" value={todayRecs.toLocaleString()} />
          <StatCard label="Yesterday" value={yesterdayRecs.toLocaleString()} />
          <StatCard
            label="7-Day Avg"
            value={stats.trackingDays >= 7 ? (stats.avg7d ?? 0).toFixed(1) : '--'}
            sub={stats.trackingDays < 7 ? 'not enough data' : undefined}
          />
          <StatCard label="7-Day Coverage" value={`${last7Coverage}%`} sub={`${last7Recs} rec / ${last7Recs + last7Wl} total`} />
          <StatCard label="All-Time Recs" value={stats.recommendations.toLocaleString()} />
          <StatCard label="Raw Actions" value={stats.rawActions.toLocaleString()} sub="total reply actions" />
        </div>

        {/* Range Selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {presetButtons.map(b => (
            <button
              key={b.key}
              onClick={() => setPreset(b.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: preset === b.key ? '#D66829' : 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#1a2744', color: '#fff', fontSize: 13 }}
            />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>to</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#1a2744', color: '#fff', fontSize: 13 }}
            />
          </div>
        )}

        {/* Daily Bar Chart */}
        <div style={{ background: '#1a2744', borderRadius: 16, padding: '20px 16px', marginBottom: 24, overflowX: 'auto' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 16px', letterSpacing: 1 }}>Daily Breakdown</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, minHeight: 180, minWidth: chartData.length * 20 }}>
            {chartData.map(d => {
              const recH = Math.max(d.recommendations / maxBar * 160, d.recommendations > 0 ? 4 : 1)
              const wlH = Math.max(d.waitlist / maxBar * 160, d.waitlist > 0 ? 4 : 0)
              const isAnomaly = d.recommendations > 3 * trailing7Avg(d.date)
              const isSelected = selectedDay === d.date
              return (
                <div
                  key={d.date}
                  onClick={() => handleDayClick(d.date)}
                  style={{
                    flex: '1 1 0',
                    minWidth: 14,
                    maxWidth: 40,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    paddingBottom: 20,
                    position: 'relative',
                    borderRadius: 4,
                    outline: isSelected ? '2px solid #D66829' : 'none',
                    outlineOffset: 2,
                  }}
                  title={`${d.date}: ${d.recommendations} recs, ${d.waitlist} waitlist`}
                >
                  {isAnomaly && (
                    <div style={{ position: 'absolute', top: -4, fontSize: 10, color: '#f59e0b' }} title="Anomaly: >3x trailing 7-day avg">!</div>
                  )}
                  <div style={{
                    width: '100%',
                    height: recH,
                    background: '#D66829',
                    borderRadius: '3px 3px 0 0',
                    border: isAnomaly ? '1px solid #f59e0b' : 'none',
                  }} />
                  {wlH > 0 && (
                    <div style={{
                      width: '100%',
                      height: wlH,
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '0 0 3px 3px',
                    }} />
                  )}
                  <p style={{
                    position: 'absolute',
                    bottom: 0,
                    fontSize: 8,
                    color: 'rgba(255,255,255,0.3)',
                    whiteSpace: 'nowrap',
                    margin: 0,
                    transform: chartData.length > 14 ? 'rotate(-45deg)' : 'none',
                    transformOrigin: 'top center',
                  }}>
                    {formatDate(d.date)}
                  </p>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, background: '#D66829', borderRadius: 2 }} /> Recommendations
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} /> Waitlist
            </span>
          </div>
        </div>

        {/* Drilldown Panel */}
        {selectedDay && (
          <div style={{ background: '#1a2744', borderRadius: 16, padding: 20, marginBottom: 24, border: '1px solid rgba(214,104,41,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{formatFullDate(selectedDay)}</h3>
              <button
                onClick={() => { setSelectedDay(null); setDrilldown([]) }}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

            {drilldown.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No data for this day.</p>
            ) : (
              <>
                {/* Recommendations */}
                {drilldown.filter(d => d.template_type === 'recommendation').length > 0 && (
                  <>
                    <p style={{ fontSize: 11, color: '#D66829', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: 1 }}>
                      Recommendations ({drilldown.filter(d => d.template_type === 'recommendation').length})
                    </p>
                    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Time (ET)</th>
                            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Patient City</th>
                            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>State</th>
                            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Doctor</th>
                            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Doctor City</th>
                            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drilldown.filter(d => d.template_type === 'recommendation').map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '6px 8px' }}>{r.timestamp_et}</td>
                              <td style={{ padding: '6px 8px' }}>{r.searched_city}</td>
                              <td style={{ padding: '6px 8px' }}>{r.searched_state || '--'}</td>
                              <td style={{ padding: '6px 8px' }}>{r.doctor_name || '--'}</td>
                              <td style={{ padding: '6px 8px' }}>{r.doctor_city || '--'}</td>
                              <td style={{ padding: '6px 8px' }}>{r.template_type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Waitlist */}
                {drilldown.filter(d => d.template_type === 'waitlist').length > 0 && (
                  <>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: 1 }}>
                      Waitlist ({drilldown.filter(d => d.template_type === 'waitlist').length})
                    </p>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Time (ET)</th>
                            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Patient City</th>
                            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>State</th>
                            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drilldown.filter(d => d.template_type === 'waitlist').map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '6px 8px' }}>{r.timestamp_et}</td>
                              <td style={{ padding: '6px 8px' }}>{r.searched_city}</td>
                              <td style={{ padding: '6px 8px' }}>{r.searched_state || '--'}</td>
                              <td style={{ padding: '6px 8px' }}>{r.template_type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Range Stats */}
        {rangeData && (
          <div style={{ background: '#1a2744', borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 16px', letterSpacing: 1 }}>
              Range Stats ({currentRange.start} to {currentRange.end})
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
              <StatCard label="Recommendations" value={rangeData.recommendations.toLocaleString()} />
              <StatCard label="Waitlist" value={rangeData.waitlist.toLocaleString()} />
              <StatCard label="Coverage Rate" value={`${rangeData.coverageRate}%`} />
              <StatCard label="Distinct Doctors" value={rangeData.distinctDoctors} />
              <StatCard label="Distinct Cities" value={rangeData.distinctCities} />
              {rangeData.bestDay && (
                <StatCard label="Best Day" value={rangeData.bestDay.count.toLocaleString()} sub={formatFullDate(rangeData.bestDay.date)} />
              )}
            </div>

            {/* Type breakdown */}
            <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
              <span>Standard: <strong style={{ color: '#fff' }}>{rangeData.byType.standard}</strong></span>
              <span>Far: <strong style={{ color: '#fff' }}>{rangeData.byType.far}</strong></span>
              <span>Waitlist: <strong style={{ color: '#fff' }}>{rangeData.byType.waitlist}</strong></span>
            </div>

            {/* Averages */}
            <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              <span>
                30-day avg:{' '}
                <strong style={{ color: '#fff' }}>
                  {stats.trackingDays >= 30 && stats.avg30d !== null ? stats.avg30d.toFixed(1) : 'not enough data yet'}
                </strong>
              </span>
              <span>
                All-time avg:{' '}
                <strong style={{ color: '#fff' }}>
                  {stats.trackingDays >= 90 && stats.avgAllTime !== null ? stats.avgAllTime.toFixed(1) : 'not enough data yet'}
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* Marketing Summary */}
        {rangeData?.marketingSentence && (
          <div style={{ background: '#1a2744', borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 12px', letterSpacing: 1 }}>Marketing Summary</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <p style={{ fontSize: 15, color: '#fff', margin: 0, flex: 1, lineHeight: 1.5 }}>
                {rangeData.marketingSentence}
              </p>
              <button
                onClick={copyMarketing}
                style={{
                  background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: copied ? '#22c55e' : '#fff',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* CSV Export */}
        <button
          onClick={exportCsv}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            borderRadius: 10,
            padding: '10px 24px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Export CSV
        </button>
      </div>
    </div>
  )
}
