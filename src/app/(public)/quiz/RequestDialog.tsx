'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { containsHealthWords, isPlausibleEmail, isPlausiblePhone } from '@/lib/leads/validate'
import { QUIZ_REQUEST_CONSENT_STORED, QUIZ_REQUEST_CONSENT_V1 } from '@/lib/quiz/options'
import { doctorLastName } from '@/lib/quiz/copy'
import type { QuizMatch } from '@/lib/quiz/match'
import { requestAppointment } from './actions'
import { ConsentText } from './ConsentText'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange focus-visible:ring-offset-2'
const field = `mt-1 w-full min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-base text-neuro-navy ${focusRing}`

type Props = {
  doctor: QuizMatch | null
  sessionId: string
  source: string
  startedAt: number
  onClose: () => void
}

export function RequestDialog({ doctor, sessionId, source, startedAt, onClose }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [bestTime, setBestTime] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ message: string; withdrawUrl: string } | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const open = !!doctor

  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement as HTMLElement | null
    const node = panelRef.current
    const focusable = () => Array.from(node?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])',
    ) || [])
    const first = focusable()[0]
    first?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      returnFocus.current?.focus()
    }
  }, [open, onClose, doctor?.id])

  useEffect(() => {
    setName('')
    setPhone('')
    setEmail('')
    setBestTime('')
    setMessage('')
    setConsent(false)
    setErrors({})
    setFormError('')
    setSuccess(null)
  }, [doctor?.id])

  if (!doctor) return null
  const selected = doctor
  const last = doctorLastName(selected.name)
  const health = containsHealthWords(message)

  function focusField(id: string) {
    document.getElementById(id)?.focus()
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Enter your name.'
    if (phone.trim() && !isPlausiblePhone(phone)) next.phone = 'Enter a phone number we can call.'
    if (email.trim() && !isPlausibleEmail(email)) next.email = 'Enter a valid email address.'
    if (!isPlausiblePhone(phone) && !isPlausibleEmail(email)) next.phone = next.phone || 'Enter a phone number or an email.'
    if (!consent) next.consent = 'Check the box to agree before sending.'
    setErrors(next)
    if (Object.keys(next).length) {
      focusField(next.name ? 'quiz-request-name' : next.phone ? 'quiz-request-phone' : next.email ? 'quiz-request-email' : 'quiz-request-consent')
      return
    }
    setLoading(true)
    setFormError('')
    try {
      const result = await requestAppointment({
        doctorId: selected.id,
        name,
        phone,
        email,
        bestTime,
        message,
        consent: true,
        consentText: QUIZ_REQUEST_CONSENT_STORED,
        _hp: honeypot,
        startedAt,
        sessionId,
        source,
      })
      if (!result.ok) {
        setFormError(result.message)
        return
      }
      setSuccess({ message: result.message, withdrawUrl: result.withdrawUrl || '' })
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neuro-navy/50 p-0 sm:items-center sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[100dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
      >
        <h2 id={titleId} className="font-heading text-xl text-neuro-navy">
          Request an appointment with Dr. {last}
        </h2>
        {success ? (
          <div className="mt-4 space-y-4">
            <p className="text-base text-neuro-navy" role="status">{success.message}</p>
            {success.withdrawUrl ? (
              <p className="text-sm text-gray-600">
                <a className={`text-neuro-orange-ink underline ${focusRing}`} href={success.withdrawUrl}>
                  Changed your mind? Cancel this request
                </a>
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={onClose} className={`min-h-11 rounded-xl bg-neuro-orange-ink px-4 text-base font-semibold text-white ${focusRing}`}>Done</button>
              <button type="button" onClick={onClose} className={`min-h-11 rounded-xl border border-gray-300 px-4 text-base font-semibold text-neuro-navy ${focusRing}`}>Request another doctor</button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
            <div>
              <label htmlFor="quiz-request-name" className="text-sm font-semibold text-neuro-navy">Name</label>
              <input id="quiz-request-name" name="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? 'quiz-request-name-error' : undefined} className={field} />
              {errors.name ? <p id="quiz-request-name-error" className="mt-1 text-sm text-red-700">{errors.name}</p> : null}
            </div>
            <div>
              <label htmlFor="quiz-request-phone" className="text-sm font-semibold text-neuro-navy">Phone</label>
              <input id="quiz-request-phone" name="phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} aria-invalid={errors.phone ? true : undefined} aria-describedby="quiz-request-reach" className={field} />
            </div>
            <div>
              <label htmlFor="quiz-request-email" className="text-sm font-semibold text-neuro-navy">Email</label>
              <input id="quiz-request-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={errors.email ? true : undefined} aria-describedby="quiz-request-reach" className={field} />
              <p id="quiz-request-reach" className="mt-1 text-sm text-gray-600">Enter a phone number or an email so the office can reach you.</p>
              {errors.phone ? <p className="mt-1 text-sm text-red-700">{errors.phone}</p> : null}
              {errors.email ? <p className="mt-1 text-sm text-red-700">{errors.email}</p> : null}
            </div>
            <div>
              <label htmlFor="quiz-request-time" className="text-sm font-semibold text-neuro-navy">Best time to reach you</label>
              <input id="quiz-request-time" name="bestTime" value={bestTime} onChange={(event) => setBestTime(event.target.value)} maxLength={80} className={field} />
            </div>
            <div>
              <label htmlFor="quiz-request-message" className="text-sm font-semibold text-neuro-navy">Message</label>
              <textarea id="quiz-request-message" name="message" value={message} onChange={(event) => setMessage(event.target.value.slice(0, 500))} rows={4} maxLength={500} className={`${field} min-h-28 py-3`} />
              <p className="mt-1 text-sm text-gray-600">{message.length}/500</p>
              <p className="mt-1 text-sm text-gray-600">Please don&apos;t include symptoms, diagnoses or medical details. This isn&apos;t a clinical form.</p>
              {health ? <p className="mt-1 text-sm text-amber-800">Please don&apos;t include medical details.</p> : null}
            </div>
            <div className="flex items-start gap-3">
              <input id="quiz-request-consent" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className={`mt-1 h-5 w-5 ${focusRing}`} aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? 'quiz-request-consent-error' : undefined} />
              <label htmlFor="quiz-request-consent" className="text-sm text-neuro-navy">
                <ConsentText text={QUIZ_REQUEST_CONSENT_V1} />
              </label>
            </div>
            {errors.consent ? <p id="quiz-request-consent-error" className="text-sm text-red-700">{errors.consent}</p> : null}
            {formError ? <p className="text-sm text-red-700" role="alert">{formError}</p> : null}
            <input type="text" name="_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={loading} className={`min-h-11 flex-1 rounded-xl bg-neuro-orange-ink px-4 text-base font-semibold text-white disabled:opacity-60 ${focusRing}`}>
                {loading ? 'Sending...' : 'Request an appointment'}
              </button>
              <button type="button" onClick={onClose} className={`min-h-11 rounded-xl border border-gray-300 px-4 text-base font-semibold text-neuro-navy ${focusRing}`}>Back</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
