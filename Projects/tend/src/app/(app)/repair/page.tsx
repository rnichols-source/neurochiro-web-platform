'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { getCurrentPartner, getOtherPartner } from '@/lib/partner'
import type { Partner } from '@/lib/types'

interface RepairEntry {
  id: string
  couple_id: string
  partner_id: string
  i_felt: string
  when_you: string
  what_i_needed: string
  created_at: string
}

interface FightDebrief {
  id: string
  couple_id: string
  partner_id: string
  emotions: string[]
  triggers: string[]
  deeper_meaning: string | null
  need_next_time: string | null
  partner_did_right: string | null
  debrief_date: string
  created_at: string
}

const REPAIR_PHRASES = [
  'I need to calm down',
  'Can I take that back?',
  'I am sorry',
  'I see your point',
  'Let me try again',
  'I appreciate you for...',
  'Can we take a break?',
  'I feel defensive, let me listen',
  'Tell me more about how you feel',
  'This is not about winning',
  'I love you even when we fight',
  'Let us find common ground',
]

const DEBRIEF_EMOTIONS = [
  'hurt', 'angry', 'sad', 'defensive', 'scared', 'shut down',
  'overwhelmed', 'misunderstood', 'alone', 'frustrated', 'ashamed', 'numb',
]

const DEBRIEF_TRIGGERS = [
  'feeling criticized', 'feeling ignored', 'feeling controlled',
  'feeling disrespected', 'feeling unloved', 'feeling unsafe',
  'past wounds surfacing', 'feeling like I do not matter',
  'feeling judged', 'feeling abandoned', 'exhaustion or stress',
]

export default function RepairPage() {
  const supabase = createClient()
  const [me, setMe] = useState<Partner | null>(null)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [step, setStep] = useState<'intro' | 'form' | 'sent' | 'view' | 'phrases' | 'phrase-sent' | 'debrief' | 'debrief-sent' | 'debrief-view'>('intro')
  const [iFelt, setIFelt] = useState('')
  const [whenYou, setWhenYou] = useState('')
  const [whatINeeded, setWhatINeeded] = useState('')
  const [myEntries, setMyEntries] = useState<RepairEntry[]>([])
  const [partnerEntries, setPartnerEntries] = useState<RepairEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Debrief state
  const [debriefEmotions, setDebriefEmotions] = useState<string[]>([])
  const [debriefTriggers, setDebriefTriggers] = useState<string[]>([])
  const [deeperMeaning, setDeeperMeaning] = useState('')
  const [needNextTime, setNeedNextTime] = useState('')
  const [partnerDidRight, setPartnerDidRight] = useState('')
  const [debriefStep, setDebriefStep] = useState(0)
  const [myDebriefs, setMyDebriefs] = useState<FightDebrief[]>([])
  const [partnerDebriefs, setPartnerDebriefs] = useState<FightDebrief[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const myPartner = await getCurrentPartner()
    if (!myPartner) return
    setMe(myPartner)

    const other = await getOtherPartner(myPartner.id)
    if (other) setPartner(other)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: entries } = await supabase
      .from('repair_entries')
      .select('*')
      .eq('couple_id', myPartner.couple_id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (entries) {
      setMyEntries(entries.filter((e: RepairEntry) => e.partner_id === myPartner.id))
      setPartnerEntries(entries.filter((e: RepairEntry) => e.partner_id !== myPartner.id))
    }

    const { data: debriefs } = await supabase
      .from('fight_debriefs')
      .select('*')
      .eq('couple_id', myPartner.couple_id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (debriefs) {
      setMyDebriefs(debriefs.filter((d: FightDebrief) => d.partner_id === myPartner.id))
      setPartnerDebriefs(debriefs.filter((d: FightDebrief) => d.partner_id !== myPartner.id))
    }

    setLoading(false)
  }

  async function handleSubmit() {
    if (!me || !iFelt.trim() || !whenYou.trim() || !whatINeeded.trim()) return

    await supabase.from('repair_entries').insert({
      couple_id: me.couple_id,
      partner_id: me.id,
      i_felt: iFelt.trim(),
      when_you: whenYou.trim(),
      what_i_needed: whatINeeded.trim(),
    })

    setStep('sent')
    setIFelt('')
    setWhenYou('')
    setWhatINeeded('')
    loadData()
  }

  async function sendRepairPhrase(phrase: string) {
    if (!me) return
    await supabase.from('repair_attempts').insert({
      couple_id: me.couple_id,
      partner_id: me.id,
      phrase,
    })
    setStep('phrase-sent')
  }

  async function submitDebrief() {
    if (!me || debriefEmotions.length === 0) return

    await supabase.from('fight_debriefs').insert({
      couple_id: me.couple_id,
      partner_id: me.id,
      emotions: debriefEmotions,
      triggers: debriefTriggers,
      deeper_meaning: deeperMeaning.trim() || null,
      need_next_time: needNextTime.trim() || null,
      partner_did_right: partnerDidRight.trim() || null,
    })

    setStep('debrief-sent')
    setDebriefEmotions([])
    setDebriefTriggers([])
    setDeeperMeaning('')
    setNeedNextTime('')
    setPartnerDidRight('')
    setDebriefStep(0)
    loadData()
  }

  function toggleItem(list: string[], item: string, setter: (v: string[]) => void) {
    if (list.includes(item)) setter(list.filter(i => i !== item))
    else setter([...list, item])
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-hand" style={{ fontSize: 24, color: '#A09485' }}>repair</span>
      </div>
    )
  }

  const feelings = ['hurt', 'frustrated', 'unheard', 'alone', 'anxious', 'dismissed', 'angry', 'sad', 'confused', 'overwhelmed']

  return (
    <div style={{ maxWidth: 448, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 className="font-hand" style={{ fontSize: 32, fontWeight: 400, color: '#2C2C2C' }}>
          rupture &amp; repair
        </h1>
        <p style={{ fontSize: 14, color: '#A09485', fontWeight: 300, marginTop: 4 }}>
          a safe way to say what needs to be said
        </p>
      </div>

      {step === 'intro' && (
        <div>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
            padding: 24, marginBottom: 16,
          }}>
            <p style={{ fontSize: 14, color: '#2C2C2C', lineHeight: 1.7, margin: 0 }}>
              When something is off between you two, this is a place to name it without the pressure of a face-to-face standoff. You each fill out three simple prompts. Then you read each other&apos;s words. No defensiveness. No interrupting. Just understanding.
            </p>
          </div>

          <button
            onClick={() => setStep('form')}
            style={{
              width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 500,
              color: 'white', background: '#5E8B6A',
              border: 'none', borderRadius: 999, cursor: 'pointer', marginBottom: 10,
            }}
          >
            start a repair
          </button>

          <button
            onClick={() => setStep('phrases')}
            style={{
              width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 500,
              color: '#5E8B6A', background: 'transparent',
              border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer', marginBottom: 10,
            }}
          >
            send a repair attempt
          </button>

          <button
            onClick={() => { setDebriefStep(0); setStep('debrief') }}
            style={{
              width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 500,
              color: '#8B7355', background: 'transparent',
              border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer', marginBottom: 10,
            }}
          >
            aftermath of a fight
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {(myEntries.length > 0 || partnerEntries.length > 0) && (
              <button
                onClick={() => setStep('view')}
                style={{
                  flex: 1, padding: '12px 0', fontSize: 13, fontWeight: 500,
                  color: '#A09485', background: 'transparent',
                  border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer',
                }}
              >
                recent repairs
              </button>
            )}
            {(myDebriefs.length > 0 || partnerDebriefs.length > 0) && (
              <button
                onClick={() => setStep('debrief-view')}
                style={{
                  flex: 1, padding: '12px 0', fontSize: 13, fontWeight: 500,
                  color: '#A09485', background: 'transparent',
                  border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer',
                }}
              >
                past debriefs
              </button>
            )}
          </div>
        </div>
      )}

      {step === 'form' && (
        <div>
          <div style={{ marginBottom: 28 }}>
            <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>
              I felt...
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {feelings.map((f) => (
                <button
                  key={f}
                  onClick={() => setIFelt(iFelt === f ? '' : f)}
                  style={{
                    padding: '6px 14px', fontSize: 13, borderRadius: 999, cursor: 'pointer',
                    background: iFelt === f ? '#5E8B6A' : 'transparent',
                    color: iFelt === f ? '#FFFFFF' : '#2C2C2C',
                    border: iFelt === f ? 'none' : '1px solid #E5E0DA',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={iFelt}
              onChange={(e) => setIFelt(e.target.value)}
              placeholder="or type your own..."
              style={{
                width: '100%', fontSize: 14, padding: '10px 0', color: '#2C2C2C',
                border: 'none', borderBottom: '1px solid #E5E0DA', background: 'transparent',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>
              when you...
            </p>
            <textarea
              value={whenYou}
              onChange={(e) => setWhenYou(e.target.value)}
              placeholder="describe what happened, not what you think they intended..."
              style={{
                width: '100%', height: 80, fontSize: 14, color: '#2C2C2C', lineHeight: 1.6,
                border: '1px solid #E5E0DA', borderRadius: 12, padding: 12,
                background: '#FFFFFF', outline: 'none', resize: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>
              what I needed was...
            </p>
            <textarea
              value={whatINeeded}
              onChange={(e) => setWhatINeeded(e.target.value)}
              placeholder="what would have helped in that moment..."
              style={{
                width: '100%', height: 80, fontSize: 14, color: '#2C2C2C', lineHeight: 1.6,
                border: '1px solid #E5E0DA', borderRadius: 12, padding: 12,
                background: '#FFFFFF', outline: 'none', resize: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setStep('intro')}
              style={{
                flex: 1, padding: '14px 0', fontSize: 14, fontWeight: 500,
                color: '#A09485', background: 'transparent',
                border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer',
              }}
            >
              cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!iFelt.trim() || !whenYou.trim() || !whatINeeded.trim()}
              style={{
                flex: 1, padding: '14px 0', fontSize: 14, fontWeight: 500,
                color: 'white',
                background: (!iFelt.trim() || !whenYou.trim() || !whatINeeded.trim()) ? '#B8CCBE' : '#5E8B6A',
                border: 'none', borderRadius: 999, cursor: 'pointer',
              }}
            >
              send
            </button>
          </div>
        </div>
      )}

      {step === 'sent' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
            padding: 32, marginBottom: 24,
          }}>
            <p className="font-hand" style={{ fontSize: 24, color: '#5E8B6A', marginBottom: 8 }}>sent</p>
            <p style={{ fontSize: 14, color: '#A09485', lineHeight: 1.6, margin: 0 }}>
              {partner?.name || 'Your partner'} will see this when they open the app.
              No pressure. Just honesty finding its way to the right place.
            </p>
          </div>
          <button
            onClick={() => setStep('intro')}
            style={{
              padding: '12px 32px', fontSize: 14, fontWeight: 500,
              color: '#5E8B6A', background: 'transparent',
              border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer',
            }}
          >
            done
          </button>
        </div>
      )}

      {/* Repair Attempt Phrases */}
      {step === 'phrases' && (
        <div>
          <button
            onClick={() => setStep('intro')}
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
            padding: 20, marginBottom: 20,
          }}>
            <p style={{ fontSize: 13, color: '#A09485', lineHeight: 1.6, margin: 0 }}>
              Gottman calls these &quot;repair attempts.&quot; Small bids to de-escalate during or after conflict. Tap one to send it to {partner?.name || 'your partner'}.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REPAIR_PHRASES.map((phrase) => (
              <button
                key={phrase}
                onClick={() => sendRepairPhrase(phrase)}
                style={{
                  padding: '14px 16px', fontSize: 14, color: '#2C2C2C',
                  background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 12,
                  cursor: 'pointer', textAlign: 'left', lineHeight: 1.4,
                }}
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'phrase-sent' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
            padding: 32, marginBottom: 24,
          }}>
            <p className="font-hand" style={{ fontSize: 24, color: '#5E8B6A', marginBottom: 8 }}>sent</p>
            <p style={{ fontSize: 14, color: '#A09485', lineHeight: 1.6, margin: 0 }}>
              a small bridge, sent with courage.
            </p>
          </div>
          <button
            onClick={() => setStep('intro')}
            style={{
              padding: '12px 32px', fontSize: 14, fontWeight: 500,
              color: '#5E8B6A', background: 'transparent',
              border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer',
            }}
          >
            done
          </button>
        </div>
      )}

      {/* Aftermath of a Fight - Debrief */}
      {step === 'debrief' && (
        <div>
          <button
            onClick={() => setStep('intro')}
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

          {/* Progress */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= debriefStep ? '#5E8B6A' : '#E5E0DA',
              }} />
            ))}
          </div>

          {debriefStep === 0 && (
            <div>
              <p className="font-hand" style={{ fontSize: 20, color: '#8B7355', marginBottom: 16 }}>
                how did you feel during the fight?
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DEBRIEF_EMOTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => toggleItem(debriefEmotions, e, setDebriefEmotions)}
                    style={{
                      padding: '8px 16px', fontSize: 13, borderRadius: 999, cursor: 'pointer',
                      background: debriefEmotions.includes(e) ? '#5E8B6A' : 'transparent',
                      color: debriefEmotions.includes(e) ? '#FFFFFF' : '#2C2C2C',
                      border: debriefEmotions.includes(e) ? 'none' : '1px solid #E5E0DA',
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setDebriefStep(1)}
                disabled={debriefEmotions.length === 0}
                style={{
                  width: '100%', marginTop: 24, padding: '14px 0', fontSize: 14, fontWeight: 500,
                  color: 'white',
                  background: debriefEmotions.length === 0 ? '#B8CCBE' : '#5E8B6A',
                  border: 'none', borderRadius: 999, cursor: 'pointer',
                }}
              >
                next
              </button>
            </div>
          )}

          {debriefStep === 1 && (
            <div>
              <p className="font-hand" style={{ fontSize: 20, color: '#8B7355', marginBottom: 16 }}>
                what triggered you?
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DEBRIEF_TRIGGERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleItem(debriefTriggers, t, setDebriefTriggers)}
                    style={{
                      padding: '8px 16px', fontSize: 13, borderRadius: 999, cursor: 'pointer',
                      background: debriefTriggers.includes(t) ? '#5E8B6A' : 'transparent',
                      color: debriefTriggers.includes(t) ? '#FFFFFF' : '#2C2C2C',
                      border: debriefTriggers.includes(t) ? 'none' : '1px solid #E5E0DA',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setDebriefStep(2)}
                style={{
                  width: '100%', marginTop: 24, padding: '14px 0', fontSize: 14, fontWeight: 500,
                  color: 'white', background: '#5E8B6A',
                  border: 'none', borderRadius: 999, cursor: 'pointer',
                }}
              >
                next
              </button>
            </div>
          )}

          {debriefStep === 2 && (
            <div>
              <p className="font-hand" style={{ fontSize: 20, color: '#8B7355', marginBottom: 16 }}>
                was this about something deeper?
              </p>
              <textarea
                value={deeperMeaning}
                onChange={(e) => setDeeperMeaning(e.target.value)}
                placeholder="sometimes a fight about dishes is really about feeling unappreciated..."
                style={{
                  width: '100%', height: 100, fontSize: 14, color: '#2C2C2C', lineHeight: 1.6,
                  border: '1px solid #E5E0DA', borderRadius: 12, padding: 12,
                  background: '#FFFFFF', outline: 'none', resize: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={() => setDebriefStep(3)}
                style={{
                  width: '100%', marginTop: 16, padding: '14px 0', fontSize: 14, fontWeight: 500,
                  color: 'white', background: '#5E8B6A',
                  border: 'none', borderRadius: 999, cursor: 'pointer',
                }}
              >
                next
              </button>
            </div>
          )}

          {debriefStep === 3 && (
            <div>
              <p className="font-hand" style={{ fontSize: 20, color: '#8B7355', marginBottom: 16 }}>
                what do you need next time?
              </p>
              <textarea
                value={needNextTime}
                onChange={(e) => setNeedNextTime(e.target.value)}
                placeholder="what would help you feel safe or heard in this kind of moment..."
                style={{
                  width: '100%', height: 100, fontSize: 14, color: '#2C2C2C', lineHeight: 1.6,
                  border: '1px solid #E5E0DA', borderRadius: 12, padding: 12,
                  background: '#FFFFFF', outline: 'none', resize: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={() => setDebriefStep(4)}
                style={{
                  width: '100%', marginTop: 16, padding: '14px 0', fontSize: 14, fontWeight: 500,
                  color: 'white', background: '#5E8B6A',
                  border: 'none', borderRadius: 999, cursor: 'pointer',
                }}
              >
                next
              </button>
            </div>
          )}

          {debriefStep === 4 && (
            <div>
              <p className="font-hand" style={{ fontSize: 20, color: '#8B7355', marginBottom: 16 }}>
                one thing {partner?.name || 'your partner'} did right
              </p>
              <p style={{ fontSize: 13, color: '#A09485', marginBottom: 12, lineHeight: 1.5 }}>
                even in the hardest fights, there is usually something. finding it matters.
              </p>
              <textarea
                value={partnerDidRight}
                onChange={(e) => setPartnerDidRight(e.target.value)}
                placeholder="they stayed, they listened, they tried..."
                style={{
                  width: '100%', height: 100, fontSize: 14, color: '#2C2C2C', lineHeight: 1.6,
                  border: '1px solid #E5E0DA', borderRadius: 12, padding: 12,
                  background: '#FFFFFF', outline: 'none', resize: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={submitDebrief}
                style={{
                  width: '100%', marginTop: 16, padding: '14px 0', fontSize: 14, fontWeight: 500,
                  color: 'white', background: '#5E8B6A',
                  border: 'none', borderRadius: 999, cursor: 'pointer',
                }}
              >
                submit debrief
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'debrief-sent' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
            padding: 32, marginBottom: 24,
          }}>
            <p className="font-hand" style={{ fontSize: 24, color: '#5E8B6A', marginBottom: 8 }}>processed</p>
            <p style={{ fontSize: 14, color: '#A09485', lineHeight: 1.6, margin: 0 }}>
              Gottman says the goal is not to solve the fight but to understand each other&apos;s experience. Read each other&apos;s debriefs when you are both calm.
            </p>
          </div>
          <button
            onClick={() => setStep('intro')}
            style={{
              padding: '12px 32px', fontSize: 14, fontWeight: 500,
              color: '#5E8B6A', background: 'transparent',
              border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer',
            }}
          >
            done
          </button>
        </div>
      )}

      {/* View Debriefs */}
      {step === 'debrief-view' && (
        <div>
          <button
            onClick={() => setStep('intro')}
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

          {partnerDebriefs.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>
                from {partner?.name || 'your partner'}
              </p>
              {partnerDebriefs.map((d) => (
                <div key={d.id} style={{
                  background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
                  padding: 16, marginBottom: 8,
                }}>
                  <p style={{ fontSize: 12, color: '#A09485', margin: '0 0 6px' }}>felt: <strong style={{ color: '#2C2C2C' }}>{d.emotions.join(', ')}</strong></p>
                  {d.triggers.length > 0 && (
                    <p style={{ fontSize: 12, color: '#A09485', margin: '0 0 6px' }}>triggered by: <strong style={{ color: '#2C2C2C' }}>{d.triggers.join(', ')}</strong></p>
                  )}
                  {d.deeper_meaning && (
                    <p style={{ fontSize: 12, color: '#A09485', margin: '0 0 6px' }}>deeper: <strong style={{ color: '#2C2C2C' }}>{d.deeper_meaning}</strong></p>
                  )}
                  {d.need_next_time && (
                    <p style={{ fontSize: 12, color: '#A09485', margin: '0 0 6px' }}>needs next time: <strong style={{ color: '#2C2C2C' }}>{d.need_next_time}</strong></p>
                  )}
                  {d.partner_did_right && (
                    <p style={{ fontSize: 12, color: '#A09485', margin: '0 0 6px' }}>you did right: <strong style={{ color: '#2C2C2C' }}>{d.partner_did_right}</strong></p>
                  )}
                  <p style={{ fontSize: 11, color: '#C4BDB4', marginTop: 10 }}>
                    {new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {myDebriefs.length > 0 && (
            <div>
              <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>from you</p>
              {myDebriefs.map((d) => (
                <div key={d.id} style={{
                  background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
                  padding: 16, marginBottom: 8,
                }}>
                  <p style={{ fontSize: 12, color: '#A09485', margin: '0 0 6px' }}>felt: <strong style={{ color: '#2C2C2C' }}>{d.emotions.join(', ')}</strong></p>
                  {d.triggers.length > 0 && (
                    <p style={{ fontSize: 12, color: '#A09485', margin: '0 0 6px' }}>triggered by: <strong style={{ color: '#2C2C2C' }}>{d.triggers.join(', ')}</strong></p>
                  )}
                  {d.deeper_meaning && (
                    <p style={{ fontSize: 12, color: '#A09485', margin: '0 0 6px' }}>deeper: <strong style={{ color: '#2C2C2C' }}>{d.deeper_meaning}</strong></p>
                  )}
                  {d.need_next_time && (
                    <p style={{ fontSize: 12, color: '#A09485', margin: '0 0 6px' }}>needs next time: <strong style={{ color: '#2C2C2C' }}>{d.need_next_time}</strong></p>
                  )}
                  {d.partner_did_right && (
                    <p style={{ fontSize: 12, color: '#A09485', margin: '0 0 6px' }}>{partner?.name} did right: <strong style={{ color: '#2C2C2C' }}>{d.partner_did_right}</strong></p>
                  )}
                  <p style={{ fontSize: 11, color: '#C4BDB4', marginTop: 10 }}>
                    {new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {myDebriefs.length === 0 && partnerDebriefs.length === 0 && (
            <p style={{ fontSize: 14, color: '#A09485', textAlign: 'center' }}>no debriefs yet.</p>
          )}
        </div>
      )}

      {step === 'view' && (
        <div>
          <button
            onClick={() => setStep('intro')}
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

          {partnerEntries.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>
                from {partner?.name || 'your partner'}
              </p>
              {partnerEntries.map((entry) => (
                <div key={entry.id} style={{
                  background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
                  padding: 16, marginBottom: 8,
                }}>
                  <p style={{ fontSize: 13, color: '#A09485', margin: 0 }}>I felt <strong style={{ color: '#2C2C2C' }}>{entry.i_felt}</strong></p>
                  <p style={{ fontSize: 13, color: '#A09485', margin: '8px 0 0' }}>when you <strong style={{ color: '#2C2C2C' }}>{entry.when_you}</strong></p>
                  <p style={{ fontSize: 13, color: '#A09485', margin: '8px 0 0' }}>what I needed was <strong style={{ color: '#2C2C2C' }}>{entry.what_i_needed}</strong></p>
                  <p style={{ fontSize: 11, color: '#C4BDB4', marginTop: 12 }}>
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {myEntries.length > 0 && (
            <div>
              <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>
                from you
              </p>
              {myEntries.map((entry) => (
                <div key={entry.id} style={{
                  background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
                  padding: 16, marginBottom: 8,
                }}>
                  <p style={{ fontSize: 13, color: '#A09485', margin: 0 }}>I felt <strong style={{ color: '#2C2C2C' }}>{entry.i_felt}</strong></p>
                  <p style={{ fontSize: 13, color: '#A09485', margin: '8px 0 0' }}>when you <strong style={{ color: '#2C2C2C' }}>{entry.when_you}</strong></p>
                  <p style={{ fontSize: 13, color: '#A09485', margin: '8px 0 0' }}>what I needed was <strong style={{ color: '#2C2C2C' }}>{entry.what_i_needed}</strong></p>
                  <p style={{ fontSize: 11, color: '#C4BDB4', marginTop: 12 }}>
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {myEntries.length === 0 && partnerEntries.length === 0 && (
            <p style={{ fontSize: 14, color: '#A09485', textAlign: 'center' }}>
              no repairs yet. that is a good thing.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
