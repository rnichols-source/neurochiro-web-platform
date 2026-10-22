'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Download, ArrowUpDown, Filter } from 'lucide-react'
import { getDoctorRoutingStats } from './actions'
import type { DoctorRoutingRow, DoctorRoutingData } from './actions'

// ── Types ──

type SortKey = keyof Pick<DoctorRoutingRow, 'name' | 'clinic' | 'city' | 'total' | 'last7' | 'last30' | 'daysSince' | 'tier' | 'status' | 'profile_clicks' | 'action_clicks' | 'click_rate' | 'action_rate'>
type SortDir = 'asc' | 'desc'
type FilterKey = 'all' | 'never' | 'cold30'

// ── Helpers ──

function formatDate(iso: string | null): string {
  if (!iso) return '--'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function locationLabel(row: DoctorRoutingRow): string {
  const parts: string[] = []
  if (row.city) parts.push(row.city)
  if (row.state && row.country === 'US') parts.push(row.state)
  else if (row.country && row.country !== 'US') parts.push(row.country)
  return parts.join(', ') || '--'
}

function exportCsv(rows: DoctorRoutingRow[]) {
  const headers = ['Name', 'Clinic', 'Location', 'Total', 'Last 7d', 'Last 30d', 'Last Routed', 'Days Since', 'Tier', 'Status', 'Clicks', 'Click Rate %', 'Actions', 'Action Rate %']
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push([
      `"${r.name}"`,
      `"${r.clinic}"`,
      `"${locationLabel(r)}"`,
      r.total,
      r.last7,
      r.last30,
      r.lastDate ? formatDate(r.lastDate) : '',
      r.daysSince ?? '',
      r.tier,
      r.status,
      r.profile_clicks,
      r.click_rate,
      r.action_clicks,
      r.action_rate,
    ].join(','))
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `doctor-routing-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Sub-components ──

function SummaryCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
}) {
  return (
    <div
      style={{
        background: highlight ? 'rgba(214,104,41,0.12)' : 'rgba(255,255,255,0.04)',
        border: highlight ? '1px solid rgba(214,104,41,0.35)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '16px 20px',
      }}
    >
      <p
        style={{
          fontSize: 10,
          color: highlight ? '#D66829' : 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          fontWeight: 700,
          letterSpacing: 1.2,
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: highlight ? '#D66829' : '#fff',
          margin: '4px 0 0',
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '2px 0 0' }}>{sub}</p>
      )}
    </div>
  )
}

function SortHeader({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
}: {
  col: SortKey
  label: string
  sortKey: SortKey
  sortDir: SortDir
  onSort: (k: SortKey) => void
}) {
  const active = sortKey === col
  return (
    <th
      onClick={() => onSort(col)}
      style={{
        textAlign: 'left',
        padding: '10px 12px',
        color: active ? '#D66829' : 'rgba(255,255,255,0.4)',
        fontWeight: 600,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        <ArrowUpDown
          style={{
            width: 11,
            height: 11,
            opacity: active ? 1 : 0.3,
            color: active ? '#D66829' : 'inherit',
          }}
        />
      </span>
    </th>
  )
}

// ── Main Page ──

export default function DoctorRoutingPage() {
  const [data, setData] = useState<DoctorRoutingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('total')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    getDoctorRoutingStats().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const filteredRows = useMemo(() => {
    if (!data) return []
    let rows = [...data.rows]
    if (filter === 'never') rows = rows.filter((r) => r.total === 0)
    else if (filter === 'cold30') rows = rows.filter((r) => r.last30 === 0)
    rows.sort((a, b) => {
      const av = a[sortKey] ?? -Infinity
      const bv = b[sortKey] ?? -Infinity
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      const an = av as number
      const bn = bv as number
      return sortDir === 'asc' ? an - bn : bn - an
    })
    return rows
  }, [data, filter, sortKey, sortDir])

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom, #1a2e40, #162231)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Loading doctor routing data...</p>
      </div>
    )
  }

  if (!data) return null

  const { summary } = data

  const filterButtons: { key: FilterKey; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: summary.total },
    { key: 'never', label: 'Never Routed', count: summary.withZero },
    { key: 'cold30', label: 'Cold 30 Days' },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #1a2e40, #162231)',
        color: '#fff',
        padding: '28px 20px 80px',
        fontFamily: 'Montserrat, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <TrendingUp style={{ width: 24, height: 24, color: '#D66829' }} />
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.02em',
              margin: 0,
              fontFamily: 'Lato, sans-serif',
            }}
          >
            Doctor Routing
          </h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: '0 0 28px' }}>
          Recommendations per doctor from reply_logs
        </p>

        {/* Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
            marginBottom: 28,
          }}
        >
          <SummaryCard label="Verified Pro Doctors" value={summary.total} />
          <SummaryCard
            label="With Recommendations"
            value={summary.withRecs}
            sub={`${Math.round((summary.withRecs / summary.total) * 100)}% of members`}
          />
          <SummaryCard
            label="Zero Recommendations"
            value={summary.withZero}
            sub="Never routed"
            highlight
          />
          <SummaryCard
            label="Mean / Median"
            value={`${summary.mean} / ${summary.median}`}
            sub="Total recs per doctor"
          />
          <SummaryCard
            label="Profile Clicks"
            value={summary.total_profile_clicks}
            sub={summary.overall_click_rate > 0 ? `${summary.overall_click_rate}% click rate` : 'No clicks yet'}
          />
          <SummaryCard
            label="Action Clicks"
            value={summary.total_action_clicks}
            sub={summary.overall_action_rate > 0 ? `${summary.overall_action_rate}% action rate` : 'Book/Call/Email/Web'}
          />
          <SummaryCard
            label="Tracking Since"
            value={summary.tracking_since ? new Date(summary.tracking_since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            sub={summary.tracking_since ? 'First click recorded' : 'No clicks recorded yet'}
          />
        </div>

        {/* Toolbar: filters + export */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Filter style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)' }} />
            {filterButtons.map((b) => (
              <button
                key={b.key}
                onClick={() => setFilter(b.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: filter === b.key ? '#D66829' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {b.label}
                {b.count !== undefined && (
                  <span
                    style={{
                      background: filter === b.key ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.12)',
                      borderRadius: 999,
                      padding: '1px 7px',
                      fontSize: 11,
                    }}
                  >
                    {b.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Export */}
          <button
            onClick={() => exportCsv(filteredRows)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download style={{ width: 13, height: 13 }} />
            Export CSV
          </button>
        </div>

        {/* Row count */}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: '0 0 10px' }}>
          Showing {filteredRows.length} of {summary.total} doctors
        </p>

        {/* Table */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <SortHeader col="name" label="Doctor" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="clinic" label="Clinic" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="city" label="City / Country" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="total" label="Total" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="last7" label="Last 7d" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="last30" label="Last 30d" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    whiteSpace: 'nowrap',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  Last Routed
                </th>
                <SortHeader col="daysSince" label="Days Since" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="profile_clicks" label="Clicks" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="click_rate" label="Click %" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="action_clicks" label="Actions" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="action_rate" label="Action %" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    whiteSpace: 'nowrap',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  Contacts
                </th>
                <SortHeader col="tier" label="Tier" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, i) => {
                const isZero = row.total === 0
                const isCold = row.last30 === 0 && row.total > 0
                const rowBg =
                  i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'

                return (
                  <tr
                    key={row.id}
                    style={{ background: rowBg, borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {row.name}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        color: 'rgba(255,255,255,0.5)',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.clinic || '--'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                      {locationLabel(row)}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: isZero ? '#D66829' : '#fff' }}>
                      {row.total}
                    </td>
                    <td style={{ padding: '10px 12px', color: row.last7 > 0 ? '#fff' : 'rgba(255,255,255,0.25)' }}>
                      {row.last7}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        color: isCold ? '#D66829' : row.last30 > 0 ? '#fff' : 'rgba(255,255,255,0.25)',
                        fontWeight: isCold ? 600 : 400,
                      }}
                    >
                      {row.last30}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                      {formatDate(row.lastDate)}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        color:
                          row.daysSince === null
                            ? 'rgba(255,255,255,0.2)'
                            : row.daysSince > 30
                            ? '#D66829'
                            : 'rgba(255,255,255,0.7)',
                        fontWeight: row.daysSince !== null && row.daysSince > 30 ? 600 : 400,
                      }}
                    >
                      {row.daysSince !== null ? `${row.daysSince}d` : '--'}
                    </td>
                    <td style={{ padding: '10px 12px', color: row.profile_clicks > 0 ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                      {row.profile_clicks}
                    </td>
                    <td style={{ padding: '10px 12px', color: row.click_rate > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>
                      {row.click_rate > 0 ? `${row.click_rate}%` : '--'}
                    </td>
                    <td style={{ padding: '10px 12px', color: row.action_clicks > 0 ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                      {row.action_clicks}
                    </td>
                    <td style={{ padding: '10px 12px', color: row.action_rate > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>
                      {row.action_rate > 0 ? `${row.action_rate}%` : '--'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
                      --
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#D66829',
                          background: 'rgba(214,104,41,0.1)',
                          border: '1px solid rgba(214,104,41,0.25)',
                          borderRadius: 6,
                          padding: '2px 8px',
                          textTransform: 'capitalize',
                        }}
                      >
                        {row.tier}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.5)',
                          background: 'rgba(255,255,255,0.06)',
                          borderRadius: 6,
                          padding: '2px 8px',
                          textTransform: 'capitalize',
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredRows.length === 0 && (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.3)',
                fontSize: 14,
              }}
            >
              No doctors match this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
