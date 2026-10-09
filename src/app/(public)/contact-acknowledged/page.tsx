"use client"

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

function AcknowledgeContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const token = searchParams.get('token')

  const [patient, setPatient] = useState<{ name: string; phone: string; note: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    if (token && (status === 'confirm' || status === 'already')) {
      fetch(`/api/contact-request/acknowledge/details?token=${token}`)
        .then(r => r.json())
        .then(d => { if (d.name) setPatient(d) })
        .catch(() => {})
    }
  }, [token, status])

  async function handleAction(action: 'called' | 'will_call') {
    if (!token) return
    setLoading(true)
    try {
      await fetch('/api/contact-request/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      })
      setDone(action)
    } catch {}
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
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0B1118',
      padding: '24px',
      fontFamily: '-apple-system, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>

        {/* Confirm: show question with two buttons */}
        {status === 'confirm' && !done && (
          <>
            {patient && (
              <div style={cardStyle}>
                <p style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                  Patient Details
                </p>
                <p style={{ color: 'white', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                  {patient.name}
                </p>
                <p style={{ marginBottom: patient.note ? '8px' : '0' }}>
                  <a href={`tel:${patient.phone}`} style={{ color: '#D66829', fontSize: '20px', fontWeight: 700, textDecoration: 'none' }}>
                    {patient.phone}
                  </a>
                </p>
                {patient.note && (
                  <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '8px' }}>
                    Note: {patient.note}
                  </p>
                )}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleAction('called')}
                disabled={loading}
                style={{
                  padding: '16px 24px',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '16px',
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  minHeight: '52px',
                }}
              >
                {loading ? '...' : "I've called them"}
              </button>
              <button
                onClick={() => handleAction('will_call')}
                disabled={loading}
                style={{
                  padding: '16px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '16px',
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  minHeight: '52px',
                }}
              >
                {loading ? '...' : "I'll call them today"}
              </button>
            </div>
          </>
        )}

        {/* Done: called */}
        {done === 'called' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              Thank you
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px' }}>
              We have recorded that you contacted this patient. You are all set.
            </p>
          </>
        )}

        {/* Done: will call */}
        {done === 'will_call' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128221;</div>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              Got it
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px', marginBottom: '16px' }}>
              We have noted that you will call today. The patient's details are above for quick reference.
            </p>
            {patient && (
              <div style={cardStyle}>
                <p style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                  {patient.name}
                </p>
                <a href={`tel:${patient.phone}`} style={{ color: '#D66829', fontSize: '18px', fontWeight: 700, textDecoration: 'none' }}>
                  {patient.phone}
                </a>
              </div>
            )}
          </>
        )}

        {/* Already confirmed */}
        {status === 'already' && !done && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              Already recorded
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px' }}>
              This request was already confirmed. Thank you.
            </p>
          </>
        )}

        {status === 'expired' && <SimpleMessage title="Link expired" text="This acknowledgment link has expired. Please contact us." />}
        {status === 'withdrawn' && <SimpleMessage title="Request withdrawn" text="This patient withdrew their contact request. No action needed." />}
        {status === 'invalid' && <SimpleMessage title="Invalid link" text="This link is not valid. If you received a contact request email, please use the button in that email." />}
        {!status && <SimpleMessage title="NeuroChiro" text="" />}
      </div>
    </div>
  )
}

function SimpleMessage({ title, text }: { title: string; text: string }) {
  return (
    <>
      <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>{title}</h1>
      {text && <p style={{ color: '#9CA3AF', fontSize: '16px' }}>{text}</p>}
    </>
  )
}

export default function ContactAcknowledgedPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0B1118' }} />}>
      <AcknowledgeContent />
    </Suspense>
  )
}
