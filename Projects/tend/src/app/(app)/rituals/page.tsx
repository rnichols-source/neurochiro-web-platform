'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { getCurrentPartner } from '@/lib/partner'
import type { Partner } from '@/lib/types'

interface Ritual {
  id: string
  couple_id: string
  name: string
  category: string
  frequency: string | null
  rating: number | null
  improvement_note: string | null
  created_at: string
}

interface SharedGoal {
  id: string
  couple_id: string
  goal: string
  action_steps: string[]
  status: string
  target_date: string | null
  created_at: string
}

const RITUAL_CATEGORIES = [
  { key: 'morning', label: 'morning routine', emoji: '☀️' },
  { key: 'parting', label: 'partings', emoji: '👋' },
  { key: 'reunion', label: 'reunions', emoji: '🤗' },
  { key: 'meals', label: 'meals together', emoji: '🍽' },
  { key: 'bedtime', label: 'bedtime', emoji: '🌙' },
  { key: 'dates', label: 'date nights', emoji: '💫' },
  { key: 'holidays', label: 'holidays & traditions', emoji: '🎄' },
  { key: 'play', label: 'play & fun', emoji: '🎲' },
  { key: 'spiritual', label: 'spiritual & growth', emoji: '🙏' },
  { key: 'other', label: 'other', emoji: '✨' },
]

export default function RitualsPage() {
  const supabase = createClient()
  const [me, setMe] = useState<Partner | null>(null)
  const [step, setStep] = useState<'home' | 'add-ritual' | 'add-goal' | 'view-goals'>('home')
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [goals, setGoals] = useState<SharedGoal[]>([])
  const [loading, setLoading] = useState(true)

  // Add ritual form
  const [ritualName, setRitualName] = useState('')
  const [ritualCategory, setRitualCategory] = useState('')
  const [ritualFrequency, setRitualFrequency] = useState('')
  const [ritualRating, setRitualRating] = useState<number | null>(null)
  const [ritualNote, setRitualNote] = useState('')

  // Add goal form
  const [goalText, setGoalText] = useState('')
  const [goalSteps, setGoalSteps] = useState('')
  const [goalDate, setGoalDate] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const myPartner = await getCurrentPartner()
    if (!myPartner) return
    setMe(myPartner)

    const { data: ritualData } = await supabase
      .from('rituals')
      .select('*')
      .eq('couple_id', myPartner.couple_id)
      .order('created_at', { ascending: true })

    if (ritualData) setRituals(ritualData)

    const { data: goalData } = await supabase
      .from('shared_goals')
      .select('*')
      .eq('couple_id', myPartner.couple_id)
      .order('created_at', { ascending: false })

    if (goalData) setGoals(goalData)

    setLoading(false)
  }

  async function addRitual() {
    if (!me || !ritualName.trim() || !ritualCategory) return

    await supabase.from('rituals').insert({
      couple_id: me.couple_id,
      name: ritualName.trim(),
      category: ritualCategory,
      frequency: ritualFrequency.trim() || null,
      rating: ritualRating,
      improvement_note: ritualNote.trim() || null,
    })

    setRitualName('')
    setRitualCategory('')
    setRitualFrequency('')
    setRitualRating(null)
    setRitualNote('')
    setStep('home')
    loadData()
  }

  async function updateRating(ritual: Ritual, rating: number) {
    await supabase.from('rituals').update({ rating }).eq('id', ritual.id)
    setRituals(rituals.map(r => r.id === ritual.id ? { ...r, rating } : r))
  }

  async function deleteRitual(id: string) {
    await supabase.from('rituals').delete().eq('id', id)
    setRituals(rituals.filter(r => r.id !== id))
  }

  async function addGoal() {
    if (!me || !goalText.trim()) return

    const steps = goalSteps.split('\n').map(s => s.trim()).filter(Boolean)

    await supabase.from('shared_goals').insert({
      couple_id: me.couple_id,
      goal: goalText.trim(),
      action_steps: steps,
      target_date: goalDate || null,
    })

    setGoalText('')
    setGoalSteps('')
    setGoalDate('')
    setStep('home')
    loadData()
  }

  async function toggleGoalStatus(goal: SharedGoal) {
    const newStatus = goal.status === 'active' ? 'completed' : 'active'
    await supabase.from('shared_goals').update({ status: newStatus }).eq('id', goal.id)
    setGoals(goals.map(g => g.id === goal.id ? { ...g, status: newStatus } : g))
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-hand" style={{ fontSize: 24, color: '#A09485' }}>rituals</span>
      </div>
    )
  }

  const grouped: Record<string, Ritual[]> = {}
  rituals.forEach(r => {
    if (!grouped[r.category]) grouped[r.category] = []
    grouped[r.category].push(r)
  })

  const avgRating = rituals.length > 0
    ? Math.round(rituals.reduce((sum, r) => sum + (r.rating || 0), 0) / rituals.filter(r => r.rating).length * 10) / 10
    : 0

  return (
    <div style={{ maxWidth: 448, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 className="font-hand" style={{ fontSize: 32, fontWeight: 400, color: '#2C2C2C' }}>
          rituals of connection
        </h1>
        <p style={{ fontSize: 14, color: '#A09485', fontWeight: 300, marginTop: 4 }}>
          the small things done often that hold you together
        </p>
      </div>

      {step === 'home' && (
        <div>
          {/* Avg rating */}
          {rituals.length > 0 && (
            <div style={{
              textAlign: 'center', marginBottom: 28,
              paddingTop: 20, paddingBottom: 20,
              borderTop: '1px solid #E5E0DA', borderBottom: '1px solid #E5E0DA',
            }}>
              <p style={{ fontSize: 48, fontWeight: 200, color: '#2C2C2C', margin: 0, lineHeight: 1 }}>
                {avgRating || '—'}
              </p>
              <p style={{ fontSize: 13, color: '#A09485', marginTop: 6 }}>
                avg intentionality ({rituals.length} rituals tracked)
              </p>
            </div>
          )}

          {rituals.length === 0 && (
            <div style={{
              background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
              padding: 24, marginBottom: 20,
            }}>
              <p style={{ fontSize: 14, color: '#2C2C2C', lineHeight: 1.7, margin: 0 }}>
                Gottman says every couple has rituals, whether they know it or not. How you say goodbye in the morning. How you greet each other at the end of the day. What you do before bed. Name them. Rate how intentional you are about them. Then make them better.
              </p>
            </div>
          )}

          {/* Rituals by category */}
          {RITUAL_CATEGORIES.map((cat) => {
            const items = grouped[cat.key]
            if (!items || items.length === 0) return null
            return (
              <div key={cat.key} style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: '#A09485', marginBottom: 8 }}>
                  {cat.emoji} {cat.label}
                </p>
                {items.map((ritual) => (
                  <div key={ritual.id} style={{
                    background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 12,
                    padding: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, color: '#2C2C2C', margin: 0, fontWeight: 500 }}>{ritual.name}</p>
                      {ritual.frequency && (
                        <p style={{ fontSize: 11, color: '#A09485', margin: '2px 0 0' }}>{ritual.frequency}</p>
                      )}
                      {ritual.improvement_note && (
                        <p style={{ fontSize: 11, color: '#8B7355', margin: '4px 0 0', fontStyle: 'italic' }}>{ritual.improvement_note}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => updateRating(ritual, n)}
                          style={{
                            width: 24, height: 24, borderRadius: '50%', fontSize: 10,
                            border: 'none', cursor: 'pointer',
                            background: ritual.rating && n <= ritual.rating ? '#5E8B6A' : '#E5E0DA',
                            color: ritual.rating && n <= ritual.rating ? '#FFFFFF' : '#A09485',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => deleteRitual(ritual.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                        color: '#C4BDB4', fontSize: 14,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )
          })}

          {/* Action buttons */}
          <button
            onClick={() => setStep('add-ritual')}
            style={{
              width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 500,
              color: 'white', background: '#5E8B6A',
              border: 'none', borderRadius: 999, cursor: 'pointer', marginBottom: 10,
            }}
          >
            add a ritual
          </button>

          {/* Shared Goals Section */}
          <div style={{ marginTop: 32 }}>
            <p className="font-hand" style={{ fontSize: 20, color: '#8B7355', marginBottom: 14 }}>
              shared goals
            </p>

            {goals.filter(g => g.status === 'active').length === 0 && (
              <p style={{ fontSize: 13, color: '#A09485', marginBottom: 14, lineHeight: 1.5 }}>
                what are you building together? name it. break it down. track it.
              </p>
            )}

            {goals.filter(g => g.status === 'active').map((goal) => (
              <div key={goal.id} style={{
                background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 12,
                padding: 14, marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <button
                    onClick={() => toggleGoalStatus(goal)}
                    style={{
                      width: 20, height: 20, borderRadius: '50%', marginTop: 2,
                      border: '1.5px solid #E5E0DA', background: 'transparent',
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, color: '#2C2C2C', margin: 0, fontWeight: 500 }}>{goal.goal}</p>
                    {goal.target_date && (
                      <p style={{ fontSize: 11, color: '#A09485', margin: '4px 0 0' }}>
                        target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    {goal.action_steps.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {goal.action_steps.map((s, i) => (
                          <p key={i} style={{ fontSize: 12, color: '#8B7355', margin: '2px 0', paddingLeft: 8, borderLeft: '2px solid #E5E0DA' }}>
                            {s}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {goals.filter(g => g.status === 'completed').length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, color: '#C4BDB4', marginBottom: 8 }}>completed</p>
                {goals.filter(g => g.status === 'completed').map((goal) => (
                  <div key={goal.id} style={{
                    background: '#FAF8F5', border: '1px solid #E5E0DA', borderRadius: 12,
                    padding: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <button
                      onClick={() => toggleGoalStatus(goal)}
                      style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: 'none', background: '#5E8B6A',
                        cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#FFFFFF" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <p style={{ fontSize: 13, color: '#A09485', margin: 0, textDecoration: 'line-through' }}>{goal.goal}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep('add-goal')}
              style={{
                width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 500,
                color: '#5E8B6A', background: 'transparent',
                border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer', marginTop: 12,
              }}
            >
              add a shared goal
            </button>
          </div>
        </div>
      )}

      {/* Add Ritual Form */}
      {step === 'add-ritual' && (
        <div>
          <button
            onClick={() => setStep('home')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 13, fontWeight: 500, color: '#5E8B6A',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20,
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#5E8B6A" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            back
          </button>

          <div style={{ marginBottom: 24 }}>
            <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>name this ritual</p>
            <input
              type="text"
              value={ritualName}
              onChange={(e) => setRitualName(e.target.value)}
              placeholder="e.g., morning coffee together, 6-second kiss..."
              style={{
                width: '100%', fontSize: 14, padding: '10px 0', color: '#2C2C2C',
                border: 'none', borderBottom: '1px solid #E5E0DA', background: 'transparent',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>category</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {RITUAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setRitualCategory(ritualCategory === cat.key ? '' : cat.key)}
                  style={{
                    padding: '6px 14px', fontSize: 12, borderRadius: 999, cursor: 'pointer',
                    background: ritualCategory === cat.key ? '#5E8B6A' : 'transparent',
                    color: ritualCategory === cat.key ? '#FFFFFF' : '#2C2C2C',
                    border: ritualCategory === cat.key ? 'none' : '1px solid #E5E0DA',
                  }}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>how often?</p>
            <input
              type="text"
              value={ritualFrequency}
              onChange={(e) => setRitualFrequency(e.target.value)}
              placeholder="e.g., daily, every morning, Sundays..."
              style={{
                width: '100%', fontSize: 14, padding: '10px 0', color: '#2C2C2C',
                border: 'none', borderBottom: '1px solid #E5E0DA', background: 'transparent',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>how intentional are we? (1-5)</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRitualRating(ritualRating === n ? null : n)}
                  style={{
                    width: 40, height: 40, borderRadius: '50%', fontSize: 14, fontWeight: 500,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: ritualRating === n ? '#5E8B6A' : 'transparent',
                    color: ritualRating === n ? '#FFFFFF' : '#2C2C2C',
                    border: ritualRating === n ? 'none' : '1px solid #E5E0DA',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>what would make it better?</p>
            <textarea
              value={ritualNote}
              onChange={(e) => setRitualNote(e.target.value)}
              placeholder="optional..."
              style={{
                width: '100%', height: 80, fontSize: 14, color: '#2C2C2C', lineHeight: 1.6,
                border: '1px solid #E5E0DA', borderRadius: 12, padding: 12,
                background: '#FFFFFF', outline: 'none', resize: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={addRitual}
            disabled={!ritualName.trim() || !ritualCategory}
            style={{
              width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 500,
              color: 'white',
              background: (!ritualName.trim() || !ritualCategory) ? '#B8CCBE' : '#5E8B6A',
              border: 'none', borderRadius: 999, cursor: 'pointer',
            }}
          >
            save ritual
          </button>
        </div>
      )}

      {/* Add Goal Form */}
      {step === 'add-goal' && (
        <div>
          <button
            onClick={() => setStep('home')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 13, fontWeight: 500, color: '#5E8B6A',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20,
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#5E8B6A" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            back
          </button>

          <div style={{ marginBottom: 24 }}>
            <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>what is the goal?</p>
            <input
              type="text"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="e.g., weekly date night, save for a trip..."
              style={{
                width: '100%', fontSize: 14, padding: '10px 0', color: '#2C2C2C',
                border: 'none', borderBottom: '1px solid #E5E0DA', background: 'transparent',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>action steps</p>
            <textarea
              value={goalSteps}
              onChange={(e) => setGoalSteps(e.target.value)}
              placeholder="one step per line..."
              style={{
                width: '100%', height: 100, fontSize: 14, color: '#2C2C2C', lineHeight: 1.6,
                border: '1px solid #E5E0DA', borderRadius: 12, padding: 12,
                background: '#FFFFFF', outline: 'none', resize: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>target date</p>
            <input
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              style={{
                width: '100%', fontSize: 14, padding: '10px 0', color: '#2C2C2C',
                border: 'none', borderBottom: '1px solid #E5E0DA', background: 'transparent',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={addGoal}
            disabled={!goalText.trim()}
            style={{
              width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 500,
              color: 'white',
              background: !goalText.trim() ? '#B8CCBE' : '#5E8B6A',
              border: 'none', borderRadius: 999, cursor: 'pointer',
            }}
          >
            save goal
          </button>
        </div>
      )}
    </div>
  )
}
