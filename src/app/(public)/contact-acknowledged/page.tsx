"use client"

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

type Action = 'called' | 'voicemail' | 'booked' | 'unreachable' | 'will_call'
type Patient = { name: string; phone: string; note: string; email: string; preferredTime: string; message: string }

function AcknowledgeContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const token = searchParams.get('token')

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<Action | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (token && (status === 'confirm' || status === 'already')) {
      fetch(`/api/contact-request/acknowledge/details?token=${encodeURIComponent(token)}`)
        .then(r => r.json())
        .then(d => { if (d.name) setPatient(d) })
        .catch(() => {})
    }
  }, [token, status])

  async function handleAction(action: Action) {
    if (!token || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/contact-request/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not save that. Please try again.')
      } else {
        setDone(action)
      }
    } catch {
      setError('Connection problem. Please try again.')
    }
    setLoading(false)
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'left' as const,
    marginBottom: '24px',
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0B1118',
      padding: '24px',
      fontFamily: '-apple-system, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
        {status === 'confirm' && !done && (
          <>
            {patient && (
              <div style={cardStyle}>
                <p style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                  Patient details
                </p>
                <p style={{ color: 'white', fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>{patient.name}</p>
                {patient.phone ? (
                  <p style={{ margin: '0 0 8px' }}>
                    <a href={`tel:${patient.phone}`} style={{ color: '#D66829', fontSize: '20px', fontWeight: 800, textDecoration: 'none' }}>{patient.phone}</a>
                  </p>
                ) : null}
                {patient.email ? (
                  <p style={{ margin: '0 0 8px' }}>
                    <a href={`mailto:${patient.email}`} style={{ color: '#D66829', fontSize: '16px', fontWeight: 700, textDecoration: 'none' }}>{patient.email}</a>
                  </p>
                ) : null}
                {patient.preferredTime ? <p style={{ color: '#d1d5db', fontSize: '14px', margin: '8px 0 0' }}>Best time: {patient.preferredTime}</p> : null}
                {patient.message ? <p style={{ color: '#9CA3AF', fontSize: '14px', margin: '8px 0 0' }}>{patient.message}</p> : null}
                {!patient.message && patient.note ? <p style={{ color: '#9CA3AF', fontSize: '14px', margin: '8px 0 0' }}>{patient.note}</p> : null}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ActionButton label="I called them" onClick={() => handleAction('called')} loading={loading} primary />
              <ActionButton label="I left a voicemail" onClick={() => handleAction('voicemail')} loading={loading} />
              <ActionButton label="They're booked" onClick={() => handleAction('booked')} loading={loading} />
              <ActionButton label="I'll call them today" onClick={() => handleAction('will_call')} loading={loading} />
              <ActionButton label="I couldn't reach them" onClick={() => handleAction('unreachable')} loading={loading} />
            </div>
            {error ? <p style={{ color: '#fca5a5', fontSize: '14px', marginTop: '16px' }}>{error}</p> : null}
          </>
        )}

        {done === 'called' || done === 'booked' ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Thank you</h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px' }}>
              {done === 'booked' ? 'We recorded that this patient is booked. Reminders will stop.' : 'We recorded that you contacted this patient. Reminders will stop.'}
            </p>
          </>
        ) : null}

        {done === 'voicemail' || done === 'will_call' ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128221;</div>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Got it</h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px', marginBottom: '16px' }}>
              {done === 'voicemail' ? 'We noted the voicemail. We will check back in 24 hours if we do not hear that you reached them.' : 'We noted that you will call today. We will check back in 24 hours.'}
            </p>
            {patient ? <PatientCard patient={patient} cardStyle={cardStyle} /> : null}
          </>
        ) : null}

        {done === 'unreachable' ? (
          <>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>We'll take it from here</h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px' }}>We flagged this request so the NeuroChiro team can follow up.</p>
          </>
        ) : null}

        {status === 'already' && !done ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Already recorded</h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px' }}>This request was already confirmed. Thank you.</p>
          </>
        ) : null}

        {status === 'expired' && <SimpleMessage title="Link expired" text="This acknowledgment link has expired. Please contact us." />}
        {status === 'withdrawn' && <SimpleMessage title="Request withdrawn" text="This patient withdrew their contact request. No action needed." />}
        {status === 'invalid' && <SimpleMessage title="Invalid link" text="This link is not valid. Use the button in the contact request email." />}
        {!status && <SimpleMessage title="NeuroChiro" text="" />}
      </div>
    </div>
  )
}

function PatientCard({ patient, cardStyle }: { patient: Patient; cardStyle: React.CSSProperties }) {
  return (
    <div style={cardStyle}>
      <p style={{ color: 'white', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>{patient.name}</p>
      {patient.phone ? <a href={`tel:${patient.phone}`} style={{ color: '#D66829', fontSize: '18px', fontWeight: 700, textDecoration: 'none' }}>{patient.phone}</a> : null}
    </div>
  )
}

function ActionButton({ label, onClick, loading, primary }: { label: string; onClick: () => void; loading: boolean; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '16px 24px',
        background: primary ? '#22c55e' : 'rgba(255,255,255,0.1)',
        color: 'white',
        border: primary ? 'none' : '1px solid rgba(255,255,255,0.2)',
        borderRadius: '12px',
        fontWeight: 700,
        fontSize: '16px',
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1,
        minHeight: '52px',
      }}
    >
      {loading ? '...' : label}
    </button>
  )
}

function SimpleMessage({ title, text }: { title: string; text: string }) {
  return (
    <>
      <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>{title}</h1>
      {text ? <p style={{ color: '#9CA3AF', fontSize: '16px' }}>{text}</p> : null}
    </>
  )
}

export default function ContactAcknowledgedPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#0B1118' }} />}>
      <AcknowledgeContent />
    </Suspense>
  )
}
