'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { getCurrentPartner, getOtherPartner } from '@/lib/partner'
import type { Partner } from '@/lib/types'

interface GridlockIssue {
  id: string
  couple_id: string
  created_by: string
  topic: string
  created_at: string
}

interface GridlockPosition {
  id: string
  issue_id: string
  partner_id: string
  position: string
  dream_behind: string
  flexible_on: string | null
  pain_level: number
  updated_at: string
}

export default function GridlockPage() {
  const supabase = createClient()
  const [me, setMe] = useState<Partner | null>(null)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [step, setStep] = useState<'home' | 'new' | 'respond' | 'view'>('home')
  const [issues, setIssues] = useState<GridlockIssue[]>([])
  const [positions, setPositions] = useState<GridlockPosition[]>([])
  const [loading, setLoading] = useState(true)

  // New issue form
  const [newTopic, setNewTopic] = useState('')

  // Response form
  const [activeIssue, setActiveIssue] = useState<GridlockIssue | null>(null)
  const [myPosition, setMyPosition] = useState('')
  const [dreamBehind, setDreamBehind] = useState('')
  const [flexibleOn, setFlexibleOn] = useState('')
  const [painLevel, setPainLevel] = useState(3)

  // View issue
  const [viewIssue, setViewIssue] = useState<GridlockIssue | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const myPartner = await getCurrentPartner()
    if (!myPartner) return
    setMe(myPartner)

    const other = await getOtherPartner(myPartner.id)
    if (other) setPartner(other)

    const { data: issueData } = await supabase
      .from('gridlock_issues')
      .select('*')
      .eq('couple_id', myPartner.couple_id)
      .order('created_at', { ascending: false })

    if (issueData) setIssues(issueData)

    const { data: posData } = await supabase
      .from('gridlock_positions')
      .select('*')

    if (posData) setPositions(posData)

    setLoading(false)
  }

  async function createIssue() {
    if (!me || !newTopic.trim()) return

    await supabase.from('gridlock_issues').insert({
      couple_id: me.couple_id,
      created_by: me.id,
      topic: newTopic.trim(),
    })

    setNewTopic('')
    setStep('home')
    loadData()
  }

  async function submitPosition() {
    if (!me || !activeIssue || !myPosition.trim() || !dreamBehind.trim()) return

    await supabase.from('gridlock_positions').upsert({
      issue_id: activeIssue.id,
      partner_id: me.id,
      position: myPosition.trim(),
      dream_behind: dreamBehind.trim(),
      flexible_on: flexibleOn.trim() || null,
      pain_level: painLevel,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'issue_id,partner_id' })

    setMyPosition('')
    setDreamBehind('')
    setFlexibleOn('')
    setPainLevel(3)
    setActiveIssue(null)
    setStep('home')
    loadData()
  }

  function getPositionsForIssue(issueId: string) {
    return positions.filter(p => p.issue_id === issueId)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-hand" style={{ fontSize: 24, color: '#A09485' }}>gridlock</span>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 448, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 className="font-hand" style={{ fontSize: 32, fontWeight: 400, color: '#2C2C2C' }}>
          gridlock
        </h1>
        <p style={{ fontSize: 14, color: '#A09485', fontWeight: 300, marginTop: 4 }}>
          the things that never fully resolve
        </p>
      </div>

      {step === 'home' && (
        <div>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
            padding: 20, marginBottom: 20,
          }}>
            <p style={{ fontSize: 13, color: '#2C2C2C', lineHeight: 1.7, margin: 0 }}>
              Gottman found that 69% of couple conflicts are perpetual. They never get fully solved, and that is normal. The goal is not to fix them but to have an ongoing dialogue about them. Name the issue, share the dream behind your position, and find where you can be gentle with each other.
            </p>
          </div>

          <button
            onClick={() => setStep('new')}
            style={{
              width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 500,
              color: 'white', background: '#5E8B6A',
              border: 'none', borderRadius: 999, cursor: 'pointer', marginBottom: 20,
            }}
          >
            name a perpetual issue
          </button>

          {/* Issues list */}
          {issues.map((issue) => {
            const issuePositions = getPositionsForIssue(issue.id)
            const myPos = issuePositions.find(p => p.partner_id === me?.id)
            const partnerPos = issuePositions.find(p => p.partner_id !== me?.id)
            const bothShared = myPos && partnerPos

            return (
              <div key={issue.id} style={{
                background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
                padding: 16, marginBottom: 10,
              }}>
                <p style={{ fontSize: 15, color: '#2C2C2C', margin: 0, fontWeight: 500 }}>{issue.topic}</p>

                {/* Pain level indicators */}
                {bothShared && (
                  <div style={{ display: 'flex', gap: 12, margin: '10px 0' }}>
                    <span style={{ fontSize: 11, color: '#A09485' }}>
                      your pain: {myPos.pain_level}/5
                    </span>
                    <span style={{ fontSize: 11, color: '#A09485' }}>
                      {partner?.name}&apos;s pain: {partnerPos.pain_level}/5
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {!myPos && (
                    <button
                      onClick={() => { setActiveIssue(issue); setStep('respond') }}
                      style={{
                        flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 500,
                        color: 'white', background: '#5E8B6A',
                        border: 'none', borderRadius: 999, cursor: 'pointer',
                      }}
                    >
                      share your side
                    </button>
                  )}
                  {myPos && !partnerPos && (
                    <p style={{ fontSize: 13, color: '#A09485' }}>
                      waiting for {partner?.name || 'your partner'}...
                    </p>
                  )}
                  {bothShared && (
                    <button
                      onClick={() => { setViewIssue(issue); setStep('view') }}
                      style={{
                        flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 500,
                        color: '#5E8B6A', background: 'transparent',
                        border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer',
                      }}
                    >
                      view dialogue
                    </button>
                  )}
                  {myPos && (
                    <button
                      onClick={() => { setActiveIssue(issue); setMyPosition(myPos.position); setDreamBehind(myPos.dream_behind); setFlexibleOn(myPos.flexible_on || ''); setPainLevel(myPos.pain_level); setStep('respond') }}
                      style={{
                        flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 500,
                        color: '#8B7355', background: 'transparent',
                        border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer',
                      }}
                    >
                      update
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Issue */}
      {step === 'new' && (
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

          <p className="font-hand" style={{ fontSize: 20, color: '#8B7355', marginBottom: 16 }}>
            what is the perpetual issue?
          </p>
          <p style={{ fontSize: 13, color: '#A09485', marginBottom: 16, lineHeight: 1.5 }}>
            the one that keeps coming back. not because either of you is wrong, but because you are different people with different histories and dreams.
          </p>
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="e.g., how we spend free time, cleanliness standards..."
            style={{
              width: '100%', fontSize: 14, padding: '10px 0', color: '#2C2C2C',
              border: 'none', borderBottom: '1px solid #E5E0DA', background: 'transparent',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            onClick={createIssue}
            disabled={!newTopic.trim()}
            style={{
              width: '100%', marginTop: 24, padding: '14px 0', fontSize: 14, fontWeight: 500,
              color: 'white',
              background: !newTopic.trim() ? '#B8CCBE' : '#5E8B6A',
              border: 'none', borderRadius: 999, cursor: 'pointer',
            }}
          >
            save
          </button>
        </div>
      )}

      {/* Respond / Update Position */}
      {step === 'respond' && activeIssue && (
        <div>
          <button
            onClick={() => { setStep('home'); setActiveIssue(null) }}
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

          <p className="font-hand" style={{ fontSize: 20, color: '#2C2C2C', marginBottom: 24 }}>
            {activeIssue.topic}
          </p>

          <div style={{ marginBottom: 24 }}>
            <p className="font-hand" style={{ fontSize: 16, color: '#8B7355', marginBottom: 10 }}>my position</p>
            <textarea
              value={myPosition}
              onChange={(e) => setMyPosition(e.target.value)}
              placeholder="what you want or believe about this..."
              style={{
                width: '100%', height: 80, fontSize: 14, color: '#2C2C2C', lineHeight: 1.6,
                border: '1px solid #E5E0DA', borderRadius: 12, padding: 12,
                background: '#FFFFFF', outline: 'none', resize: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <p className="font-hand" style={{ fontSize: 16, color: '#8B7355', marginBottom: 10 }}>the dream behind it</p>
            <p style={{ fontSize: 12, color: '#A09485', marginBottom: 8, lineHeight: 1.4 }}>
              what value, hope, or history makes this matter so much to you?
            </p>
            <textarea
              value={dreamBehind}
              onChange={(e) => setDreamBehind(e.target.value)}
              placeholder="the deeper reason this matters..."
              style={{
                width: '100%', height: 80, fontSize: 14, color: '#2C2C2C', lineHeight: 1.6,
                border: '1px solid #E5E0DA', borderRadius: 12, padding: 12,
                background: '#FFFFFF', outline: 'none', resize: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <p className="font-hand" style={{ fontSize: 16, color: '#8B7355', marginBottom: 10 }}>where can you flex?</p>
            <textarea
              value={flexibleOn}
              onChange={(e) => setFlexibleOn(e.target.value)}
              placeholder="optional: what part of this can you bend on..."
              style={{
                width: '100%', height: 60, fontSize: 14, color: '#2C2C2C', lineHeight: 1.6,
                border: '1px solid #E5E0DA', borderRadius: 12, padding: 12,
                background: '#FFFFFF', outline: 'none', resize: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <p className="font-hand" style={{ fontSize: 16, color: '#8B7355', marginBottom: 12 }}>
              current pain level ({painLevel}/5)
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setPainLevel(n)}
                  style={{
                    width: 40, height: 40, borderRadius: '50%', fontSize: 14, fontWeight: 500,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: painLevel === n ? '#5E8B6A' : 'transparent',
                    color: painLevel === n ? '#FFFFFF' : '#2C2C2C',
                    border: painLevel === n ? 'none' : '1px solid #E5E0DA',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#A09485', marginTop: 6 }}>
              <span>mild tension</span><span>deep pain</span>
            </div>
          </div>

          <button
            onClick={submitPosition}
            disabled={!myPosition.trim() || !dreamBehind.trim()}
            style={{
              width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 500,
              color: 'white',
              background: (!myPosition.trim() || !dreamBehind.trim()) ? '#B8CCBE' : '#5E8B6A',
              border: 'none', borderRadius: 999, cursor: 'pointer',
            }}
          >
            save
          </button>
        </div>
      )}

      {/* View Dialogue */}
      {step === 'view' && viewIssue && (
        <div>
          <button
            onClick={() => { setStep('home'); setViewIssue(null) }}
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

          <p className="font-hand" style={{ fontSize: 22, color: '#2C2C2C', marginBottom: 24 }}>
            {viewIssue.topic}
          </p>

          {(() => {
            const issuePositions = getPositionsForIssue(viewIssue.id)
            const myPos = issuePositions.find(p => p.partner_id === me?.id)
            const partnerPos = issuePositions.find(p => p.partner_id !== me?.id)

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'you', pos: myPos },
                  { label: partner?.name || 'your partner', pos: partnerPos },
                ].map(({ label, pos }) => pos && (
                  <div key={label} style={{
                    background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
                    padding: 16,
                  }}>
                    <p className="font-hand" style={{ fontSize: 16, color: '#8B7355', marginBottom: 10 }}>{label}</p>
                    <p style={{ fontSize: 13, color: '#A09485', margin: '0 0 4px' }}>
                      position: <strong style={{ color: '#2C2C2C' }}>{pos.position}</strong>
                    </p>
                    <p style={{ fontSize: 13, color: '#A09485', margin: '8px 0 4px' }}>
                      dream behind it: <strong style={{ color: '#2C2C2C' }}>{pos.dream_behind}</strong>
                    </p>
                    {pos.flexible_on && (
                      <p style={{ fontSize: 13, color: '#A09485', margin: '8px 0 4px' }}>
                        flexible on: <strong style={{ color: '#2C2C2C' }}>{pos.flexible_on}</strong>
                      </p>
                    )}
                    <p style={{ fontSize: 12, color: '#A09485', marginTop: 10 }}>
                      pain level: {pos.pain_level}/5 &middot; updated {new Date(pos.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}

                <div style={{
                  background: '#FAF8F5', border: '1px solid #E5E0DA', borderRadius: 12,
                  padding: 16, textAlign: 'center',
                }}>
                  <p style={{ fontSize: 13, color: '#8B7355', lineHeight: 1.6, margin: 0 }}>
                    revisit this monthly. check in: has anything shifted? is there new understanding? has the pain changed?
                  </p>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
