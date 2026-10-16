import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NeuroChiro UK — Join the Directory',
  description: '139 people in the UK asked for a nervous system chiropractor in the last 10 days. Join the founding UK directory.',
}

// ── STRIPE LINK — replace with real URL ──
const STRIPE_URL = 'https://buy.stripe.com/PLACEHOLDER_UK_79'

export default function UKLandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0E1A',
      color: '#F5F3EF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 480, width: '100%' }}>

        {/* The number */}
        <div style={{
          fontSize: 'clamp(72px, 20vw, 140px)',
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          color: '#fff',
          marginBottom: 8,
        }}>
          139
        </div>

        {/* The claim */}
        <p style={{
          fontSize: 'clamp(18px, 4.5vw, 24px)',
          lineHeight: 1.4,
          color: '#ccc',
          margin: '0 0 40px',
        }}>
          people in the UK asked me for a chiropractor<br />
          <span style={{ color: '#4A90D9' }}>in the last 10 days</span>
        </p>

        {/* The hook */}
        <p style={{
          fontSize: 'clamp(20px, 5vw, 28px)',
          fontWeight: 700,
          color: '#F5F3EF',
          margin: '0 0 40px',
          fontStyle: 'italic',
        }}>
          I had nobody to send them to.
        </p>

        {/* Bullets */}
        <div style={{
          textAlign: 'left',
          margin: '0 auto 40px',
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
              marginBottom: 16,
              fontSize: 'clamp(15px, 3.8vw, 18px)',
              lineHeight: 1.5,
              color: '#ccc',
            }}>
              <span style={{ color: '#4A90D9', fontWeight: 700, flexShrink: 0 }}>&#10003;</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <a
          href={STRIPE_URL}
          style={{
            display: 'block',
            background: '#4A90D9',
            color: '#fff',
            fontSize: 'clamp(18px, 4.5vw, 22px)',
            fontWeight: 700,
            padding: '18px 32px',
            borderRadius: 12,
            textDecoration: 'none',
            marginBottom: 16,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Join for £79/month
        </a>

        {/* Sub-CTA note */}
        <p style={{
          fontSize: 'clamp(12px, 3vw, 14px)',
          color: '#666',
          margin: '0 0 48px',
          lineHeight: 1.5,
        }}>
          The UK directory is being built now.<br />
          Founding members are listed first.
        </p>

        {/* Footer */}
        <div style={{
          fontSize: 'clamp(12px, 3vw, 14px)',
          color: '#444',
        }}>
          neurochiro.co &nbsp;·&nbsp; @dr.raymondnichols
        </div>

      </div>
    </div>
  )
}
