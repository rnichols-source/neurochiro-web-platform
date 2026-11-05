'use client'

import { useState, type FormEvent } from 'react'
import {
  composeHeardAbout,
  HEARD_ABOUT_CHOICES,
  parseHeardAbout,
} from '@/lib/applications/answers'
import { APPLICATION_SMS_CONSENT } from '@/lib/applications/consent'
import { APPLICATION_COUNTRIES } from '@/lib/applications/countries'
import { toApplicationE164 } from '@/lib/applications/phone'
import type { BillingCycle, DoctorCurrency } from '@/lib/applications/prices'
import { plansForCountry, saveApplyStep, submitApplication, type PlanChoice } from './actions'

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
}

const fieldClass = 'mt-1 w-full min-h-11 rounded-xl border border-black/10 bg-white px-3 text-sm'

export function ApplyForm({
  doctorName,
  canceled,
  referralCode,
  initialCountry,
  plans: startingPlans,
  currency: startingCurrency,
  initial,
  initialStep,
}: {
  doctorName: string
  canceled: boolean
  referralCode: string
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
  const [heardChoice, setHeardChoice] = useState(heard.choice)
  const [heardOther, setHeardOther] = useState(heard.other)
  const [plan, setPlan] = useState<BillingCycle>('monthly')
  const [plans, setPlans] = useState(startingPlans)
  const [currency, setCurrency] = useState(startingCurrency)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  async function onCountry(country: string) {
    set('country', country)
    const next = await plansForCountry(country)
    setCurrency(next.currency)
    setPlans(next.plans)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    if (step === 1 || step === 2) {
      if (step === 2) {
        const mobile = toApplicationE164(values.mobile, values.country)
        if (!mobile) {
          setError(values.country === 'OTHER'
            ? 'Enter a mobile number with + and the country code.'
            : 'Enter a mobile number for the country you selected.')
          setLoading(false)
          return
        }
      }
      const saved = await saveApplyStep(step, { referralCode, answers: answers() })
      if (saved.error) {
        setError(saved.error)
        setLoading(false)
        return
      }
      setStep(step === 1 ? 2 : 3)
      setLoading(false)
      return
    }

    const mobile = toApplicationE164(values.mobile, values.country)
    if (!mobile) {
      setError(values.country === 'OTHER'
        ? 'Enter a mobile number with + and the country code.'
        : 'Enter a mobile number for the country you selected.')
      setLoading(false)
      return
    }
    const result = await submitApplication({
      plan,
      referralCode,
      answers: { ...answers(), mobile },
    })
    if (result.error || !result.url) {
      setError(result.error || 'Something went wrong.')
      setLoading(false)
      return
    }
    window.location.href = result.url
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div>
        <p className="text-sm font-bold text-neuro-orange">Step {step} of 3 · about 5 minutes</p>
        <h1 className="mt-1 text-2xl font-bold text-neuro-navy">Apply to join NeuroChiro</h1>
        <p className="mt-2 text-sm text-neuro-navy/80">
          {doctorName ? `Thanks, Dr. ${doctorName}. ` : ''}
          {step === 1 ? 'About you and how you practice.' : null}
          {step === 2 ? 'Your office.' : null}
          {step === 3 ? 'Choose a plan and save a card. You are not charged unless you are approved.' : null}
        </p>
      </div>
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
            <span className="mt-1 block text-xs font-normal text-neuro-navy/70">
              {values.country === 'OTHER'
                ? 'Start with + and the country code.'
                : 'Use a mobile number in the country you selected.'}
            </span>
          </label>
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={values.smsConsent}
              onChange={(event) => set('smsConsent', event.target.checked)}
            />
            <span>
              <span className="font-bold">Optional. </span>
              {APPLICATION_SMS_CONSENT}
            </span>
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
        <fieldset>
          <legend className="text-sm font-bold">Membership in {currency}. Per office. Not charged today.</legend>
          <div className="mt-2 space-y-2">
            {plans.map((choice) => (
              <label key={choice.cycle} className="flex min-h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-sm">
                <input
                  type="radio"
                  name="plan"
                  disabled={!choice.available}
                  checked={plan === choice.cycle}
                  onChange={() => setPlan(choice.cycle)}
                />
                <span>{choice.cycle === 'monthly' ? 'Monthly' : 'Annual'}: {choice.label}</span>
                {choice.available ? null : <span>Price not configured</span>}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-col gap-3">
        {step < 3 ? (
          <button type="submit" disabled={loading} className="min-h-11 w-full rounded-xl bg-neuro-orange px-4 font-bold text-white disabled:opacity-60">
            {loading ? 'Saving…' : 'Next'}
          </button>
        ) : (
          <button type="submit" disabled={loading} className="min-h-11 w-full rounded-xl bg-neuro-orange px-4 font-bold text-white disabled:opacity-60">
            {loading ? 'Opening the card form…' : 'Save card and submit application'}
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
