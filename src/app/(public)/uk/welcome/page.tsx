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

  let prefill = { name: '', email: '' }
  if (sessionId) {
    const result = await lookupStripeSession(sessionId)
    if (result) prefill = result
  }

  return <WelcomeForm prefillName={prefill.name} prefillEmail={prefill.email} sessionId={sessionId} />
}
