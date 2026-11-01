'use client'

import { useState } from 'react'
import { sendSchoolVerification } from '../actions/verify-school'

export function VerifyResend() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setMessage(null)
    const result = await sendSchoolVerification(email)
    setPending(false)
    if (result?.error === 'Not authenticated') {
      window.location.href = '/login?redirect=/student/verify'
      return
    }
    if (result && 'error' in result && result.error) {
      const note = 'message' in result && typeof result.message === 'string' ? result.message : null
      setMessage(note || 'Could not send a new link.')
      return
    }
    setMessage('Check your school email for a new link. It expires in 48 hours.')
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <label htmlFor="school-email" className="block text-sm font-semibold">School email</label>
      <input
        id="school-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="w-full rounded-xl border border-[#1E2D3B]/20 bg-white px-3 py-3 text-base"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#D66829] px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Send a new link'}
      </button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  )
}
