'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getCurrentPartner } from '@/lib/partner'
import type { Couple, Season, ConnectionCategory, Connection } from '@/lib/types'
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/types'

const SEASONS: { key: Season; label: string }[] = [
  { key: 'rebuilding', label: 'rebuilding' },
  { key: 'growing', label: 'growing' },
  { key: 'adventuring', label: 'adventuring' },
  { key: 'resting', label: 'resting' },
]

function getFirstDayOffset(): number {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const day = first.getDay()
  return day === 0 ? 6 : day - 1
}

function getCurrentWeekMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  return monday.toISOString().split('T')[0]
}

const CONVERSATION_STARTERS = [
  "What's one thing I could do this week to help you feel more connected?",
  "Is there something on your mind you haven't had a chance to share?",
  "What moment this week made you feel closest to me?",
  "What do you need more of from me right now?",
  "Is there anything weighing on you that I can help carry?",
]

function getStarterForWeek(weekOf: string): string {
  let hash = 0
  for (let i = 0; i < weekOf.length; i++) {
    hash = ((hash << 5) - hash) + weekOf.charCodeAt(i)
    hash |= 0
  }
  return CONVERSATION_STARTERS[Math.abs(hash) % CONVERSATION_STARTERS.length]
}

export default function UsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [couple, setCouple] = useState<Couple | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [myRating, setMyRating] = useState<number | null>(null)
  const [partnerRating, setPartnerRating] = useState<number | null>(null)
  const [partnerName, setPartnerName] = useState<string>('')
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [myPartnerId, setMyPartnerId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    const handleFocus = () => loadData()
    const handleVisibility = () => { if (document.visibilityState === 'visible') loadData() }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => { window.removeEventListener('focus', handleFocus); document.removeEventListener('visibilitychange', handleVisibility) }
  }, [])

  async function loadData() {
    const myPartner = await getCurrentPartner()
    if (!myPartner) return

    setMyPartnerId(myPartner.id)
    setCoupleId(myPartner.couple_id)

    const { data: coupleData } = await supabase
      .from('couples').select('*').eq('id', myPartner.couple_id).single()
    if (coupleData) setCouple(coupleData)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { data: monthConns } = await supabase
      .from('connections').select('*')
      .eq('couple_id', myPartner.couple_id)
      .gte('created_at', monthStart)
      .order('created_at', { ascending: false })
    if (monthConns) setConnections(monthConns)

    const { data: allConns } = await supabase
      .from('connections').select('created_at')
      .eq('couple_id', myPartner.couple_id)
      .order('created_at', { ascending: false })
    if (allConns && allConns.length > 0) {
      const daySet = new Set(allConns.map((c) => new Date(c.created_at).toDateString()))
      let count = 0
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      // Check if today has connections; if not, start counting from yesterday
      const hasToday = daySet.has(now.toDateString())
      const startOffset = hasToday ? 0 : 1
      for (let i = startOffset; ; i++) {
        const checkDate = new Date(now)
        checkDate.setDate(checkDate.getDate() - i)
        if (daySet.has(checkDate.toDateString())) count++
        else break
      }
      setStreak(count)
    }

    // Load weekly check-in data
    const weekOf = getCurrentWeekMonday()
    const { data: checks } = await supabase
      .from('weekly_checks')
      .select('*')
      .eq('couple_id', myPartner.couple_id)
      .eq('week_of', weekOf)
    if (checks) {
      const mine = checks.find((c: any) => c.partner_id === myPartner.id)
      const theirs = checks.find((c: any) => c.partner_id !== myPartner.id)
      if (mine) setMyRating(mine.rating)
      if (theirs) setPartnerRating(theirs.rating)
    }

    // Load partner name
    const { data: partners } = await supabase
      .from('partners')
      .select('id, name')
      .eq('couple_id', myPartner.couple_id)
    if (partners) {
      const other = partners.find((p: any) => p.id !== myPartner.id)
      if (other) setPartnerName(other.name || 'your partner')
    }

    setLoading(false)
  }

  async function submitRating(rating: number) {
    if (!coupleId || !myPartnerId || myRating !== null) return
    const weekOf = getCurrentWeekMonday()
    setMyRating(rating)
    await supabase.from('weekly_checks').upsert({
      couple_id: coupleId,
      partner_id: myPartnerId,
      rating,
      week_of: weekOf,
    }, { onConflict: 'partner_id,week_of' })
  }

  async function updateSeason(season: Season) {
    if (!couple) return
    await supabase.from('couples').update({ season }).eq('id', couple.id)
    setCouple({ ...couple, season })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-hand" style={{ fontSize: 24, color: '#A09485' }}>us</span>
      </div>
    )
  }

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const firstDayOffset = getFirstDayOffset()
  const today = now.getDate()
  const connDates = new Set(connections.map((c) => new Date(c.created_at).getDate()))

  const categoryCounts: Record<string, number> = {}
  connections.forEach((c) => { categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1 })
  const maxCount = Math.max(...Object.values(categoryCounts), 1)

  const weekOf = getCurrentWeekMonday()
  const ratingGap = myRating !== null && partnerRating !== null ? Math.abs(myRating - partnerRating) : 0

  return (
    <div style={{ maxWidth: 448, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 className="font-hand" style={{ fontSize: 32, fontWeight: 400, color: '#2C2C2C' }}>us</h1>
      </div>

      {/* Streak */}
      <div style={{
        textAlign: 'center', marginBottom: 32,
        paddingTop: 24, paddingBottom: 24,
        borderTop: '1px solid #E5E0DA', borderBottom: '1px solid #E5E0DA',
      }}>
        <p style={{ fontSize: 56, fontWeight: 200, color: '#2C2C2C', margin: 0, lineHeight: 1 }}>
          {streak}
        </p>
        <p style={{ fontSize: 13, color: '#A09485', marginTop: 8 }}>
          {streak === 0 ? 'log your first connection' : 'day streak'}
        </p>
      </div>

      {/* Season */}
      <div style={{ marginBottom: 32 }}>
        <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 14 }}>
          current season
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {SEASONS.map((s) => {
            const isActive = couple?.season === s.key
            return (
              <button key={s.key} onClick={() => updateSeason(s.key)}
                style={{
                  flex: 1, padding: '10px 0', fontSize: 12, fontWeight: 500,
                  borderRadius: 999, cursor: 'pointer',
                  background: isActive ? '#5E8B6A' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#A09485',
                  border: isActive ? 'none' : '1px solid #E5E0DA',
                }}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Calendar */}
      <div style={{ marginBottom: 32 }}>
        <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 14 }}>
          {now.toLocaleDateString('en-US', { month: 'long' }).toLowerCase()}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} style={{ fontSize: 10, color: '#C4BDB4', fontWeight: 500, paddingBottom: 4 }}>{d}</div>
          ))}
          {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e-${i}`} />)}
          {monthDays.map((day) => {
            const hasConn = connDates.has(day)
            const isToday = day === today
            const isFuture = day > today
            return (
              <div key={day} style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', fontSize: 11, fontWeight: isToday ? 600 : 400,
                background: hasConn ? '#5E8B6A' : 'transparent',
                color: hasConn ? '#FFFFFF' : isFuture ? '#D4CFC8' : '#2C2C2C',
                border: isToday && !hasConn ? '1px solid #E5E0DA' : 'none',
              }}>
                {day}
              </div>
            )
          })}
        </div>
      </div>

      {/* Connection Mix */}
      <div style={{ marginBottom: 32 }}>
        <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 14 }}>
          connection mix
        </p>
        {Object.keys(categoryCounts).length === 0 ? (
          <p style={{ fontSize: 13, color: '#A09485', fontWeight: 300 }}>
            start logging connections to see your mix
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(Object.keys(CATEGORY_LABELS) as ConnectionCategory[]).map((cat) => {
              const count = categoryCounts[cat] || 0
              const width = maxCount > 0 ? (count / maxCount) * 100 : 0
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, width: 20 }}>{CATEGORY_EMOJI[cat]}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#E5E0DA' }}>
                    <div style={{
                      height: '100%', borderRadius: 3, background: '#5E8B6A',
                      width: `${Math.max(width, count > 0 ? 6 : 0)}%`,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#A09485', width: 16, textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Gottman's 7 Principles */}
      <div style={{ marginBottom: 32 }}>
        <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 14 }}>
          gottman&apos;s 7 principles
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push('/love-maps')}
            style={{
              flex: 1, padding: '20px 16px', background: '#FFFFFF',
              border: '1px solid #E5E0DA', borderRadius: 16, cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>🗺</span>
            <span className="font-hand" style={{ fontSize: 16, color: '#2C2C2C', display: 'block' }}>
              love maps
            </span>
            <span style={{ fontSize: 12, color: '#A09485', fontWeight: 300, display: 'block', marginTop: 4 }}>
              know each other&apos;s world
            </span>
          </button>
          <button
            onClick={() => router.push('/rituals')}
            style={{
              flex: 1, padding: '20px 16px', background: '#FFFFFF',
              border: '1px solid #E5E0DA', borderRadius: 16, cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>🕯</span>
            <span className="font-hand" style={{ fontSize: 16, color: '#2C2C2C', display: 'block' }}>
              rituals
            </span>
            <span style={{ fontSize: 12, color: '#A09485', fontWeight: 300, display: 'block', marginTop: 4 }}>
              shared meaning &amp; goals
            </span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button onClick={() => router.push('/decisions')}
            style={{ flex: 1, padding: '16px 12px', background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16, cursor: 'pointer', textAlign: 'left' }}>
            <span className="font-hand" style={{ fontSize: 15, color: '#2C2C2C', display: 'block' }}>decisions</span>
            <span style={{ fontSize: 11, color: '#A09485', display: 'block', marginTop: 2 }}>share power together</span>
          </button>
          <button onClick={() => router.push('/gridlock')}
            style={{ flex: 1, padding: '16px 12px', background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16, cursor: 'pointer', textAlign: 'left' }}>
            <span className="font-hand" style={{ fontSize: 15, color: '#2C2C2C', display: 'block' }}>gridlock</span>
            <span style={{ fontSize: 11, color: '#A09485', display: 'block', marginTop: 2 }}>perpetual issues</span>
          </button>
        </div>
      </div>

      {/* Go Deeper */}
      <div style={{ marginBottom: 32 }}>
        <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 14 }}>
          go deeper
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push('/notes')}
            style={{
              flex: 1, padding: '20px 16px', background: '#FFFFFF',
              border: '1px solid #E5E0DA', borderRadius: 16, cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>&#128274;</span>
            <span className="font-hand" style={{ fontSize: 16, color: '#2C2C2C', display: 'block' }}>
              sealed notes
            </span>
            <span style={{ fontSize: 12, color: '#A09485', fontWeight: 300, display: 'block', marginTop: 4 }}>
              write something vulnerable
            </span>
          </button>
          <button
            onClick={() => router.push('/desires')}
            style={{
              flex: 1, padding: '20px 16px', background: '#FFFFFF',
              border: '1px solid #E5E0DA', borderRadius: 16, cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>&#10024;</span>
            <span className="font-hand" style={{ fontSize: 16, color: '#2C2C2C', display: 'block' }}>
              desire menu
            </span>
            <span style={{ fontSize: 12, color: '#A09485', fontWeight: 300, display: 'block', marginTop: 4 }}>
              share what you want more of
            </span>
          </button>
        </div>
        <button
          onClick={() => router.push('/repair')}
          style={{
            width: '100%', padding: '20px 16px', background: '#FFFFFF',
            border: '1px solid #E5E0DA', borderRadius: 16, cursor: 'pointer',
            textAlign: 'left', marginTop: 10,
          }}
        >
          <span className="font-hand" style={{ fontSize: 16, color: '#2C2C2C', display: 'block' }}>
            rupture &amp; repair
          </span>
          <span style={{ fontSize: 12, color: '#A09485', fontWeight: 300, display: 'block', marginTop: 4 }}>
            repairs, debriefs &amp; repair attempts
          </span>
        </button>

        {/* Existing feature links */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button onClick={() => router.push('/promises')}
            style={{ flex: 1, padding: '16px 12px', background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16, cursor: 'pointer', textAlign: 'left' }}>
            <span className="font-hand" style={{ fontSize: 15, color: '#2C2C2C', display: 'block' }}>promises</span>
            <span style={{ fontSize: 11, color: '#A09485', display: 'block', marginTop: 2 }}>one promise per week</span>
          </button>
          <button onClick={() => router.push('/monthly')}
            style={{ flex: 1, padding: '16px 12px', background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16, cursor: 'pointer', textAlign: 'left' }}>
            <span className="font-hand" style={{ fontSize: 15, color: '#2C2C2C', display: 'block' }}>state of us</span>
            <span style={{ fontSize: 11, color: '#A09485', display: 'block', marginTop: 2 }}>monthly review</span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button onClick={() => router.push('/dates')}
            style={{ flex: 1, padding: '16px 12px', background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16, cursor: 'pointer', textAlign: 'left' }}>
            <span className="font-hand" style={{ fontSize: 15, color: '#2C2C2C', display: 'block' }}>date ideas</span>
            <span style={{ fontSize: 11, color: '#A09485', display: 'block', marginTop: 2 }}>plan future dates</span>
          </button>
          <button onClick={() => router.push('/reading')}
            style={{ flex: 1, padding: '16px 12px', background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16, cursor: 'pointer', textAlign: 'left' }}>
            <span className="font-hand" style={{ fontSize: 15, color: '#2C2C2C', display: 'block' }}>shared reading</span>
            <span style={{ fontSize: 11, color: '#A09485', display: 'block', marginTop: 2 }}>learn together</span>
          </button>
        </div>
        <button onClick={() => router.push('/milestones')}
          style={{ width: '100%', padding: '16px 12px', background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16, cursor: 'pointer', textAlign: 'left', marginTop: 10 }}>
          <span className="font-hand" style={{ fontSize: 15, color: '#2C2C2C', display: 'block' }}>milestones</span>
          <span style={{ fontSize: 11, color: '#A09485', display: 'block', marginTop: 2 }}>your story so far</span>
        </button>
      </div>

      {/* Weekly Check-In */}
      <div style={{ marginBottom: 32 }}>
        <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 14 }}>
          weekly check-in
        </p>

        {myRating === null ? (
          /* State A: Haven't rated yet */
          <div>
            <p style={{ fontSize: 13, color: '#A09485', marginBottom: 16, fontWeight: 300 }}>
              how connected do you feel this week?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => submitRating(n)}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '1px solid #E5E0DA', background: 'transparent',
                    color: '#2C2C2C', fontSize: 14, fontWeight: 500,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ) : partnerRating === null ? (
          /* State B: You rated, waiting on partner */
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: '50%',
              background: '#5E8B6A', color: '#FFFFFF', fontSize: 14, fontWeight: 500,
              marginBottom: 12,
            }}>
              {myRating}
            </div>
            <p style={{ fontSize: 13, color: '#A09485', fontWeight: 300 }}>
              waiting for {partnerName}...
            </p>
          </div>
        ) : (
          /* State C: Both rated */
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#5E8B6A', color: '#FFFFFF', fontSize: 14, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 6px',
                }}>
                  {myRating}
                </div>
                <p style={{ fontSize: 12, color: '#A09485' }}>you</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#5E8B6A', color: '#FFFFFF', fontSize: 14, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 6px',
                }}>
                  {partnerRating}
                </div>
                <p style={{ fontSize: 12, color: '#A09485' }}>{partnerName}</p>
              </div>
            </div>
            {ratingGap >= 2 && (
              <div style={{
                padding: 16, borderRadius: 12, background: '#FAF8F5',
                border: '1px solid #E5E0DA',
              }}>
                <p style={{ fontSize: 13, color: '#8B7355', fontWeight: 500, marginBottom: 6 }}>
                  conversation starter
                </p>
                <p style={{ fontSize: 13, color: '#A09485', fontWeight: 300, lineHeight: 1.5 }}>
                  {getStarterForWeek(weekOf)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
