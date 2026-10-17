import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NeuroChiro UK — Join the Directory',
  description: '139 people in the UK asked for a nervous system chiropractor in the last 10 days. Join the founding UK directory.',
}

// ── EDITABLE CONSTANTS ──
const STRIPE_URL = 'https://buy.stripe.com/14A00ldfh3ZO9uC9Q87wA0Z'
const SPOTS_REMAINING = 23
const SPOTS_TOTAL = 25

const spotsLine = SPOTS_REMAINING > 0
  ? `${SPOTS_REMAINING} of ${SPOTS_TOTAL} founding spots left`
  : 'Founding spots filled'

export default function UKLandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@700;900&family=Montserrat:wght@400;500&display=swap');
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 20%, #1E2D3B 0%, #131313 60%)',
        color: '#F5F3EF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '100px 24px 48px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 480, width: '100%' }}>

          {/* Hero number */}
          <div style={{
            fontFamily: 'Lato, sans-serif',
            fontSize: 'clamp(80px, 22vw, 150px)',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: '#F5F3EF',
            marginBottom: 12,
            textShadow: '0 0 60px rgba(214,104,41,0.3), 0 0 120px rgba(214,104,41,0.15)',
          }}>
            139
          </div>

          {/* Claim */}
          <p style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 'clamp(16px, 4.2vw, 22px)',
            fontWeight: 500,
            lineHeight: 1.4,
            color: '#F5F3EF',
            margin: '0 0 4px',
          }}>
            people in the UK asked me for a chiropractor
          </p>
          <p style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 'clamp(16px, 4.2vw, 22px)',
            fontWeight: 500,
            lineHeight: 1.4,
            color: '#D66829',
            margin: '0 0 36px',
          }}>
            in the last 10 days
          </p>

          {/* Headline */}
          <p style={{
            fontFamily: 'Lato, sans-serif',
            fontSize: 'clamp(20px, 5vw, 28px)',
            fontWeight: 700,
            color: '#F5F3EF',
            margin: '0 0 32px',
            fontStyle: 'italic',
            lineHeight: 1.3,
          }}>
            I have two doctors in the whole country.
          </p>

          {/* Bullets */}
          <div style={{
            textAlign: 'left',
            margin: '0 auto 32px',
            maxWidth: 400,
          }}>
            {[
              'Patients searching your area get routed to you',
              'Your profile, your handle, your clinic',
              'Founding UK member pricing, locked',
            ].map((text, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 14,
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 'clamp(14px, 3.8vw, 17px)',
                fontWeight: 400,
                lineHeight: 1.5,
                color: '#F5F3EF',
              }}>
                <span style={{ color: '#D66829', fontWeight: 700, flexShrink: 0 }}>&#10003;</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Spots counter */}
          <p style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            fontWeight: 500,
            color: '#F5F3EF',
            margin: '0 0 16px',
          }}>
            {spotsLine}
          </p>

          {/* CTA button */}
          <a
            href={STRIPE_URL}
            style={{
              display: 'block',
              background: '#D66829',
              color: '#F5F3EF',
              fontFamily: 'Lato, sans-serif',
              fontSize: 'clamp(18px, 4.5vw, 22px)',
              fontWeight: 700,
              padding: '20px 32px',
              borderRadius: 12,
              textDecoration: 'none',
              marginBottom: 12,
              boxShadow: '0 4px 24px rgba(214,104,41,0.3)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Join for £79/month
          </a>

          {/* Founding rate note */}
          <p style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 'clamp(12px, 3vw, 14px)',
            fontWeight: 500,
            color: '#D66829',
            margin: '0 0 24px',
          }}>
            Founding rate. First 25 UK doctors.
          </p>

          {/* Directory note */}
          <p style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 'clamp(12px, 3vw, 14px)',
            fontWeight: 400,
            color: '#4B5563',
            margin: '0 0 32px',
            lineHeight: 1.5,
          }}>
            The UK directory is being built now.<br />
            Founding members are listed first.
          </p>

          {/* Footer */}
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 'clamp(12px, 3vw, 14px)',
            fontWeight: 400,
            color: '#4B5563',
          }}>
            neurochiro.co &nbsp;·&nbsp; @dr.raymondnichols
          </div>

        </div>
      </div>
    </>
  )
}
