'use client'

import { useEffect, useState } from 'react'
import { DoctorSmsConsentLabel } from '@/components/sms/SmsConsentLabel'
import { loadLeadTextAlerts, saveLeadTextAlerts } from './sms-actions'

const LABELS = ['Your mobile', 'Office manager or second phone', 'Another mobile']

export default function LeadTextAlerts() {
  const [ready, setReady] = useState<boolean | null>(null)
  const [phones, setPhones] = useState(['', '', ''])
  const [enabled, setEnabled] = useState(true)
  const [consent, setConsent] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    loadLeadTextAlerts().then((result) => {
      if (!active) return
      if ('error' in result) {
        setReady(true)
        setMessage({ type: 'error', text: result.error })
        return
      }
      if (!result.ready) {
        setReady(false)
        return
      }
      const next = ['', '', '']
      result.phones.forEach((phone, index) => {
        if (index < 3) next[index] = phone
      })
      setPhones(next)
      setEnabled(result.enabled)
      setConsent(result.consented)
      setReady(true)
    }).catch(() => {
      if (active) {
        setReady(true)
        setMessage({ type: 'error', text: 'Text alerts could not be loaded.' })
      }
    })
    return () => {
      active = false
    }
  }, [])

  async function onSave(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    const result = await saveLeadTextAlerts({ phones, enabled, consent })
    setSaving(false)
    if (!result.ok) {
      if (result.comingSoon) setReady(false)
      setMessage({ type: 'error', text: result.error })
      return
    }
    setMessage({ type: 'ok', text: 'Text alerts saved.' })
  }

  if (ready === null) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-400 tracking-wide">Text alerts for new community member requests</h2>
        <p className="text-sm text-gray-500 mt-3">Loading...</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-400 tracking-wide">Text alerts for new community member requests</h2>
        <p className="text-sm text-neuro-navy mt-3">Text alerts are coming soon</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSave} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-gray-400 tracking-wide">Text alerts for new community member requests</h2>
        <p className="text-xs text-gray-500 mt-2">Add up to 3 mobiles. The office line on your profile is not texted.</p>
      </div>
      {LABELS.map((label, index) => (
        <div key={label}>
          <label htmlFor={`lead-alert-phone-${index}`} className="block text-sm font-bold text-neuro-navy mb-1">{label}</label>
          <input
            id={`lead-alert-phone-${index}`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phones[index]}
            onChange={(event) => {
              const next = [...phones]
              next[index] = event.target.value
              setPhones(next)
            }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm"
          />
        </div>
      ))}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-neuro-navy">Text alerts</p>
          <p className="text-xs text-gray-400">Turn off to stop texts about new community members.</p>
        </div>
        <button
          type="button"
          aria-pressed={enabled}
          aria-label="Text alerts"
          onClick={() => setEnabled((value) => !value)}
          className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-neuro-orange' : 'bg-gray-200'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${enabled ? 'left-5' : 'left-0.5'}`} />
        </button>
      </div>
      <div className="flex items-start gap-3">
        <input
          id="lead-alert-consent"
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1 h-5 w-5"
        />
        <label htmlFor="lead-alert-consent" className="text-sm text-neuro-navy leading-relaxed">
          <DoctorSmsConsentLabel />
        </label>
      </div>
      {message ? (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`text-sm font-bold ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {message.text}
        </p>
      ) : null}
      <button type="submit" disabled={saving} className="px-5 py-2 bg-neuro-navy text-white rounded-xl font-bold text-sm disabled:opacity-50">
        {saving ? 'Saving...' : 'Save text alerts'}
      </button>
    </form>
  )
}
