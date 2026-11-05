'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Activity, Baby, Brain, Dumbbell, HeartHandshake, Sprout } from 'lucide-react'
import Footer from '@/components/landing/Footer'
import { useRegion } from '@/context/RegionContext'
import { detectPostalCode } from '@/lib/detect-postal'
import {
  CA_PROVINCES,
  CONCERNS,
  EXPERIENCES,
  PRIORITIES,
  QUIZ_COUNTRIES,
  SESSION_KEY,
  US_STATES,
  countriesMatch,
  postalField,
  postalHint,
  quizCountryFromRegion,
  regionFieldLabel,
  type ConcernId,
  type ExperienceId,
  type PriorityId,
  type QuizCountry,
  type QuizStep,
} from '@/lib/quiz/options'
import { findingMessage } from '@/lib/quiz/copy'
import type { MatchFailure, MatchSuccess, QuizMatch } from '@/lib/quiz/match'
import {
  blankAnswers,
  clampStep,
  quizHref,
  parseAnswers,
  serializeAnswers,
  settle,
  type QuizAnswers,
} from '@/lib/quiz/state'
import { matchDoctors, trackQuizEvent } from './actions'
import { EmailPanel } from './EmailPanel'
import { RequestDialog } from './RequestDialog'
import { ResultsView } from './Results'

const ICONS = { Activity, Sprout, Baby, HeartHandshake, Brain, Dumbbell }
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange focus-visible:ring-offset-2'
const field = `mt-1 w-full min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-base text-neuro-navy ${focusRing}`

function readStored(fallback: QuizAnswers): QuizAnswers {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return fallback
    return parseAnswers(JSON.parse(raw), fallback)
  } catch {
    return fallback
  }
}

export default function QuizFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { region } = useRegion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const tracked = useRef(new Set<string>())
  const [answers, setAnswers] = useState<QuizAnswers | null>(null)
  const [useCity, setUseCity] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [loading, setLoading] = useState(false)
  const [matchError, setMatchError] = useState<MatchFailure | null>(null)
  const [result, setResult] = useState<MatchSuccess | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [live, setLive] = useState('')
  const [doctor, setDoctor] = useState<QuizMatch | null>(null)
  const [attempt, setAttempt] = useState(0)
  const matchLock = useRef('')
  const paramStep = searchParams.get('step')
  const step: QuizStep = answers ? clampStep(paramStep, answers) : (paramStep === 'location' || paramStep === 'experience' || paramStep === 'priority' || paramStep === 'results' ? paramStep : 'concern')

  function save(next: QuizAnswers) {
    setAnswers(next)
    sessionStorage.setItem(SESSION_KEY, serializeAnswers(next))
  }

  const go = useCallback((nextStep: QuizStep, next: QuizAnswers, replace = false) => {
    const href = quizHref(nextStep, next.source)
    const current = `${window.location.pathname}${window.location.search}`
    if (current === href) return
    if (replace) router.replace(href, { scroll: false })
    else router.push(href, { scroll: false })
  }, [router])

  useEffect(() => {
    const created = blankAnswers({
      source: searchParams.get('source'),
      country: quizCountryFromRegion(region.code),
      sessionId: crypto.randomUUID(),
      startedAt: Date.now(),
    })
    const loaded = readStored(created)
    if (loaded === created) save(created)
    else setAnswers(loaded)
    const cityMode = !loaded.postal.trim() && !!(loaded.city.trim() && loaded.region.trim())
    setUseCity(cityMode)
    const currentAnswers = loaded === created ? created : loaded
    const next = clampStep(searchParams.get('step'), currentAnswers)
    if (searchParams.get('step') !== next) go(next, currentAnswers, true)
    // Region default is applied once. A later region read should not reset a quiz in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!answers || !paramStep) return
    const next = clampStep(paramStep, answers)
    if (paramStep !== next) go(next, answers, true)
  }, [paramStep, answers, go])

  useEffect(() => {
    if (!answers || step !== 'concern') return
    if (answers.postal.trim() || answers.city.trim() || answers.region.trim()) return
    const country = quizCountryFromRegion(region.code)
    if (country === answers.country) return
    save({ ...answers, country })
  }, [region.code, step, answers])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    headingRef.current?.focus()
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [step])

  useEffect(() => {
    if (!answers) return
    const key = `step_view:${step}`
    if (tracked.current.has(key)) return
    tracked.current.add(key)
    const payload = {
      sessionId: answers.sessionId,
      source: answers.source,
      step,
      event: 'step_view' as const,
    }
    void trackQuizEvent(payload)
    if (step === 'concern' && !tracked.current.has('start')) {
      tracked.current.add('start')
      void trackQuizEvent({ sessionId: answers.sessionId, source: answers.source, event: 'start', step: 'concern' })
    }
  }, [answers, step])

  useEffect(() => {
    if (step !== 'results' || !answers || result) return
    const lock = `${answers.sessionId}:${attempt}`
    if (matchLock.current === lock) return
    matchLock.current = lock
    const place = answers.postal.trim() || [answers.city.trim(), answers.region.trim()].filter(Boolean).join(', ')
    setLive(findingMessage(place || 'you'))
    void settle(async () => {
      const response = await matchDoctors({
        concern: answers.concern,
        country: answers.country,
        postal: useCity ? '' : answers.postal,
        city: useCity ? answers.city : '',
        region: useCity ? answers.region : '',
        experience: answers.experience,
        priority: answers.priority,
        source: answers.source,
        sessionId: answers.sessionId,
      })
      if (matchLock.current !== lock) return response
      if (!response.ok) {
        setMatchError(response)
        setLive(response.message)
        void trackQuizEvent({ sessionId: answers.sessionId, source: answers.source, event: 'error', step: 'results' })
        return response
      }
      setResult(response)
      setMatchError(null)
      setLive(response.liveMessage)
      void trackQuizEvent({
        sessionId: answers.sessionId,
        source: answers.source,
        event: 'results_shown',
        step: 'results',
        matchCount: Math.min(3, response.matches.length),
        bandMiles: response.band ?? undefined,
        country: response.country,
        concern: response.concern,
      })
      if (response.noLocal) {
        void trackQuizEvent({
          sessionId: answers.sessionId,
          source: answers.source,
          event: 'no_local',
          step: 'results',
          country: response.country,
          concern: response.concern,
          matchCount: response.matches.length,
        })
      }
      return response
    }, setLoading)
  }, [step, answers, result, useCity, attempt])

  function chooseConcern(id: ConcernId) {
    if (!answers) return
    const next = { ...answers, concern: id }
    save(next)
    void trackQuizEvent({ sessionId: next.sessionId, source: next.source, event: 'step_answer', step: 'concern', concern: id })
    go('location', next)
  }

  function chooseExperience(id: ExperienceId) {
    if (!answers) return
    const next = { ...answers, experience: id }
    save(next)
    void trackQuizEvent({ sessionId: next.sessionId, source: next.source, event: 'step_answer', step: 'experience' })
    go('priority', next)
  }

  function choosePriority(id: PriorityId) {
    if (!answers) return
    const next = { ...answers, priority: id }
    save(next)
    void trackQuizEvent({ sessionId: next.sessionId, source: next.source, event: 'step_answer', step: 'priority' })
    go('results', next)
  }

  function submitLocation(event: React.FormEvent) {
    event.preventDefault()
    if (!answers) return
    if (useCity) {
      if (!answers.city.trim() || !answers.region.trim()) {
        setLocationError('Enter a city and state.')
        document.getElementById(answers.city.trim() ? 'quiz-region' : 'quiz-city')?.focus()
        return
      }
      setLocationError('')
      void trackQuizEvent({ sessionId: answers.sessionId, source: answers.source, event: 'step_answer', step: 'location', country: answers.country })
      go('experience', answers)
      return
    }
    const detected = detectPostalCode(answers.postal, postalHint(answers.country))
    if (!detected || !countriesMatch(detected.country, answers.country)) {
      setLocationError('Enter a valid postal code for this country.')
      document.getElementById('quiz-postal')?.focus()
      return
    }
    const next = { ...answers, postal: detected.code }
    save(next)
    setLocationError('')
    void trackQuizEvent({ sessionId: next.sessionId, source: next.source, event: 'step_answer', step: 'location', country: next.country })
    go('experience', next)
  }

  function startOver() {
    const fresh = blankAnswers({
      source: answers?.source || searchParams.get('source'),
      country: answers?.country || quizCountryFromRegion(region.code),
      sessionId: crypto.randomUUID(),
      startedAt: Date.now(),
    })
    sessionStorage.removeItem(SESSION_KEY)
    save(fresh)
    setUseCity(false)
    setResult(null)
    setMatchError(null)
    setShowAll(false)
    setLive('')
    tracked.current.clear()
    router.push(quizHref('concern', fresh.source))
  }

  const progressIndex = step === 'concern' ? 1 : step === 'location' ? 2 : step === 'experience' ? 3 : step === 'priority' ? 4 : 0
  const postal = answers ? postalField(answers.country) : postalField('US')
  const regionChoices = answers?.country === 'US' ? US_STATES : answers?.country === 'CA' ? CA_PROVINCES : null

  return (
    <>
      <main className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
        <div className="min-h-[560px] rounded-3xl bg-white p-5 shadow-sm sm:p-8">
          <p className="text-base text-gray-600">4 quick questions, about a minute.</p>
          {step !== 'results' ? (
            <div className="mt-4">
              <p className="text-sm font-semibold text-neuro-navy">Step {progressIndex} of 4</p>
              <div role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={progressIndex} aria-label="Quiz progress" className="mt-2 h-2 rounded-full bg-neuro-cream">
                <div className="h-2 rounded-full bg-neuro-orange-ink" style={{ width: `${(progressIndex / 4) * 100}%` }} />
              </div>
            </div>
          ) : null}

          {step !== 'results' && step !== 'concern' ? (
            <button
              type="button"
              onClick={() => answers && go(step === 'location' ? 'concern' : step === 'experience' ? 'location' : 'experience', answers)}
              className={`mt-4 inline-flex min-h-11 items-center text-base font-semibold text-neuro-navy ${focusRing}`}
            >
              Back
            </button>
          ) : null}

          {step === 'concern' ? (
            <form>
              <fieldset className="mt-6">
                <legend className="sr-only">What would you like help with?</legend>
                <h1 ref={headingRef} tabIndex={-1} className="font-heading text-2xl text-neuro-navy outline-none">What would you like help with?</h1>
                <div className="mt-4 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                  {CONCERNS.map((item) => {
                    const Icon = ICONS[item.icon]
                    return (
                      <button key={item.id} type="button" onClick={() => chooseConcern(item.id)} className={`min-h-11 rounded-2xl border border-gray-200 p-4 text-left ${focusRing}`}>
                        <Icon aria-hidden="true" className="mb-2 h-6 w-6 text-neuro-orange-ink" />
                        <span className="block text-base font-semibold text-neuro-navy">{item.label}</span>
                        <span className="mt-1 block text-sm text-gray-600">{item.description}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            </form>
          ) : null}

          {step === 'location' && answers ? (
            <form onSubmit={submitLocation} className="mt-6" noValidate>
              <h1 ref={headingRef} tabIndex={-1} className="font-heading text-2xl text-neuro-navy outline-none">Where should we look?</h1>
              <div className="mt-4">
                <label htmlFor="quiz-country" className="text-sm font-semibold text-neuro-navy">Country</label>
                <select id="quiz-country" autoComplete="country" value={answers.country} onChange={(event) => save({ ...answers, country: event.target.value as QuizCountry, region: '' })} className={field}>
                  {QUIZ_COUNTRIES.map((code) => (
                    <option key={code} value={code}>{code === 'US' ? 'United States' : code === 'CA' ? 'Canada' : code === 'UK' ? 'United Kingdom' : code === 'AU' ? 'Australia' : code === 'NZ' ? 'New Zealand' : code === 'IE' ? 'Ireland' : code === 'IN' ? 'India' : 'United Arab Emirates'}</option>
                  ))}
                </select>
              </div>
              {useCity ? (
                <>
                  <div className="mt-4">
                    <label htmlFor="quiz-city" className="text-sm font-semibold text-neuro-navy">City</label>
                    <input id="quiz-city" autoComplete="address-level2" value={answers.city} onChange={(event) => save({ ...answers, city: event.target.value })} aria-invalid={locationError ? true : undefined} aria-describedby={locationError ? 'quiz-location-error' : undefined} className={field} />
                  </div>
                  <div className="mt-4">
                    <label htmlFor="quiz-region" className="text-sm font-semibold text-neuro-navy">{regionFieldLabel(answers.country)}</label>
                    {regionChoices ? (
                      <select id="quiz-region" autoComplete="address-level1" value={answers.region} onChange={(event) => save({ ...answers, region: event.target.value })} className={field}>
                        <option value="">Select</option>
                        {regionChoices.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                      </select>
                    ) : (
                      <input id="quiz-region" autoComplete="address-level1" value={answers.region} onChange={(event) => save({ ...answers, region: event.target.value })} className={field} />
                    )}
                  </div>
                  <button type="button" onClick={() => { setUseCity(false); setLocationError('') }} className={`mt-3 min-h-11 text-base font-semibold text-neuro-orange-ink underline ${focusRing}`}>
                    Use a postal code instead
                  </button>
                </>
              ) : (
                <>
                  <div className="mt-4">
                    <label htmlFor="quiz-postal" className="text-sm font-semibold text-neuro-navy">{postal.label}</label>
                    <input id="quiz-postal" autoComplete="postal-code" placeholder={postal.placeholder} value={answers.postal} onChange={(event) => save({ ...answers, postal: event.target.value })} aria-invalid={locationError ? true : undefined} aria-describedby={locationError ? 'quiz-location-error' : undefined} className={field} />
                  </div>
                  <button type="button" onClick={() => { setUseCity(true); setLocationError('') }} className={`mt-3 min-h-11 text-base font-semibold text-neuro-orange-ink underline ${focusRing}`}>
                    Use city and state instead
                  </button>
                </>
              )}
              {locationError ? <p id="quiz-location-error" className="mt-2 text-sm text-red-700">{locationError}</p> : null}
              <button type="submit" className={`mt-4 min-h-11 w-full rounded-xl bg-neuro-orange-ink px-4 text-base font-semibold text-white ${focusRing}`}>Next</button>
            </form>
          ) : null}

          {step === 'experience' ? (
            <fieldset className="mt-6">
              <legend className="sr-only">Have you seen a chiropractor before?</legend>
              <h1 ref={headingRef} tabIndex={-1} className="font-heading text-2xl text-neuro-navy outline-none">Have you seen a chiropractor before?</h1>
              <div className="mt-4 space-y-3">
                {EXPERIENCES.map((item) => (
                  <button key={item.id} type="button" onClick={() => chooseExperience(item.id)} className={`min-h-11 w-full rounded-2xl border border-gray-200 p-4 text-left ${focusRing}`}>
                    <span className="block text-base font-semibold text-neuro-navy">{item.label}</span>
                    <span className="mt-1 block text-sm text-gray-600">{item.description}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {step === 'priority' ? (
            <fieldset className="mt-6">
              <legend className="sr-only">What matters most to you?</legend>
              <h1 ref={headingRef} tabIndex={-1} className="font-heading text-2xl text-neuro-navy outline-none">What matters most to you?</h1>
              <div className="mt-4 space-y-3">
                {PRIORITIES.map((item) => (
                  <button key={item.id} type="button" onClick={() => choosePriority(item.id)} className={`min-h-11 w-full rounded-2xl border border-gray-200 p-4 text-left ${focusRing}`}>
                    <span className="block text-base font-semibold text-neuro-navy">{item.label}</span>
                    <span className="mt-1 block text-sm text-gray-600">{item.description}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {step === 'results' ? (
            <section className="mt-6" aria-busy={loading}>
              <h1 ref={headingRef} tabIndex={-1} className="font-heading text-2xl text-neuro-navy outline-none">Your matches</h1>
              <div role="status" aria-live="polite" className="sr-only">{live}</div>
              {loading && !result && !matchError ? (
                <p className="mt-2 text-base text-gray-600">{live || 'Finding doctors near you...'}</p>
              ) : null}
              {matchError ? (
                <div>
                  <p className="mt-2 text-base text-red-700" role="alert">{matchError.message}</p>
                  {matchError.code === 'unknown_place' ? (
                    <button type="button" onClick={() => { setUseCity(true); setResult(null); setMatchError(null); if (answers) go('location', answers) }} className={`mt-3 min-h-11 text-base font-semibold text-neuro-orange-ink underline ${focusRing}`}>
                      Use city and state instead
                    </button>
                  ) : null}
                  <button type="button" onClick={() => { setMatchError(null); setResult(null); setAttempt((value) => value + 1) }} className={`mt-4 min-h-11 rounded-xl bg-neuro-orange-ink px-4 text-base font-semibold text-white ${focusRing}`}>
                    Retry
                  </button>
                </div>
              ) : null}
              {result ? (
                <ResultsView
                  data={result}
                  showAll={showAll}
                  onShowAll={() => setShowAll(true)}
                  onRequest={(match) => {
                    setDoctor(match)
                    if (answers) {
                      void trackQuizEvent({ sessionId: answers.sessionId, source: answers.source, event: 'request_open', step: 'results', doctorId: match.id })
                    }
                  }}
                >
                  {answers && answers.postal.trim() ? (
                    <EmailPanel
                      postal={answers.postal.trim()}
                      country={answers.country}
                      doctorIds={result.matches.map((match) => match.id)}
                      sessionId={answers.sessionId}
                      source={answers.source}
                      startedAt={answers.startedAt}
                    />
                  ) : null}
                  <button type="button" onClick={startOver} className={`mt-6 min-h-11 text-base font-semibold text-neuro-navy underline ${focusRing}`}>
                    Start over
                  </button>
                </ResultsView>
              ) : null}
            </section>
          ) : null}
        </div>
      </main>
      {step === 'results' ? <Footer /> : null}
      <RequestDialog
        doctor={doctor}
        sessionId={answers?.sessionId || ''}
        source={answers?.source || 'direct'}
        startedAt={answers?.startedAt || 0}
        onClose={() => setDoctor(null)}
      />
    </>
  )
}
