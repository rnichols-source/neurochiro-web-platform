'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { getCurrentPartner, getOtherPartner } from '@/lib/partner'
import type { Partner } from '@/lib/types'
import { LOVE_MAP_QUESTIONS, CATEGORY_INFO, getQuestionsForCategory } from '@/lib/love-map-questions'
import type { LoveMapCategory, LoveMapQuestion } from '@/lib/love-map-questions'

interface LoveMapRound {
  id: string
  couple_id: string
  partner_id: string
  category: string
  question: string
  answer: string
  round_date: string
  created_at: string
}

const CATEGORIES: LoveMapCategory[] = ['current', 'history', 'future', 'inner-world']

export default function LoveMapsPage() {
  const supabase = createClient()
  const [me, setMe] = useState<Partner | null>(null)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [step, setStep] = useState<'home' | 'category' | 'play' | 'reveal' | 'history'>('home')
  const [selectedCategory, setSelectedCategory] = useState<LoveMapCategory | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<LoveMapQuestion | null>(null)
  const [answer, setAnswer] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [roundQuestions, setRoundQuestions] = useState<LoveMapQuestion[]>([])
  const [myAnswers, setMyAnswers] = useState<LoveMapRound[]>([])
  const [partnerAnswers, setPartnerAnswers] = useState<LoveMapRound[]>([])
  const [totalRounds, setTotalRounds] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const myPartner = await getCurrentPartner()
    if (!myPartner) return
    setMe(myPartner)

    const other = await getOtherPartner(myPartner.id)
    if (other) setPartner(other)

    const { data: allRounds } = await supabase
      .from('love_map_rounds')
      .select('*')
      .eq('couple_id', myPartner.couple_id)
      .order('created_at', { ascending: false })

    if (allRounds) {
      setMyAnswers(allRounds.filter((r: LoveMapRound) => r.partner_id === myPartner.id))
      setPartnerAnswers(allRounds.filter((r: LoveMapRound) => r.partner_id !== myPartner.id))
      // Count unique dates as "rounds"
      const dates = new Set(allRounds.filter((r: LoveMapRound) => r.partner_id === myPartner.id).map((r: LoveMapRound) => r.round_date))
      setTotalRounds(dates.size)
    }

    setLoading(false)
  }

  function startRound(category: LoveMapCategory) {
    setSelectedCategory(category)
    const questions = getQuestionsForCategory(category)
    // Shuffle and pick 5
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, 5)
    setRoundQuestions(shuffled)
    setQuestionIndex(0)
    setCurrentQuestion(shuffled[0])
    setAnswer('')
    setStep('play')
  }

  async function submitAnswer() {
    if (!me || !currentQuestion || !answer.trim()) return

    await supabase.from('love_map_rounds').insert({
      couple_id: me.couple_id,
      partner_id: me.id,
      category: currentQuestion.category,
      question: currentQuestion.question,
      answer: answer.trim(),
    })

    if (questionIndex < roundQuestions.length - 1) {
      const next = questionIndex + 1
      setQuestionIndex(next)
      setCurrentQuestion(roundQuestions[next])
      setAnswer('')
    } else {
      setStep('reveal')
      loadData()
    }
  }

  function getScore(): number {
    if (myAnswers.length === 0) return 0
    // Simple score based on total answers given, capped at 100
    return Math.min(Math.round((myAnswers.length / 60) * 100), 100)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-hand" style={{ fontSize: 24, color: '#A09485' }}>love maps</span>
      </div>
    )
  }

  const score = getScore()

  return (
    <div style={{ maxWidth: 448, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 className="font-hand" style={{ fontSize: 32, fontWeight: 400, color: '#2C2C2C' }}>
          love maps
        </h1>
        <p style={{ fontSize: 14, color: '#A09485', fontWeight: 300, marginTop: 4 }}>
          how well do you know each other&apos;s world?
        </p>
      </div>

      {step === 'home' && (
        <div>
          {/* Score */}
          <div style={{
            textAlign: 'center', marginBottom: 32,
            paddingTop: 24, paddingBottom: 24,
            borderTop: '1px solid #E5E0DA', borderBottom: '1px solid #E5E0DA',
          }}>
            <p style={{ fontSize: 56, fontWeight: 200, color: '#2C2C2C', margin: 0, lineHeight: 1 }}>
              {score}
            </p>
            <p style={{ fontSize: 13, color: '#A09485', marginTop: 8 }}>
              love map depth
            </p>
            <p style={{ fontSize: 11, color: '#C4BDB4', marginTop: 4 }}>
              {totalRounds} {totalRounds === 1 ? 'round' : 'rounds'} played
            </p>
          </div>

          {/* Intro card */}
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
            padding: 24, marginBottom: 24,
          }}>
            <p style={{ fontSize: 14, color: '#2C2C2C', lineHeight: 1.7, margin: 0 }}>
              Gottman says the foundation of love is knowing your partner&apos;s inner world. Their fears, dreams, stresses, joys. Pick a category, answer 5 questions about {partner?.name || 'your partner'}, then compare notes.
            </p>
          </div>

          {/* Category buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {CATEGORIES.map((cat) => {
              const info = CATEGORY_INFO[cat]
              const myCount = myAnswers.filter(a => a.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => startRound(cat)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '18px 16px', background: '#FFFFFF',
                    border: '1px solid #E5E0DA', borderRadius: 16, cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{info.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <span className="font-hand" style={{ fontSize: 17, color: '#2C2C2C', display: 'block' }}>
                      {info.label}
                    </span>
                    <span style={{ fontSize: 11, color: '#A09485', display: 'block', marginTop: 2 }}>
                      {myCount} answers
                    </span>
                  </div>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#C4BDB4" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )
            })}
          </div>

          {/* History link */}
          {(myAnswers.length > 0 || partnerAnswers.length > 0) && (
            <button
              onClick={() => setStep('history')}
              style={{
                width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 500,
                color: '#5E8B6A', background: 'transparent',
                border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer',
              }}
            >
              view past answers
            </button>
          )}
        </div>
      )}

      {step === 'play' && currentQuestion && (
        <div>
          {/* Progress */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
            {roundQuestions.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= questionIndex ? '#5E8B6A' : '#E5E0DA',
              }} />
            ))}
          </div>

          {/* Category label */}
          <p style={{ fontSize: 12, color: '#A09485', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            {CATEGORY_INFO[selectedCategory!].emoji} {CATEGORY_INFO[selectedCategory!].label}
          </p>

          {/* Question */}
          <p className="font-hand" style={{ fontSize: 22, color: '#2C2C2C', lineHeight: 1.4, marginBottom: 24 }}>
            {currentQuestion.question}
          </p>

          {/* Answer */}
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={`what would ${partner?.name || 'your partner'} say...`}
            style={{
              width: '100%', height: 120, fontSize: 14, color: '#2C2C2C', lineHeight: 1.6,
              border: '1px solid #E5E0DA', borderRadius: 12, padding: 12,
              background: '#FFFFFF', outline: 'none', resize: 'none', boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={() => { setStep('home'); setAnswer('') }}
              style={{
                flex: 1, padding: '14px 0', fontSize: 14, fontWeight: 500,
                color: '#A09485', background: 'transparent',
                border: '1px solid #E5E0DA', borderRadius: 999, cursor: 'pointer',
              }}
            >
              quit
            </button>
            <button
              onClick={submitAnswer}
              disabled={!answer.trim()}
              style={{
                flex: 1, padding: '14px 0', fontSize: 14, fontWeight: 500,
                color: 'white',
                background: !answer.trim() ? '#B8CCBE' : '#5E8B6A',
                border: 'none', borderRadius: 999, cursor: 'pointer',
              }}
            >
              {questionIndex < roundQuestions.length - 1 ? 'next' : 'finish'}
            </button>
          </div>
        </div>
      )}

      {step === 'reveal' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
            padding: 32, marginBottom: 24,
          }}>
            <p className="font-hand" style={{ fontSize: 28, color: '#5E8B6A', marginBottom: 8 }}>round complete</p>
            <p style={{ fontSize: 14, color: '#A09485', lineHeight: 1.6, margin: 0 }}>
              Now sit together and read your answers out loud. Let {partner?.name || 'your partner'} tell you what they actually think. This is where the real map gets drawn.
            </p>
          </div>

          <div style={{
            background: '#FAF8F5', border: '1px solid #E5E0DA', borderRadius: 12,
            padding: 16, marginBottom: 24, textAlign: 'left',
          }}>
            <p className="font-hand" style={{ fontSize: 16, color: '#8B7355', marginBottom: 12 }}>your answers</p>
            {roundQuestions.map((q) => {
              const myAnswer = myAnswers.find(a => a.question === q.question)
              if (!myAnswer) return null
              return (
                <div key={q.id} style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: '#A09485', margin: '0 0 4px' }}>{q.question}</p>
                  <p style={{ fontSize: 14, color: '#2C2C2C', margin: 0, lineHeight: 1.5 }}>{myAnswer.answer}</p>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => { setStep('home'); loadData() }}
            style={{
              padding: '14px 32px', fontSize: 14, fontWeight: 500,
              color: 'white', background: '#5E8B6A',
              border: 'none', borderRadius: 999, cursor: 'pointer',
            }}
          >
            done
          </button>
        </div>
      )}

      {step === 'history' && (
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

          {/* My answers */}
          {myAnswers.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>your answers</p>
              {myAnswers.slice(0, 20).map((entry) => (
                <div key={entry.id} style={{
                  background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
                  padding: 16, marginBottom: 8,
                }}>
                  <p style={{ fontSize: 12, color: '#A09485', margin: '0 0 4px' }}>{entry.question}</p>
                  <p style={{ fontSize: 14, color: '#2C2C2C', margin: 0, lineHeight: 1.5 }}>{entry.answer}</p>
                  <p style={{ fontSize: 11, color: '#C4BDB4', marginTop: 8 }}>
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Partner answers */}
          {partnerAnswers.length > 0 && (
            <div>
              <p className="font-hand" style={{ fontSize: 18, color: '#8B7355', marginBottom: 12 }}>
                from {partner?.name || 'your partner'}
              </p>
              {partnerAnswers.slice(0, 20).map((entry) => (
                <div key={entry.id} style={{
                  background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 16,
                  padding: 16, marginBottom: 8,
                }}>
                  <p style={{ fontSize: 12, color: '#A09485', margin: '0 0 4px' }}>{entry.question}</p>
                  <p style={{ fontSize: 14, color: '#2C2C2C', margin: 0, lineHeight: 1.5 }}>{entry.answer}</p>
                  <p style={{ fontSize: 11, color: '#C4BDB4', marginTop: 8 }}>
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
