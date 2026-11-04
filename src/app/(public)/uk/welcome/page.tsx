import type { Metadata } from 'next'
import { lookupStripeSession } from './actions'
import WelcomeForm from './WelcomeForm'

export const metadata: Metadata = {
  title: 'Welcome to NeuroChiro UK',
  description: 'Set up your founding member profile.',
}

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const params = await searchParams
  const sessionId = params.session_id || ''

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

  return <WelcomeForm prefillName={prefill.name} prefillEmail={prefill.email} sessionId={sessionId} />
}
