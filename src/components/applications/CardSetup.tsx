'use client'

import { useMemo, useState } from 'react'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'

const stripeCache = new Map<string, Promise<Stripe | null>>()

function stripeFor(publishableKey: string) {
  const existing = stripeCache.get(publishableKey)
  if (existing) return existing
  const created = loadStripe(publishableKey)
  stripeCache.set(publishableKey, created)
  return created
}

function CardFields({
  returnUrl,
  onError,
}: {
  returnUrl: string
  onError: (message: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: { preventDefault: () => void }) {
    event.preventDefault()
    if (!stripe || !elements) return
    setBusy(true)
    const result = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    })
    if (result.error) {
      onError(result.error.message || 'The card could not be saved.')
      setBusy(false)
      return
    }
    const id = result.setupIntent?.id
    if (result.setupIntent?.status === 'succeeded' && id) {
      const join = returnUrl.includes('?') ? '&' : '?'
      window.location.assign(`${returnUrl}${join}setup_intent=${encodeURIComponent(id)}`)
      return
    }
    onError('The card was not confirmed. Nothing was charged.')
    setBusy(false)
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      <button
        type="button"
        disabled={!stripe || busy}
        onClick={(event) => { void onSubmit(event) }}
        className="min-h-11 w-full rounded-xl bg-neuro-orange px-4 font-bold text-white disabled:opacity-60"
      >
        {busy ? 'Saving card…' : 'Save card and submit application'}
      </button>
    </div>
  )
}

export function CardSetup({
  publishableKey,
  clientSecret,
  returnUrl,
  onError,
}: {
  publishableKey: string
  clientSecret: string
  returnUrl: string
  onError: (message: string) => void
}) {
  const stripe = useMemo(() => (publishableKey ? stripeFor(publishableKey) : null), [publishableKey])
  if (!stripe || !clientSecret) return null
  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret,
        appearance: { theme: 'stripe', variables: { colorPrimary: '#D66829', borderRadius: '12px' } },
      }}
    >
      <CardFields returnUrl={returnUrl} onError={onError} />
    </Elements>
  )
}
