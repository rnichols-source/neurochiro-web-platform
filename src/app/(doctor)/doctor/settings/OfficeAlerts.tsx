'use client'

import { useEffect, useState } from 'react'
import { loadOfficeAlerts, saveOfficeAlerts, type AlertChannel } from './office-alert-actions'

const CHOICES: { id: AlertChannel; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'text', label: 'Text' },
  { id: 'both', label: 'Both' },
]

export default function OfficeAlerts() {
  const [channel, setChannel] = useState<AlertChannel>('both')
  const [emails, setEmails] = useState('')
  const [note, setNote] = useState('')
  const [ready, setReady] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadOfficeAlerts().then((result) => {
      if ('error' in result) {
        setNote(result.error)
        return
      }
      if (!result.ready) {
        setReady(false)
        setNote(result.note)
        return
      }
      setChannel(result.channel)
      setEmails(result.frontDeskEmails.join(', '))
    }).catch(() => setNote('Alert choices could not be loaded. Refresh this page and try again.'))
  }, [])

  async function onSave(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setNote('')
    const result = await saveOfficeAlerts({ channel, frontDeskEmails: emails })
    setSaving(false)
    setNote(result.ok ? 'Saved. New requests use this choice.' : result.error)
  }

  return (
    <form onSubmit={onSave} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-[#15202B]">New request alerts</h2>
        <p className="text-sm text-[#3d4a57] mt-2">Choose email, text, or both. Text uses the mobiles in the section below. A front desk email gets the same email you do.</p>
      </div>
      {ready ? (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="How to send new request alerts">
            {CHOICES.map((choice) => (
              <button
                key={choice.id}
                type="button"
                aria-pressed={channel === choice.id}
                onClick={() => setChannel(choice.id)}
                className={`min-h-11 rounded-xl px-4 text-sm font-bold ${channel === choice.id ? 'bg-[#1E2D3B] text-white' : 'bg-[#F5F3EF] text-[#15202B]'}`}
              >
                {choice.label}
              </button>
            ))}
          </div>
          <label className="block text-sm font-bold text-[#15202B]" htmlFor="front-desk-email">Front desk email</label>
          <input
            id="front-desk-email"
            type="text"
            inputMode="email"
            autoComplete="email"
            value={emails}
            onChange={(event) => setEmails(event.target.value)}
            placeholder="frontdesk@yourpractice.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#15202B]"
          />
          <button type="submit" disabled={saving} className="min-h-11 px-5 rounded-xl bg-[#1E2D3B] text-white text-sm font-bold">
            {saving ? 'Saving...' : 'Save alert choices'}
          </button>
        </>
      ) : null}
      {note ? <p className="text-sm text-[#15202B]" role="status">{note}</p> : null}
    </form>
  )
}
