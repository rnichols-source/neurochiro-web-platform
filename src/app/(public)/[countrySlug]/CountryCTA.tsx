'use client'

import { useState } from 'react'

interface Props {
  symbol: string
  price: number
  priceAnnual: number
  stripeUrl: string
  stripeUrlAnnual: string
  /** Additional text under the button */
  subtext?: string
  /** Dark variant (white text on navy) */
  dark?: boolean
}

export default function CountryCTA({
  symbol,
  price,
  priceAnnual,
  stripeUrl,
  stripeUrlAnnual,
  subtext,
  dark = false,
}: Props) {
  const hasAnnual = !!stripeUrlAnnual
  const [annual, setAnnual] = useState(false)

  const textColor = dark ? '#F0EBDD' : '#1E2D3B'
  const mutedColor = dark ? 'rgba(240,235,221,0.6)' : '#6B7280'

  return (
    <div style={{ maxWidth: 520, width: '100%', margin: '0 auto' }}>
      {/* Toggle */}
      {hasAnnual && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 0,
          marginBottom: 20, borderRadius: 10, overflow: 'hidden',
          border: `2px solid ${dark ? 'rgba(240,235,221,0.2)' : '#D9D4C7'}`,
          width: 'fit-content', margin: '0 auto 20px',
        }}>
          <button
            onClick={() => setAnnual(false)}
            style={{
              padding: '10px 24px', border: 'none', cursor: 'pointer',
              background: !annual ? '#D66829' : 'transparent',
              color: !annual ? '#fff' : mutedColor,
              fontFamily: 'Lato, sans-serif', fontSize: 14, fontWeight: 700,
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            style={{
              padding: '10px 24px', border: 'none', cursor: 'pointer',
              background: annual ? '#D66829' : 'transparent',
              color: annual ? '#fff' : mutedColor,
              fontFamily: 'Lato, sans-serif', fontSize: 14, fontWeight: 700,
            }}
          >
            Annual
          </button>
        </div>
      )}

      {/* Button */}
      <a
        href={annual && hasAnnual ? stripeUrlAnnual : stripeUrl}
        style={{
          display: 'block', textAlign: 'center',
          background: '#D66829', color: '#fff',
          fontFamily: 'Lato, sans-serif',
          fontSize: 'clamp(18px, 4.5vw, 22px)', fontWeight: 700,
          padding: '20px 32px', borderRadius: 12,
          textDecoration: 'none', marginBottom: 8,
          boxShadow: '0 4px 24px rgba(214,104,41,0.3)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {annual && hasAnnual
          ? `Join for ${symbol}${priceAnnual}/year`
          : `Join for ${symbol}${price}/month`}
      </a>

      {/* Annual savings note */}
      {annual && hasAnnual && (
        <p style={{
          textAlign: 'center', fontFamily: 'Montserrat, sans-serif',
          fontSize: 'clamp(13px, 3.2vw, 15px)', fontWeight: 500,
          color: '#D66829', margin: '0 0 4px',
        }}>
          2 months free. Works out to {symbol}{Math.round(priceAnnual / 12)}/month.
        </p>
      )}

      {/* Subtext */}
      {subtext && (
        <p style={{
          textAlign: 'center', fontFamily: 'Montserrat, sans-serif',
          fontSize: 'clamp(13px, 3.2vw, 15px)', fontWeight: 500,
          color: mutedColor, margin: '4px 0 0', lineHeight: 1.5,
        }}>
          {subtext}
        </p>
      )}
    </div>
  )
}
