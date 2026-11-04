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

  let prefill: { name: string; email: string } | null = null
  if (sessionId) prefill = await lookupStripeSession(sessionId)
  if (!prefill) {
    return (
      <main className="min-h-dvh bg-[#F5F3EF] px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#1E2D3B]">Payment not confirmed</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[#1E2D3B]/80">This page opens after Stripe confirms the payment. Use the link from your receipt, or write to support@neurochirodirectory.com.</p>
      </main>
    )
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
