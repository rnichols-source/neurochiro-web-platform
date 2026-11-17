'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
  onBack,
}: {
  returnUrl: string
  onError: (message: string) => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!message) return
    errorRef.current?.scrollIntoView({ block: 'nearest' })
  }, [message])

  function fail(text: string) {
    const shown = text || 'The card could not be saved.'
    setMessage(shown)
    onError(shown)
  }

  async function onSubmit(event: { preventDefault: () => void }) {
    event.preventDefault()
    if (!stripe || !elements) return
    setBusy(true)
    setMessage('')
    const result = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    })
    if (result.error) {
      fail(result.error.message || 'The card could not be saved.')
      setBusy(false)
      return
    }
    const id = result.setupIntent?.id
    if (result.setupIntent?.status === 'succeeded' && id) {
      const join = returnUrl.includes('?') ? '&' : '?'
      window.location.assign(`${returnUrl}${join}setup_intent=${encodeURIComponent(id)}`)
      return
    }
    fail('The card was not confirmed. Nothing was charged.')
    setBusy(false)
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden">
      <PaymentElement options={{
        layout: { type: 'accordion', defaultCollapsed: false, radios: 'always', spacedAccordionItems: false },
        wallets: { applePay: 'auto', googlePay: 'auto' },
      }} />
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-[#F5F3EF]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-2xl">
        {message ? <p ref={errorRef} role="alert" className="mb-2 text-base font-bold text-red-700">{message}</p> : null}
        <button
          type="button"
          disabled={!stripe || busy}
          onClick={(event) => { void onSubmit(event) }}
          className="min-h-11 w-full rounded-xl bg-neuro-orange px-4 text-base font-bold text-white disabled:opacity-60"
        >
          {busy ? 'Saving card…' : 'Save card and submit application'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onBack}
          className="mt-3 min-h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-base font-bold text-neuro-navy disabled:opacity-60"
        >
          Back
        </button>
        </div>
      </div>
    </div>
  )
}

export function CardSetup({
  publishableKey,
  clientSecret,
  returnUrl,
  onError,
  onBack,
}: {
  publishableKey: string
  clientSecret: string
  returnUrl: string
  onError: (message: string) => void
  onBack: () => void
}) {
  const stripe = useMemo(() => (publishableKey ? stripeFor(publishableKey) : null), [publishableKey])
  if (!stripe || !clientSecret) return null
  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret,
        appearance: { theme: 'stripe', variables: { colorPrimary: '#D66829', borderRadius: '12px', fontSizeBase: '16px' } },
      }}
    >
      <CardFields returnUrl={returnUrl} onError={onError} onBack={onBack} />
    </Elements>
  )
}
