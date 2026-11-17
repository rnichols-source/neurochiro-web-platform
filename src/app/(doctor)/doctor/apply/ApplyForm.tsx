'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, type FormEvent } from 'react'
import { FlowProgress } from '@/components/applications/FlowProgress'
import {
  composeHeardAbout,
  HEARD_ABOUT_CHOICES,
  parseHeardAbout,
} from '@/lib/applications/answers'
import { chargeCopyFromLabel } from '@/lib/applications/charge-copy'
import { gapsBeforeCard, type ApplicationGap } from '@/lib/applications/checklist'
import { APPLICATION_COUNTRIES } from '@/lib/applications/countries'
import { flowStepLabel, type ApplicationFlowStep } from '@/lib/applications/flow-steps'
import { toApplicationE164 } from '@/lib/applications/phone'
import type { BillingCycle, DoctorCurrency } from '@/lib/applications/prices'
import { plansForCountry, prepareCardSetup, saveApplyStep, type PlanChoice } from './actions'

const CardSetup = dynamic(
  () => import('@/components/applications/CardSetup').then((mod) => mod.CardSetup),
  { ssr: false },
)

type Initial = {
  practiceApproach: string
  techniques: string
  usesNervousSystemScans: string
  scanTypes: string
  yearsInPractice: string
  officeAddress: string
  city: string
  state: string
  country: string
  website: string
  instagram: string
  heardAbout: string
  whyJoin: string
  mobile: string
  smsConsent: boolean
  referrerName: string
}

const fieldClass = 'mt-1 w-full min-h-11 rounded-xl border border-black/10 bg-white px-3 text-sm'

export function ApplyForm({
  doctorName,
  doctorEmail,
  canceled,
  resumed,
  referralCode,
  referredBy,
  initialCountry,
  plans: startingPlans,
  currency: startingCurrency,
  initial,
  initialStep,
}: {
  doctorName: string
  doctorEmail: string
  canceled: boolean
  resumed: boolean
  referralCode: string
  referredBy: string | null
  initialCountry: string
  plans: PlanChoice[]
  currency: DoctorCurrency
  initial: Initial
  initialStep: 1 | 2 | 3
}) {
  const heard = parseHeardAbout(initial.heardAbout)
  const [step, setStep] = useState<1 | 2 | 3>(initialStep)
  const [values, setValues] = useState<Initial>({
    ...initial,
    country: initial.country || initialCountry,
    mobile: initial.mobile || '',
    smsConsent: initial.smsConsent === true,
  })
  const [referrerName, setReferrerName] = useState(initial.referrerName || '')
  const [heardChoice, setHeardChoice] = useState(heard.choice)
  const [heardOther, setHeardOther] = useState(heard.other)
  const [plan, setPlan] = useState<BillingCycle>('monthly')
  const [plans, setPlans] = useState(startingPlans)
  const [currency, setCurrency] = useState(startingCurrency)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [returnUrl, setReturnUrl] = useState('')
  const flowStep: ApplicationFlowStep = step === 1 ? 2 : step === 2 ? 3 : 4
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  const selectedPlan = plans.find((choice) => choice.cycle === plan) || plans[0]
  const chargeCopy = chargeCopyFromLabel(selectedPlan?.label || '', plan)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function answers() {
    return {
      ...values,
      heardAbout: composeHeardAbout(heardChoice, heardOther),
      yearsInPractice: values.yearsInPractice === '' ? '' : Number(values.yearsInPractice),
      usesNervousSystemScans: values.usesNervousSystemScans === 'yes'
        ? true
        : values.usesNervousSystemScans === 'no'
          ? false
          : '',
      smsConsent: values.smsConsent === true,
    }
  }

  function gapsNow(): ApplicationGap[] {
    return gapsBeforeCard({
      ...answers(),
      email: doctorEmail,
      plan,
      mobile: values.mobile,
      country: values.country,
    })
  }

  async function onCountry(country: string) {
    set('country', country)
    setClientSecret('')
    const next = await plansForCountry(country)
    setCurrency(next.currency)
    setPlans(next.plans)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const blocked = gapsNow().filter((gap) => {
      if (step === 1) return gap.key === 'practice' || gap.key === 'heard'
      if (step === 2) return ['techniques', 'scans', 'years', 'address', 'city', 'country', 'website', 'instagram'].includes(gap.key)
      return gap.key !== 'card'
    })
    if (blocked.length > 0) {
      setError(`Missing: ${blocked.map((gap) => gap.label).join(', ')}.`)
      setLoading(false)
      return
    }
    if (step === 1 || step === 2) {
      const saved = await saveApplyStep(step, { referralCode, referrerName, answers: answers() })
      if (saved.error) {
        setError(saved.error)
        setLoading(false)
        return
      }
      setStep(step === 1 ? 2 : 3)
      setLoading(false)
      return
    }

    const mobile = values.mobile.trim()
      ? toApplicationE164(values.mobile, values.country)
      : ''
    if (values.mobile.trim() && !mobile) {
      setError(values.country === 'OTHER'
        ? 'Enter a mobile number with + and the country code.'
        : 'Enter a mobile number for the country you selected.')
      setLoading(false)
      return
    }
    const result = await prepareCardSetup({
      plan,
      referralCode,
      referrerName,
      answers: { ...answers(), mobile: mobile || values.mobile },
    })
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    if (result.url) {
      window.location.href = result.url
      return
    }
    if (!result.clientSecret || !result.returnUrl) {
      setError('Stripe could not open the card form. Check the price settings and try again.')
      setLoading(false)
      return
    }
    setReturnUrl(result.returnUrl)
    setClientSecret(result.clientSecret)
    setLoading(false)
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div>
        <p className="text-sm font-bold text-neuro-navy">NeuroChiro</p>
        <FlowProgress step={flowStep} />
        <h1 className="mt-1 text-2xl font-bold text-neuro-navy">{flowStepLabel(flowStep)}</h1>
        <p className="mt-2 text-sm text-neuro-navy/80">
          {doctorName && step === 1 ? `Your account is saved, Dr. ${doctorName}. ` : ''}
          {step === 1 ? 'How you practice. This stays saved if you leave.' : null}
          {step === 2 ? 'Your office. This stays saved if you leave.' : null}
          {step === 3 ? `${chargeCopy} Currency: ${currency}.` : null}
        </p>
      </div>
      {resumed ? <p className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-neuro-navy">Pick up where you left off</p> : null}
      {referredBy ? <p className="rounded-xl bg-white px-3 py-2 text-sm text-neuro-navy">Referred by {referredBy}</p> : null}
      {canceled ? <p className="rounded-xl bg-white p-3 text-sm">The card form was closed. You can try again when you are ready.</p> : null}
      {error ? <p role="alert" className="text-sm font-bold text-red-700">{error}</p> : null}

      {step === 1 ? (
        <>
          <label className="block text-sm font-bold">
            How do you practice, and what is the philosophy of the office?
            <textarea required value={values.practiceApproach} onChange={(event) => set('practiceApproach', event.target.value)} className={`${fieldClass} min-h-28 py-2`} />
            <span className="mt-1 block text-xs font-normal text-neuro-navy/70">A few sentences is enough.</span>
          </label>
          <label className="block text-sm font-bold">
            How did you hear about NeuroChiro?
            <select required value={heardChoice} onChange={(event) => setHeardChoice(event.target.value)} className={fieldClass}>
              <option value="">Choose one</option>
              {HEARD_ABOUT_CHOICES.map((choice) => (
                <option key={choice} value={choice}>{choice}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </label>
          {referredBy ? null : (
            <label className="block text-sm font-bold">
              Who referred you? <span className="font-normal text-neuro-navy/70">Optional</span>
              <input value={referrerName} onChange={(event) => setReferrerName(event.target.value)} className={fieldClass} autoComplete="off" />
            </label>
          )}
          {heardChoice === 'Other' ? (
            <label className="block text-sm font-bold">
              Tell us a little more
              <input required value={heardOther} onChange={(event) => setHeardOther(event.target.value)} className={fieldClass} />
            </label>
          ) : null}
          <label className="block text-sm font-bold">
            Why do you want to join? <span className="font-normal text-neuro-navy/70">Optional</span>
            <textarea value={values.whyJoin} onChange={(event) => set('whyJoin', event.target.value)} className={`${fieldClass} min-h-28 py-2`} />
          </label>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <label className="block text-sm font-bold">
            Which techniques do you use?
            <input required value={values.techniques} onChange={(event) => set('techniques', event.target.value)} className={fieldClass} />
          </label>
          <fieldset>
            <legend className="text-sm font-bold">Do you use nervous system scans, such as INSiGHT, HRV, or thermal?</legend>
            <div className="mt-2 flex gap-3">
              {(['yes', 'no'] as const).map((choice) => (
                <label key={choice} className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="scans"
                    required
                    checked={values.usesNervousSystemScans === choice}
                    onChange={() => set('usesNervousSystemScans', choice)}
                  />
                  {choice === 'yes' ? 'Yes' : 'No'}
                </label>
              ))}
            </div>
          </fieldset>
          {values.usesNervousSystemScans === 'yes' ? (
            <label className="block text-sm font-bold">
              Which scans?
              <input required value={values.scanTypes} onChange={(event) => set('scanTypes', event.target.value)} className={fieldClass} />
            </label>
          ) : null}
          <label className="block text-sm font-bold">
            Years in practice
            <input required inputMode="numeric" value={values.yearsInPractice} onChange={(event) => set('yearsInPractice', event.target.value)} className={fieldClass} />
          </label>
          <label className="block text-sm font-bold">
            Office address
            <input required value={values.officeAddress} onChange={(event) => set('officeAddress', event.target.value)} className={fieldClass} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              City
              <input required value={values.city} onChange={(event) => set('city', event.target.value)} className={fieldClass} />
            </label>
            <label className="block text-sm font-bold">
              State or region
              <input value={values.state} onChange={(event) => set('state', event.target.value)} className={fieldClass} />
            </label>
          </div>
          <label className="block text-sm font-bold">
            Country
            <select required value={values.country} onChange={(event) => void onCountry(event.target.value)} className={fieldClass}>
              {APPLICATION_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>{country.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold">
            Website
            <input value={values.website} onChange={(event) => set('website', event.target.value)} className={fieldClass} placeholder="https://" />
          </label>
          <label className="block text-sm font-bold">
            Instagram
            <input value={values.instagram} onChange={(event) => set('instagram', event.target.value)} className={fieldClass} placeholder="@yourclinic" />
          </label>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <fieldset>
            <legend className="text-sm font-bold">Membership in {currency}. Per office.</legend>
            <div className="mt-2 space-y-2">
              {plans.map((choice) => (
                <label key={choice.cycle} className="flex min-h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-sm">
                  <input
                    type="radio"
                    name="plan"
                    disabled={!choice.available}
                    checked={plan === choice.cycle}
                    onChange={() => { setPlan(choice.cycle); setClientSecret('') }}
                  />
                  <span>{choice.cycle === 'monthly' ? 'Monthly' : 'Annual'}: {choice.label}</span>
                  {choice.available ? null : <span>Price not configured</span>}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="rounded-xl bg-white px-3 py-3 text-sm font-bold text-neuro-navy">{chargeCopy}</p>
          {!values.mobile ? (
            <label className="block text-sm font-bold">
              Mobile number
              <input
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={values.mobile}
                onChange={(event) => set('mobile', event.target.value)}
                className={fieldClass}
                placeholder={values.country === 'OTHER' ? '+ country code' : ''}
              />
            </label>
          ) : null}
          {clientSecret ? (
            <CardSetup
              publishableKey={publishableKey}
              clientSecret={clientSecret}
              returnUrl={returnUrl}
              onError={setError}
            />
          ) : null}
        </>
      ) : null}

      <div className="flex flex-col gap-3">
        {step < 3 ? (
          <button type="submit" disabled={loading} className="min-h-11 w-full rounded-xl bg-neuro-orange px-4 font-bold text-white disabled:opacity-60">
            {loading ? 'Saving…' : 'Next'}
          </button>
        ) : clientSecret ? null : (
          <button type="submit" disabled={loading || !selectedPlan?.available} className="min-h-11 w-full rounded-xl bg-neuro-orange px-4 font-bold text-white disabled:opacity-60">
            {loading ? 'Opening the card form…' : 'Continue to card'}
          </button>
        )}
        {step > 1 ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => { setError(''); setStep(step === 3 ? 2 : 1) }}
            className="min-h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm font-bold text-neuro-navy disabled:opacity-60"
          >
            Back
          </button>
        ) : null}
      </div>
    </form>
  )
}
