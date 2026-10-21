import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCountryConfig, ROUTE_TO_COUNTRY } from '@/lib/country-pages'
import { lookupStripeSession } from '../../uk/welcome/actions'
import WelcomeForm from '../../uk/welcome/WelcomeForm'

export async function generateStaticParams() {
  return Object.keys(ROUTE_TO_COUNTRY).map(slug => ({ countrySlug: slug }))
}

export const metadata: Metadata = {
  title: 'Welcome to NeuroChiro',
  description: 'Set up your founding member profile.',
}

export default async function WelcomePage({
  params,
  searchParams,
}: {
  params: Promise<{ countrySlug: string }>
  searchParams: Promise<{ session_id?: string }>
}) {
  const { countrySlug } = await params
  const config = getCountryConfig(countrySlug)
  if (!config) notFound()

  const sp = await searchParams
  const sessionId = sp.session_id || ''

  let prefill = { name: '', email: '' }
  if (sessionId) {
    const result = await lookupStripeSession(sessionId)
    if (result) prefill = result
  }

  return (
    <WelcomeForm
      prefillName={prefill.name}
      prefillEmail={prefill.email}
      sessionId={sessionId}
      countryCode={config.code}
      source={config.source}
      postcodeLabel={config.postcodeLabel}
      postcodeHint={config.postcodeHint}
    />
  )
}
