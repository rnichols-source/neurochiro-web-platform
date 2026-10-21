import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCountryConfig, MEMBERSHIP_BENEFITS, ROUTE_TO_COUNTRY } from '@/lib/country-pages'
import { getCountryDemandStats } from './actions'

export async function generateStaticParams() {
  return Object.keys(ROUTE_TO_COUNTRY).map(slug => ({ countrySlug: slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ countrySlug: string }> }): Promise<Metadata> {
  const { countrySlug } = await params
  const config = getCountryConfig(countrySlug)
  if (!config) return {}
  return {
    title: `NeuroChiro ${config.demonym} — Join the Directory`,
    description: `People in ${config.name} are asking for a nervous system chiropractor. Join the founding ${config.demonym} directory.`,
  }
}

export const revalidate = 300 // 5 min ISR

export default async function CountryPage({ params }: { params: Promise<{ countrySlug: string }> }) {
  const { countrySlug } = await params
  const config = getCountryConfig(countrySlug)
  if (!config) notFound()

  const stats = await getCountryDemandStats(config.code)

  const gapLine = stats.doctorCount === 0
    ? `I don't have a single chiropractor in ${config.name}. Every one of those ${stats.demandCount} people had nowhere to go.`
    : `I have ${stats.doctorCount} doctor${stats.doctorCount > 1 ? 's' : ''} in the whole country.`

  const spotsLine = config.spotsRemaining > 0
    ? `${config.spotsRemaining} of ${config.foundingSpots} founding spots left`
    : 'Founding spots filled'

  const benefitGroups = [
    { title: 'PATIENTS', items: MEMBERSHIP_BENEFITS.patients },
    { title: 'CONTENT', items: MEMBERSHIP_BENEFITS.content },
    { title: 'COMMUNITY', items: MEMBERSHIP_BENEFITS.community },
    { title: 'PRACTICE TOOLS', items: MEMBERSHIP_BENEFITS.tools },
  ]

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@700;900&family=Montserrat:wght@400;500;600&display=swap');`}</style>
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 15%, #1E2D3B 0%, #131313 55%)',
        color: '#F0EBDD',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '100px 24px 48px',
      }}>
        <div style={{ maxWidth: 520, width: '100%' }}>

          {/* Hero number */}
          <div style={{
            textAlign: 'center',
            fontFamily: 'Lato, sans-serif', fontSize: 'clamp(72px, 20vw, 140px)',
            fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em',
            color: '#F0EBDD', marginBottom: 12,
            textShadow: '0 0 60px rgba(214,104,41,0.25), 0 0 120px rgba(214,104,41,0.12)',
          }}>
            {stats.demandCount}
          </div>

          {/* Claim */}
          <p style={{
            textAlign: 'center', fontFamily: 'Montserrat, sans-serif',
            fontSize: 'clamp(16px, 4.2vw, 22px)', fontWeight: 500,
            lineHeight: 1.4, color: '#F0EBDD', margin: '0 0 4px',
          }}>
            people in {config.name} asked me for a chiropractor
          </p>
          {stats.periodLabel && (
            <p style={{
              textAlign: 'center', fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(16px, 4.2vw, 22px)', fontWeight: 500,
              lineHeight: 1.4, color: '#D66829', margin: '0 0 32px',
            }}>
              {stats.periodLabel}
            </p>
          )}

          {/* Gap line */}
          <p style={{
            textAlign: 'center', fontFamily: 'Lato, sans-serif',
            fontSize: 'clamp(18px, 4.5vw, 26px)', fontWeight: 700,
            color: '#F0EBDD', margin: '0 0 32px', fontStyle: 'italic', lineHeight: 1.3,
          }}>
            {gapLine}
          </p>

          {/* Top cities */}
          {stats.topCities.length > 0 && (
            <div style={{
              background: '#1E2D3B', borderRadius: 12, padding: '20px 24px', marginBottom: 32,
            }}>
              <p style={{
                fontFamily: 'Lato, sans-serif', fontSize: 12, fontWeight: 700,
                color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px',
              }}>Where the demand is</p>
              {stats.topCities.map(({ city, count }) => (
                <div key={city} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  padding: '8px 0', borderBottom: '1px solid rgba(240,235,221,0.06)',
                  fontFamily: 'Montserrat, sans-serif', fontSize: 15,
                }}>
                  <span style={{ color: '#F0EBDD' }}>{city}</span>
                  <span style={{ color: '#D66829', fontWeight: 600, fontFamily: 'Lato, sans-serif' }}>{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* What you get */}
          <div style={{ marginBottom: 32 }}>
            <p style={{
              fontFamily: 'Lato, sans-serif', fontSize: 'clamp(18px, 4.5vw, 22px)',
              fontWeight: 700, color: '#F0EBDD', margin: '0 0 20px', textAlign: 'center',
            }}>What you get</p>

            {benefitGroups.map(group => (
              <div key={group.title} style={{ marginBottom: 20 }}>
                <p style={{
                  fontFamily: 'Lato, sans-serif', fontSize: 11, fontWeight: 700,
                  color: '#D66829', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px',
                }}>{group.title}</p>
                {group.items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8,
                    fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(13px, 3.5vw, 15px)',
                    lineHeight: 1.5, color: '#F0EBDD',
                  }}>
                    <span style={{ color: '#D66829', fontWeight: 700, flexShrink: 0 }}>&#10003;</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Spots counter */}
          {config.foundingSpots > 0 && (
            <p style={{
              textAlign: 'center', fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: 500,
              color: '#F0EBDD', margin: '0 0 16px',
            }}>
              {spotsLine}
            </p>
          )}

          {/* CTA button */}
          <a
            href={config.stripeUrl}
            style={{
              display: 'block', textAlign: 'center',
              background: '#D66829', color: '#F0EBDD',
              fontFamily: 'Lato, sans-serif',
              fontSize: 'clamp(18px, 4.5vw, 22px)', fontWeight: 700,
              padding: '20px 32px', borderRadius: 12,
              textDecoration: 'none', marginBottom: 12,
              boxShadow: '0 4px 24px rgba(214,104,41,0.3)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Join for {config.symbol}{config.price}/month
          </a>

          {/* Founding rate note */}
          {config.foundingSpots > 0 && (
            <p style={{
              textAlign: 'center', fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 500,
              color: '#D66829', margin: '0 0 24px',
            }}>
              Founding rate. First {config.foundingSpots} {config.demonym} doctors.
            </p>
          )}

          {/* Directory note */}
          <p style={{
            textAlign: 'center', fontFamily: 'Montserrat, sans-serif',
            fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 400,
            color: '#4B5563', margin: '0 0 32px', lineHeight: 1.5,
          }}>
            The {config.demonym} directory is being built now.<br />
            Founding members are listed first.
          </p>

          {/* Footer */}
          <div style={{
            textAlign: 'center', fontFamily: 'Montserrat, sans-serif',
            fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 400, color: '#4B5563',
          }}>
            neurochiro.co &nbsp;·&nbsp; @dr.raymondnichols
          </div>
        </div>
      </div>
    </>
  )
}
