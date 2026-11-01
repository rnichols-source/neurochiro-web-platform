'use client'

import { useState } from 'react'
import { isPlausibleEmail } from '@/lib/leads/validate'
import { QUIZ_EMAIL_CONSENT_V1, alertsConsentText } from '@/lib/quiz/options'
import { emailResults } from './actions'
import { ConsentText } from './ConsentText'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange focus-visible:ring-offset-2'
const field = `mt-1 w-full min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-base text-neuro-navy ${focusRing}`

type Props = {
  postal: string
  country: string
  doctorIds: string[]
  sessionId: string
  source: string
  startedAt: number
}

export function EmailPanel(props: Props) {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [alerts, setAlerts] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState('')
  const alertsText = alertsConsentText(props.postal)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!isPlausibleEmail(email)) {
      setError('Enter a valid email address.')
      document.getElementById('quiz-results-email')?.focus()
      return
    }
    if (!consent) {
      setError('Check the box to agree before we email your matches.')
      document.getElementById('quiz-email-consent')?.focus()
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await emailResults({
        email,
        country: props.country,
        postal: props.postal,
        doctorIds: props.doctorIds,
        consent: true,
        alerts,
        _hp: '',
        startedAt: props.startedAt,
        sessionId: props.sessionId,
        source: props.source,
      })
      if (!result.ok) {
        setError(result.message)
        return
      }
      setSent(result.message)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return <p className="mt-6 text-base text-neuro-navy" role="status">{sent}</p>
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-gray-200 bg-neuro-cream p-4" noValidate>
      <h2 className="font-heading text-lg text-neuro-navy">Email me these results</h2>
      <div className="mt-3">
        <label htmlFor="quiz-results-email" className="text-sm font-semibold text-neuro-navy">Email</label>
        <input id="quiz-results-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? 'quiz-email-error' : undefined} className={field} />
      </div>
      <div className="mt-3 flex items-start gap-3">
        <input id="quiz-email-consent" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className={`mt-1 h-5 w-5 ${focusRing}`} />
        <label htmlFor="quiz-email-consent" className="text-sm text-neuro-navy"><ConsentText text={QUIZ_EMAIL_CONSENT_V1} /></label>
      </div>
      <div className="mt-3 flex items-start gap-3">
        <input id="quiz-alerts-consent" type="checkbox" checked={alerts} onChange={(event) => setAlerts(event.target.checked)} className={`mt-1 h-5 w-5 ${focusRing}`} />
        <label htmlFor="quiz-alerts-consent" className="text-sm text-neuro-navy">{alertsText}</label>
      </div>
      {error ? <p id="quiz-email-error" className="mt-2 text-sm text-red-700" role="alert">{error}</p> : null}
      <button type="submit" disabled={loading} className={`mt-4 min-h-11 w-full rounded-xl bg-neuro-navy px-4 text-base font-semibold text-white disabled:opacity-60 ${focusRing}`}>
        {loading ? 'Sending...' : 'Email me these results'}
      </button>
    </form>
  )
}
