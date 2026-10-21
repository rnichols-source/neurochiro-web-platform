import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCountryConfig, MEMBERSHIP_BENEFITS, ROUTE_TO_COUNTRY } from '@/lib/country-pages'
import { getCountryDemandStats } from './actions'
import CountryDemandLookup from './CountryDemandLookup'
import CountryCTA from './CountryCTA'

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

export const revalidate = 300

export default async function CountryPage({ params }: { params: Promise<{ countrySlug: string }> }) {
  const { countrySlug } = await params
  const config = getCountryConfig(countrySlug)
  if (!config) notFound()

  const stats = await getCountryDemandStats(config.code)

  const benefitGroups = [
    { key: 'PATIENTS', title: 'Patients', items: MEMBERSHIP_BENEFITS.patients },
    { key: 'CONTENT', title: 'Content', items: MEMBERSHIP_BENEFITS.content },
    { key: 'COMMUNITY', title: 'Community', items: MEMBERSHIP_BENEFITS.community },
    { key: 'TOOLS', title: 'Practice Tools', items: MEMBERSHIP_BENEFITS.tools },
  ]

  const faqItems = [
    {
      q: 'What if nobody is near me yet?',
      a: 'Then you are first in line. Use the lookup above to see what is already waiting in your area. When someone asks, you are the one they get.',
    },
    {
      q: 'How fast am I live?',
      a: 'Within 48 hours of completing your profile.',
    },
    {
      q: 'Can I cancel?',
      a: 'Anytime. No contract, no cancellation fee, no awkward phone call.',
    },
    {
      q: 'Do I have to do anything?',
      a: 'No. Patients come through the directory. You fill in your profile, and the system does the rest.',
    },
    {
      q: `Why is there nobody in ${config.name} yet?`,
      a: 'Because the demand came first. People started asking before any doctors signed up. That is the opportunity.',
    },
    {
      q: 'What if I want to talk first?',
      a: 'Book a call with Dr. Ray. No pressure, no pitch. Just a conversation about what you are building.',
    },
  ]

  // Shared style constants
  const cream = '#F0EBDD'
  const navy = '#1E2D3B'
  const orange = '#D66829'
  const sectionPad = { padding: 'clamp(48px, 10vw, 80px) 24px' } as const

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@700;900&family=Montserrat:wght@400;500;600&display=swap');`}</style>

      <div style={{ background: cream, color: navy, minHeight: '100vh' }}>

        {/* ── 1. THE NUMBER — dark navy full-bleed ── */}
        <section style={{
          background: navy, color: cream, textAlign: 'center',
          padding: 'clamp(80px, 14vw, 140px) 24px clamp(48px, 10vw, 80px)',
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{
              fontFamily: 'Lato, sans-serif',
              fontSize: 'clamp(80px, 22vw, 200px)',
              fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em',
              color: cream, marginBottom: 16,
            }}>
              {stats.demandCount}
            </div>
            <p style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(16px, 4.2vw, 24px)', fontWeight: 500,
              lineHeight: 1.4, color: cream, margin: '0 0 4px',
            }}>
              people in {config.name} asked for a nervous system chiropractor
            </p>
            {stats.periodLabel && (
              <p style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 'clamp(16px, 4.2vw, 22px)', fontWeight: 500,
                lineHeight: 1.4, color: orange, margin: 0,
              }}>
                {stats.periodLabel}
              </p>
            )}
          </div>
        </section>

        {/* ── 2. THE GAP ── */}
        <section style={{ ...sectionPad, textAlign: 'center' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <p style={{
              fontFamily: 'Lato, sans-serif',
              fontSize: 'clamp(20px, 5vw, 32px)', fontWeight: 700,
              color: navy, margin: '0 0 16px', lineHeight: 1.3,
              fontStyle: 'italic',
            }}>
              {stats.doctorCount === 0
                ? `I don't have a single chiropractor in ${config.name}.`
                : `I only have ${stats.doctorCount} chiropractor${stats.doctorCount > 1 ? 's' : ''} in ${config.name}.`}
            </p>
            <p style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(15px, 3.8vw, 20px)', fontWeight: 500,
              color: '#4B5563', margin: 0, lineHeight: 1.5,
            }}>
              Every one of those {stats.demandCount} people had nowhere to go.
            </p>
          </div>
        </section>

        {/* ── 3. DEMAND LOOKUP ── */}
        <section style={{
          ...sectionPad,
          background: '#E8E3D5',
          borderTop: '1px solid #D9D4C7',
          borderBottom: '1px solid #D9D4C7',
        }}>
          <CountryDemandLookup
            country={config.code}
            countryName={config.name}
            postcodeLabel={config.postcodeLabel}
            postcodeHint={config.postcodeHint}
            symbol={config.symbol}
            price={config.price}
            stripeUrl={config.stripeUrl}
            totalDemand={stats.demandCount}
          />
        </section>

        {/* ── 4. FIRST CTA ── */}
        <section style={{ ...sectionPad, textAlign: 'center' }}>
          <CountryCTA
            symbol={config.symbol}
            price={config.price}
            priceAnnual={config.priceAnnual}
            stripeUrl={config.stripeUrl}
            stripeUrlAnnual={config.stripeUrlAnnual}
          />
        </section>

        {/* ── 5. TOP CITIES ── */}
        {stats.topCities.length > 0 && (
          <section style={{
            ...sectionPad,
            borderTop: '1px solid #D9D4C7',
          }}>
            <div style={{ maxWidth: 520, margin: '0 auto' }}>
              <h2 style={{
                fontFamily: 'Lato, sans-serif', fontSize: 'clamp(20px, 5vw, 28px)',
                fontWeight: 700, color: navy, margin: '0 0 24px', textAlign: 'center',
              }}>
                Where the demand is
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                {stats.topCities.slice(0, 5).map(({ city, count }) => (
                  <div key={city} style={{
                    background: '#fff', borderRadius: 10, padding: '12px 20px',
                    border: '1px solid #D9D4C7',
                    display: 'flex', alignItems: 'baseline', gap: 10,
                    fontFamily: 'Montserrat, sans-serif', fontSize: 15,
                  }}>
                    <span style={{ color: navy, fontWeight: 500 }}>{city}</span>
                    <span style={{ color: orange, fontWeight: 700, fontFamily: 'Lato, sans-serif', fontSize: 18 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 6. HOW IT WORKS ── */}
        <section style={{
          ...sectionPad,
          borderTop: '1px solid #D9D4C7',
        }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: 'Lato, sans-serif', fontSize: 'clamp(22px, 5vw, 30px)',
              fontWeight: 700, color: navy, margin: '0 0 32px', textAlign: 'center',
            }}>
              How it works
            </h2>
            {[
              'A patient asks me for a chiropractor near them.',
              'The map finds the closest member. That is you.',
              'They get your name, your handle, your clinic. You get a patient who already believes what you believe.',
            ].map((text, i) => (
              <div key={i} style={{
                display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-start',
              }}>
                <div style={{
                  fontFamily: 'Lato, sans-serif', fontSize: 28, fontWeight: 900,
                  color: orange, lineHeight: 1, flexShrink: 0, minWidth: 32,
                }}>
                  {i + 1}
                </div>
                <p style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 'clamp(15px, 3.8vw, 18px)', fontWeight: 400,
                  color: navy, margin: 0, lineHeight: 1.6,
                }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. WHAT YOU GET ── */}
        <section style={{
          ...sectionPad,
          background: '#E8E3D5',
          borderTop: '1px solid #D9D4C7',
          borderBottom: '1px solid #D9D4C7',
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: 'Lato, sans-serif', fontSize: 'clamp(22px, 5vw, 30px)',
              fontWeight: 700, color: navy, margin: '0 0 32px', textAlign: 'center',
            }}>
              What you get
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 20,
            }}>
              {benefitGroups.map(group => (
                <div key={group.key} style={{
                  background: '#fff', borderRadius: 12, padding: '24px',
                  border: '1px solid #D9D4C7',
                }}>
                  <p style={{
                    fontFamily: 'Lato, sans-serif', fontSize: 11, fontWeight: 700,
                    color: orange, textTransform: 'uppercase', letterSpacing: '0.12em',
                    margin: '0 0 14px',
                  }}>
                    {group.title}
                  </p>
                  {group.items.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10,
                      fontFamily: 'Montserrat, sans-serif', fontSize: 14,
                      lineHeight: 1.5, color: navy,
                    }}>
                      <span style={{ color: orange, fontWeight: 700, flexShrink: 0 }}>&#10003;</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. WHO THIS IS NOT FOR ── */}
        <section style={{ ...sectionPad, textAlign: 'center' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: 'Lato, sans-serif', fontSize: 'clamp(22px, 5vw, 30px)',
              fontWeight: 700, color: navy, margin: '0 0 28px',
            }}>
              Who this is not for
            </h2>
            {[
              'Not a pain clinic with a table.',
              'Not volume over principle.',
              'Not someone who would rather not be found.',
            ].map((line, i) => (
              <p key={i} style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 500,
                color: '#4B5563', margin: '0 0 12px', lineHeight: 1.5,
                fontStyle: 'italic',
              }}>
                {line}
              </p>
            ))}
          </div>
        </section>

        {/* ── 9. FAQ ── */}
        <section style={{
          ...sectionPad,
          borderTop: '1px solid #D9D4C7',
        }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: 'Lato, sans-serif', fontSize: 'clamp(22px, 5vw, 30px)',
              fontWeight: 700, color: navy, margin: '0 0 28px', textAlign: 'center',
            }}>
              Questions
            </h2>
            {faqItems.map((item, i) => (
              <details key={i} style={{
                marginBottom: 12, borderBottom: '1px solid #D9D4C7', paddingBottom: 12,
              }}>
                <summary style={{
                  fontFamily: 'Lato, sans-serif', fontSize: 'clamp(15px, 3.8vw, 18px)',
                  fontWeight: 700, color: navy, cursor: 'pointer',
                  listStyle: 'none', padding: '8px 0',
                }}>
                  {item.q}
                </summary>
                <p style={{
                  fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(14px, 3.5vw, 16px)',
                  color: '#4B5563', margin: '8px 0 0', lineHeight: 1.6,
                }}>
                  {item.a}
                  {item.q.includes('talk first') && (
                    <>
                      {' '}
                      <a
                        href="https://calendly.com/drray-neurochirodirectory/neurochiro-onboarding-call"
                        style={{ color: orange, fontWeight: 600, textDecoration: 'underline' }}
                      >
                        Book a call
                      </a>
                    </>
                  )}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── 10. PRICE + CTA — dark navy full-bleed ── */}
        <section style={{
          background: navy, color: cream, textAlign: 'center',
          padding: 'clamp(48px, 10vw, 80px) 24px 0',
        }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            {config.spotsRemaining > 0 && (
              <>
                <p style={{
                  fontFamily: 'Lato, sans-serif',
                  fontSize: 'clamp(22px, 5.5vw, 34px)', fontWeight: 700,
                  color: cream, margin: '0 0 8px', lineHeight: 1.3,
                }}>
                  {config.symbol}{config.price}/month. First {config.foundingSpots} doctors in {config.name}.
                </p>
                <p style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 'clamp(14px, 3.5vw, 18px)', fontWeight: 600,
                  color: orange, margin: '0 0 28px',
                }}>
                  {config.spotsRemaining} spot{config.spotsRemaining !== 1 ? 's' : ''} remaining
                </p>
              </>
            )}

            <CountryCTA
              symbol={config.symbol}
              price={config.price}
              priceAnnual={config.priceAnnual}
              stripeUrl={config.stripeUrl}
              stripeUrlAnnual={config.stripeUrlAnnual}
              dark
            />

            {/* Risk reversal */}
            <div style={{ marginTop: 28, marginBottom: 0 }}>
              {[
                'Cancel anytime. No contract, no fee.',
                'Your profile stays yours.',
                'Founding rate locked.',
              ].map((line, i) => (
                <p key={i} style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 'clamp(13px, 3.2vw, 15px)', fontWeight: 400,
                  color: 'rgba(240,235,221,0.7)', margin: '0 0 6px', lineHeight: 1.5,
                }}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* ── 11. WHAT HAPPENS AFTER — continues dark band ── */}
          <div style={{
            maxWidth: 560, margin: '0 auto',
            padding: 'clamp(48px, 8vw, 64px) 0',
            borderTop: '1px solid rgba(240,235,221,0.1)',
            marginTop: 'clamp(40px, 8vw, 60px)',
          }}>
            <h2 style={{
              fontFamily: 'Lato, sans-serif', fontSize: 'clamp(22px, 5vw, 30px)',
              fontWeight: 700, color: cream, margin: '0 0 32px', textAlign: 'center',
            }}>
              What happens after you join
            </h2>
            {[
              { num: '1', text: 'You pay. 30 seconds.' },
              { num: '2', text: 'You fill in 5 things. 2 minutes.' },
              { num: '3', text: 'Your profile goes live within 48 hours.' },
              { num: '4', text: 'When someone near you asks, they get your name.' },
            ].map(step => (
              <div key={step.num} style={{
                display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start',
              }}>
                <div style={{
                  fontFamily: 'Lato, sans-serif', fontSize: 26, fontWeight: 900,
                  color: orange, lineHeight: 1, flexShrink: 0, minWidth: 28,
                }}>
                  {step.num}
                </div>
                <p style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 'clamp(15px, 3.8vw, 18px)', fontWeight: 400,
                  color: cream, margin: 0, lineHeight: 1.5,
                }}>
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          {/* ── 12. RATHER TALK FIRST ── */}
          <div style={{
            borderTop: '1px solid rgba(240,235,221,0.1)',
            padding: 'clamp(32px, 6vw, 48px) 0',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(15px, 3.8vw, 18px)', fontWeight: 500,
              color: 'rgba(240,235,221,0.7)', margin: '0 0 16px',
            }}>
              Rather talk first?
            </p>
            <a
              href="https://calendly.com/drray-neurochirodirectory/neurochiro-onboarding-call"
              style={{
                display: 'inline-block',
                fontFamily: 'Lato, sans-serif',
                fontSize: 'clamp(15px, 3.8vw, 18px)', fontWeight: 700,
                color: orange, textDecoration: 'underline',
                textUnderlineOffset: '4px',
              }}
            >
              Book a call with Dr. Ray
            </a>
            <div style={{
              marginTop: 'clamp(32px, 6vw, 48px)',
              paddingBottom: 24,
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 400,
              color: 'rgba(240,235,221,0.4)',
            }}>
              neurochiro.co &nbsp;&middot;&nbsp; @dr.raymondnichols
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
