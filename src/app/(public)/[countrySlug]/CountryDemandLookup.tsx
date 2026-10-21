'use client'

import { useState } from 'react'
import { checkDemandNearby, type DemandNearbyResult } from '@/app/(public)/pro/actions'

interface Props {
  country: string
  countryName: string
  postcodeLabel: string
  postcodeHint: string
  symbol: string
  price: number
  stripeUrl: string
  totalDemand: number
}

export default function CountryDemandLookup({
  country,
  countryName,
  postcodeLabel,
  postcodeHint,
  symbol,
  price,
  stripeUrl,
  totalDemand,
}: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DemandNearbyResult | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await checkDemandNearby(query.trim(), country)
      setResult(res)
    } catch {
      setResult({ cityLabel: '', hasDemand: false, mentionsNearby: null, subscribersNearby: null, doctorsNearby: 0, error: 'Something went wrong. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  const nearbyCount = (result?.mentionsNearby || 0) + (result?.subscribersNearby || 0)

  return (
    <div style={{
      maxWidth: 520, width: '100%', margin: '0 auto',
    }}>
      <h2 style={{
        fontFamily: 'Lato, sans-serif', fontSize: 'clamp(22px, 5vw, 30px)',
        fontWeight: 700, color: '#1E2D3B', margin: '0 0 8px', textAlign: 'center',
      }}>
        Check your area
      </h2>
      <p style={{
        fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(14px, 3.5vw, 16px)',
        color: '#4B5563', margin: '0 0 24px', textAlign: 'center', lineHeight: 1.5,
      }}>
        Enter your {postcodeLabel.toLowerCase()} or city to see how many people near you are looking.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={postcodeHint}
          style={{
            flex: 1, padding: '14px 16px', borderRadius: 10,
            border: '2px solid #D9D4C7', background: '#fff',
            fontFamily: 'Montserrat, sans-serif', fontSize: 16,
            color: '#1E2D3B', outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            padding: '14px 24px', borderRadius: 10, border: 'none',
            background: loading ? '#9CA3AF' : '#D66829', color: '#fff',
            fontFamily: 'Lato, sans-serif', fontSize: 16, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Checking...' : 'Look up'}
        </button>
      </form>

      {result && (
        <div style={{
          background: '#fff', borderRadius: 12, padding: '20px 24px',
          border: '2px solid #D9D4C7',
        }}>
          {result.error ? (
            <p style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 15,
              color: '#991B1B', margin: 0, lineHeight: 1.5,
            }}>
              {result.error}
            </p>
          ) : result.ambiguous && result.ambiguous.length > 0 ? (
            <div>
              <p style={{
                fontFamily: 'Montserrat, sans-serif', fontSize: 15,
                color: '#1E2D3B', margin: '0 0 12px', lineHeight: 1.5,
              }}>
                Multiple matches. Did you mean:
              </p>
              {result.ambiguous.map((a, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(`${a.city}, ${a.state}`); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 14px', marginBottom: 6, borderRadius: 8,
                    border: '1px solid #D9D4C7', background: '#FAFAF7',
                    fontFamily: 'Montserrat, sans-serif', fontSize: 15,
                    color: '#1E2D3B', cursor: 'pointer',
                  }}
                >
                  {a.city}, {a.state}
                </button>
              ))}
            </div>
          ) : nearbyCount === 0 && !result.hasDemand ? (
            <p style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(14px, 3.5vw, 16px)',
              color: '#1E2D3B', margin: 0, lineHeight: 1.6,
            }}>
              Nobody in your immediate area yet, but there are <strong style={{ color: '#D66829' }}>{totalDemand}</strong> people
              across {countryName} and nobody to send any of them to.
            </p>
          ) : (
            <p style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(14px, 3.5vw, 16px)',
              color: '#1E2D3B', margin: 0, lineHeight: 1.6,
            }}>
              <strong style={{ color: '#D66829' }}>{nearbyCount}</strong> {nearbyCount === 1 ? 'person' : 'people'} near{' '}
              <strong>{result.cityLabel}</strong> {result.doctorsNearby === 0 ? 'and no doctor to send them to.' : `and only ${result.doctorsNearby} doctor${result.doctorsNearby > 1 ? 's' : ''} nearby.`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
