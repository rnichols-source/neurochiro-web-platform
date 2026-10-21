'use client'

import { useState, useEffect, useRef } from 'react'
import { submitUKProfile } from './actions'

const LS_KEY = 'nc_uk_pending_submission'

interface Props {
  prefillName: string
  prefillEmail: string
  sessionId: string
  countryCode?: string
  source?: string
  postcodeLabel?: string
  postcodeHint?: string
}

export default function WelcomeForm({ prefillName, prefillEmail, sessionId, countryCode = 'GB', source = 'uca_birmingham_2026', postcodeLabel = 'Postcode', postcodeHint = 'SW6 1QR' }: Props) {
  const [name, setName] = useState(prefillName)
  const [email, setEmail] = useState(prefillEmail)
  const [clinic, setClinic] = useState('')
  const [city, setCity] = useState('')
  const [postcode, setPostcode] = useState('')
  const [instagram, setInstagram] = useState('')
  const [website, setWebsite] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const retryRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // On mount: retry any pending localStorage submission
  useEffect(() => {
    const pending = localStorage.getItem(LS_KEY)
    if (pending) {
      try {
        const data = JSON.parse(pending)
        submitUKProfile(data).then(res => {
          if (res.success) localStorage.removeItem(LS_KEY)
        }).catch(() => {})
      } catch {}
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !clinic.trim() || !city.trim() || !postcode.trim() || !instagram.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    setError('')

    const payload = {
      name: name.trim(),
      email: email.trim(),
      clinic_name: clinic.trim(),
      city: city.trim(),
      postcode: postcode.trim(),
      instagram: instagram.trim(),
      website: website.trim(),
      phone: phone.trim(),
      stripe_session_id: sessionId,
      country_code: countryCode,
      source: source,
    }

    try {
      const res = await submitUKProfile(payload)
      if (res.success) {
        localStorage.removeItem(LS_KEY)
        setDone(true)
      } else {
        // Save to localStorage and show success anyway
        localStorage.setItem(LS_KEY, JSON.stringify(payload))
        setDone(true)
        // Retry in background
        retryRef.current = setInterval(async () => {
          try {
            const retry = await submitUKProfile(payload)
            if (retry.success) {
              localStorage.removeItem(LS_KEY)
              if (retryRef.current) clearInterval(retryRef.current)
            }
          } catch {}
        }, 15000)
      }
    } catch {
      // Network failure: save locally and show success
      localStorage.setItem(LS_KEY, JSON.stringify(payload))
      setDone(true)
      retryRef.current = setInterval(async () => {
        try {
          const retry = await submitUKProfile(payload)
          if (retry.success) {
            localStorage.removeItem(LS_KEY)
            if (retryRef.current) clearInterval(retryRef.current)
          }
        } catch {}
      }, 15000)
    }

    setSubmitting(false)
  }

  if (done) {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontFamily: 'Lato, sans-serif', fontSize: 'clamp(36px, 10vw, 56px)', fontWeight: 900, color: '#F5F3EF', marginBottom: 16 }}>
            You're in.
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 500, color: '#F5F3EF', lineHeight: 1.5, marginBottom: 8 }}>
            Your profile goes live this week.
          </p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(14px, 3.5vw, 18px)', fontWeight: 400, color: '#4B5563', lineHeight: 1.5, marginBottom: 32 }}>
            Follow @neurochirodirectory so you see it.
          </p>
          <a
            href="https://www.instagram.com/neurochirodirectory/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: '#D66829',
              color: '#F5F3EF',
              fontFamily: 'Lato, sans-serif',
              fontSize: 'clamp(16px, 4vw, 20px)',
              fontWeight: 700,
              padding: '16px 32px',
              borderRadius: 12,
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(214,104,41,0.3)',
            }}
          >
            @neurochirodirectory
          </a>
          <div style={{ marginTop: 48, fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(12px, 3vw, 14px)', color: '#4B5563' }}>
            neurochiro.co · @dr.raymondnichols
          </div>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#1E2D3B',
    border: '2px solid transparent',
    borderRadius: 8,
    padding: '14px 16px',
    fontSize: 16,
    fontFamily: 'Montserrat, sans-serif',
    color: '#F5F3EF',
    outline: 'none',
    marginBottom: 12,
    WebkitAppearance: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 13,
    fontWeight: 500,
    color: '#4B5563',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@700;900&family=Montserrat:wght@400;500&display=swap');
        input:focus { border-color: #D66829 !important; }
        input::placeholder { color: #4B5563; }
      `}</style>
      <div style={pageStyle}>
        <div style={{ maxWidth: 480, width: '100%', padding: '0 24px' }}>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'Lato, sans-serif', fontSize: 'clamp(28px, 7vw, 40px)', fontWeight: 700, color: '#F5F3EF', marginBottom: 8 }}>
              One more step.
            </h1>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(14px, 3.5vw, 17px)', fontWeight: 400, color: '#4B5563' }}>
              I need five things to build your listing.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Full name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Jane Smith" style={inputStyle} autoComplete="name" required />

            <label style={labelStyle}>Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@clinic.co.uk" style={inputStyle} autoComplete="email" required />

            <label style={labelStyle}>Clinic / practice name *</label>
            <input type="text" value={clinic} onChange={e => setClinic(e.target.value)} placeholder="Smith Chiropractic" style={inputStyle} required />

            <label style={labelStyle}>City *</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Birmingham" style={inputStyle} autoComplete="address-level2" required />

            <label style={labelStyle}>{postcodeLabel} *</label>
            <input type="text" value={postcode} onChange={e => setPostcode(e.target.value)} placeholder={postcodeHint} style={inputStyle} autoComplete="postal-code" required />

            <label style={labelStyle}>Instagram handle *</label>
            <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@yourhandle" style={inputStyle} required />

            <label style={labelStyle}>Website <span style={{ color: '#4B5563', fontWeight: 400 }}>(optional)</span></label>
            <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://smithchiro.co.uk" style={inputStyle} autoComplete="url" />

            <label style={labelStyle}>Phone <span style={{ color: '#4B5563', fontWeight: 400 }}>(optional)</span></label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="07700 900000" style={inputStyle} autoComplete="tel" />

            {error && (
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#D66829', marginBottom: 12 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: submitting ? '#4B5563' : '#D66829',
                color: '#F5F3EF',
                fontFamily: 'Lato, sans-serif',
                fontSize: 'clamp(18px, 4.5vw, 22px)',
                fontWeight: 700,
                padding: '18px 32px',
                borderRadius: 12,
                border: 'none',
                cursor: submitting ? 'wait' : 'pointer',
                marginTop: 8,
                boxShadow: submitting ? 'none' : '0 4px 24px rgba(214,104,41,0.3)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {submitting ? 'Sending...' : 'Build my profile'}
            </button>
          </form>

          <div style={{ marginTop: 32, textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(12px, 3vw, 14px)', color: '#4B5563' }}>
            neurochiro.co · @dr.raymondnichols
          </div>
        </div>
      </div>
    </>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'radial-gradient(ellipse at 50% 15%, #1E2D3B 0%, #131313 55%)',
  color: '#F5F3EF',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 0',
}
