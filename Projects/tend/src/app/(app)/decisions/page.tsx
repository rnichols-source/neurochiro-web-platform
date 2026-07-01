'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { getCurrentPartner, getOtherPartner } from '@/lib/partner'
import type { Partner } from '@/lib/types'

interface Decision {
  id: string
  couple_id: string
  created_by: string
  topic: string
  status: string
  created_at: string
}

interface DecisionResponse {
  id: string
  decision_id: string
  partner_id: string
  importance: number
  flexibility: number
  perspective: string
  core_need: string | null
  created_at: string
}

export default function DecisionsPage() {
  const supabase = createClient()
  const [me, setMe] = useState<Partner | null>(null)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [step, setStep] = useState<'home' | 'new' | 'respond' | 'dream'>('home')
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [responses, setResponses] = useState<DecisionResponse[]>([])
  const [loading, setLoading] = useState(true)

  // New decision form
  const [newTopic, setNewTopic] = useState('')

  // Response form
  const [activeDecision, setActiveDecision] = useState<Decision | null>(null)
  const [importance, setImportance] = useState(5)
  const [flexibility, setFlexibility] = useState(5)
  const [perspective, setPerspective] = useState('')
  const [coreNeed, setCoreNeed] = useState('')

  // Dream within conflict
  const [dreamTopic, setDreamTopic] = useState('')
  const [dreamMeaning, setDreamMeaning] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const myPartner = await getCurrentPartner()
    if (!myPartner) return
    setMe(myPartner)

    const other = await getOtherPartner(myPartner.id)
    if (other) setPartner(other)

    const { data: decs } = await supabase
      .from('decisions')
      .select('*')
      .eq('couple_id', myPartner.couple_id)
      .order('created_at', { ascending: false })

    if (decs) setDecisions(decs)

    const { data: resps } = await supabase
      .from('decision_responses')
      .select('*')

    if (resps) setResponses(resps)

    setLoading(false)
  }

  async function createDecision() {
    if (!me || !newTopic.trim()) return

    await supabase.from('decisions').insert({
      couple_id: me.couple_id,
      created_by: me.id,
      topic: newTopic.trim(),
    })

    setNewTopic('')
    setStep('home')
    loadData()
  }

  async function submitResponse() {
    if (!me || !activeDecision || !perspective.trim()) return

    await supabase.from('decision_responses').upsert({
      decision_id: activeDecision.id,
      partner_id: me.id,
      importance,
      flexibility,
      perspective: perspective.trim(),
      core_need: coreNeed.trim() || null,
    }, { onConflict: 'decision_id,partner_id' })

    setImportance(5)
    setFlexibility(5)
    setPerspective('')
    setCoreNeed('')
    setActiveDecision(null)
    setStep('home')
    loadData()
  }

  async function resolveDecision(id: string) {
    await supabase.from('decisions').update({ status: 'resolved' }).eq('id', id)
    loadData()
  }

  function getResponsesForDecision(decisionId: string) {
    return responses.filter(r => r.decision_id === decisionId)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-hand" style={{ fontSize: 24, color: '#A09485' }}>decisions</span>
      </div>
    )
  }

  const openDecisions = decisions.filter(d => d.status === 'open')
  const resolvedDecisions = decisions.filter(d => d.status === 'resolved')

  return (
    <div style={{ maxWidth: 448, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 className="font-hand" style={{ fontSize: 32, fontWeight: 400, color: '#2C2C2C' }}>
          decisions together
        </h1>
        <p style={{ fontSize: 14, color: '#A09485', fontWeight: 300, marginTop: 4 }}>
          share power, honor each other&apos;s dreams
        </p>
      </div>

      {step === 'home' && (
        <div>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
            padding: 20, marginBottom: 20,
          }}>
            <p style={{ fontSize: 13, color: '#2C2C2C', lineHeight: 1.7, margin: 0 }}>
              Gottman found that couples who accept influence from each other are happier and more stable. When a decision needs making, share your perspective, rate how important it is to you, and find where you can flex.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <button
              onClick={() => setStep('new')}
              style={{
                flex: 1, padding: '14px 0', fontSize: 14, fontWeight: 500,
                color: 'white', background: '#5E8B6A',
                border: 'none', borderRadius: 999, cursor: 'pointer',
              }}
            >
              new decision
            </button>
            <button
              onClick={() => setStep('dream')}
              style={{
                flex: 1, padding: '14px 0', fontSize: 14, fontWeight: 500,
                color: '#8B7355', background: 'transparent',
                border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer',
              }}
            >
              dream dialogue
            </button>
          </div>

          {/* Open decisions */}
          {openDecisions.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>open</p>
              {openDecisions.map((dec) => {
                const decResps = getResponsesForDecision(dec.id)
                const myResp = decResps.find(r => r.partner_id === me?.id)
                const partnerResp = decResps.find(r => r.partner_id !== me?.id)
                const bothResponded = myResp && partnerResp

                return (
                  <div key={dec.id} style={{
                    background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
                    padding: 16, marginBottom: 10,
                  }}>
                    <p style={{ fontSize: 15, color: '#2C2C2C', margin: 0, fontWeight: 500 }}>{dec.topic}</p>
                    <p style={{ fontSize: 11, color: '#C4BDB4', margin: '4px 0 12px' }}>
                      {new Date(dec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>

                    {!myResp && (
                      <button
                        onClick={() => { setActiveDecision(dec); setStep('respond') }}
                        style={{
                          padding: '10px 20px', fontSize: 13, fontWeight: 500,
                          color: 'white', background: '#5E8B6A',
                          border: 'none', borderRadius: 999, cursor: 'pointer',
                        }}
                      >
                        share your perspective
                      </button>
                    )}

                    {myResp && !partnerResp && (
                      <p style={{ fontSize: 13, color: '#A09485' }}>
                        waiting for {partner?.name || 'your partner'}...
                      </p>
                    )}

                    {bothResponded && (
                      <div>
                        {/* Two-circle visualization */}
                        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <p style={{ fontSize: 12, color: '#A09485', marginBottom: 8 }}>you</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: '50%',
                                  background: '#5E8B6A', color: 'white', fontSize: 13, fontWeight: 500,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {myResp.importance}
                                </div>
                                <p style={{ fontSize: 9, color: '#A09485', marginTop: 3 }}>importance</p>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: '50%',
                                  background: '#8B7355', color: 'white', fontSize: 13, fontWeight: 500,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {myResp.flexibility}
                                </div>
                                <p style={{ fontSize: 9, color: '#A09485', marginTop: 3 }}>flexibility</p>
                              </div>
                            </div>
                            <p style={{ fontSize: 12, color: '#2C2C2C', lineHeight: 1.4 }}>{myResp.perspective}</p>
                            {myResp.core_need && (
                              <p style={{ fontSize: 11, color: '#8B7355', marginTop: 4, fontStyle: 'italic' }}>core need: {myResp.core_need}</p>
                            )}
                          </div>

                          <div style={{ width: 1, background: '#E5E0DA' }} />

                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <p style={{ fontSize: 12, color: '#A09485', marginBottom: 8 }}>{partner?.name}</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: '50%',
                                  background: '#5E8B6A', color: 'white', fontSize: 13, fontWeight: 500,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {partnerResp.importance}
                                </div>
                                <p style={{ fontSize: 9, color: '#A09485', marginTop: 3 }}>importance</p>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: '50%',
                                  background: '#8B7355', color: 'white', fontSize: 13, fontWeight: 500,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {partnerResp.flexibility}
                                </div>
                                <p style={{ fontSize: 9, color: '#A09485', marginTop: 3 }}>flexibility</p>
                              </div>
                            </div>
                            <p style={{ fontSize: 12, color: '#2C2C2C', lineHeight: 1.4 }}>{partnerResp.perspective}</p>
                            {partnerResp.core_need && (
                              <p style={{ fontSize: 11, color: '#8B7355', marginTop: 4, fontStyle: 'italic' }}>core need: {partnerResp.core_need}</p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => resolveDecision(dec.id)}
                          style={{
                            width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 500,
                            color: '#5E8B6A', background: 'transparent',
                            border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer',
                          }}
                        >
                          mark as resolved
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Resolved */}
          {resolvedDecisions.length > 0 && (
            <div>
              <p className="font-hand" style={{ fontSize: 16, color: '#C4BDB4', marginBottom: 10 }}>resolved</p>
              {resolvedDecisions.slice(0, 5).map((dec) => (
                <div key={dec.id} style={{
                  background: '#FAF8F5', border: '1px solid #E5E0DA', borderRadius: 12,
                  padding: 12, marginBottom: 6,
                }}>
                  <p style={{ fontSize: 13, color: '#A09485', margin: 0 }}>{dec.topic}</p>
                  <p style={{ fontSize: 11, color: '#C4BDB4', margin: '4px 0 0' }}>
                    {new Date(dec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Decision */}
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

          <p className="font-hand" style={{ fontSize: 20, color: '#8B7355', marginBottom: 16 }}>what needs deciding?</p>
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="e.g., where to spend the holidays, budget for the kitchen..."
            style={{
              width: '100%', fontSize: 14, padding: '10px 0', color: '#2C2C2C',
              border: 'none', borderBottom: '1px solid #E5E0DA', background: 'transparent',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            onClick={createDecision}
            disabled={!newTopic.trim()}
            style={{
              width: '100%', marginTop: 24, padding: '14px 0', fontSize: 14, fontWeight: 500,
              color: 'white',
              background: !newTopic.trim() ? '#B8CCBE' : '#5E8B6A',
              border: 'none', borderRadius: 999, cursor: 'pointer',
            }}
          >
            create
          </button>
        </div>
      )}

      {/* Respond to Decision */}
      {step === 'respond' && activeDecision && (
        <div>
          <button
            onClick={() => { setStep('home'); setActiveDecision(null) }}
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
            {activeDecision.topic}
          </p>

          <div style={{ marginBottom: 28 }}>
            <p className="font-hand" style={{ fontSize: 16, color: '#8B7355', marginBottom: 12 }}>
              how important is this to you? ({importance}/10)
            </p>
            <input
              type="range" min={1} max={10} value={importance}
              onChange={(e) => setImportance(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#A09485' }}>
              <span>not very</span><span>extremely</span>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <p className="font-hand" style={{ fontSize: 16, color: '#8B7355', marginBottom: 12 }}>
              how flexible are you? ({flexibility}/10)
            </p>
            <input
              type="range" min={1} max={10} value={flexibility}
              onChange={(e) => setFlexibility(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#A09485' }}>
              <span>firm</span><span>very flexible</span>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <p className="font-hand" style={{ fontSize: 16, color: '#8B7355', marginBottom: 12 }}>your perspective</p>
            <textarea
              value={perspective}
              onChange={(e) => setPerspective(e.target.value)}
              placeholder="what you think and why..."
              style={{
                width: '100%', height: 100, fontSize: 14, color: '#2C2C2C', lineHeight: 1.6,
                border: '1px solid #E5E0DA', borderRadius: 12, padding: 12,
                background: '#FFFFFF', outline: 'none', resize: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <p className="font-hand" style={{ fontSize: 16, color: '#8B7355', marginBottom: 12 }}>
              what is the core need underneath?
            </p>
            <input
              type="text"
              value={coreNeed}
              onChange={(e) => setCoreNeed(e.target.value)}
              placeholder="optional: the deeper thing this is really about..."
              style={{
                width: '100%', fontSize: 14, padding: '10px 0', color: '#2C2C2C',
                border: 'none', borderBottom: '1px solid #E5E0DA', background: 'transparent',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={submitResponse}
            disabled={!perspective.trim()}
            style={{
              width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 500,
              color: 'white',
              background: !perspective.trim() ? '#B8CCBE' : '#5E8B6A',
              border: 'none', borderRadius: 999, cursor: 'pointer',
            }}
          >
            submit
          </button>
        </div>
      )}

      {/* Dream Within Conflict */}
      {step === 'dream' && (
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

          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
            padding: 20, marginBottom: 24,
          }}>
            <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 8 }}>the dream within the conflict</p>
            <p style={{ fontSize: 13, color: '#A09485', lineHeight: 1.6, margin: 0 }}>
              Gottman says behind every position in a conflict is a dream. When you keep bumping up against the same disagreement, ask: what does this mean to you on a deeper level? Sit together and take turns sharing.
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <p className="font-hand" style={{ fontSize: 16, color: '#8B7355', marginBottom: 12 }}>
              what is the recurring disagreement?
            </p>
            <input
              type="text"
              value={dreamTopic}
              onChange={(e) => setDreamTopic(e.target.value)}
              placeholder="the thing you keep coming back to..."
              style={{
                width: '100%', fontSize: 14, padding: '10px 0', color: '#2C2C2C',
                border: 'none', borderBottom: '1px solid #E5E0DA', background: 'transparent',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{
            background: '#FAF8F5', border: '1px solid #E5E0DA', borderRadius: 12,
            padding: 16, marginBottom: 16,
          }}>
            <p className="font-hand" style={{ fontSize: 15, color: '#8B7355', marginBottom: 10 }}>conversation prompts</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Tell me the story of why this matters to you.',
                'What does this connect to from your childhood or past?',
                'What would it mean if you got what you wanted here?',
                'What is the dream or wish behind your position?',
                'Is there a way we can honor both of our dreams?',
              ].map((prompt, i) => (
                <p key={i} style={{ fontSize: 13, color: '#2C2C2C', margin: 0, lineHeight: 1.5, paddingLeft: 12, borderLeft: '2px solid #5E8B6A' }}>
                  {prompt}
                </p>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#A09485', textAlign: 'center', lineHeight: 1.5 }}>
            the goal is not to solve it. the goal is to understand.
          </p>
        </div>
      )}
    </div>
  )
}
