'use client'

import { useState, type FormEvent } from 'react'
import { APPLICATION_COUNTRIES } from '@/lib/applications/countries'
import type { BillingCycle, DoctorCurrency } from '@/lib/applications/prices'
import { plansForCountry, submitApplication, type PlanChoice } from './actions'

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
}: {
  doctorName: string
  canceled: boolean
  referralCode: string
  initialCountry: string
  plans: PlanChoice[]
  currency: DoctorCurrency
  initial: Initial
}) {
  const [values, setValues] = useState<Initial>({ ...initial, country: initial.country || initialCountry })
  const [plan, setPlan] = useState<BillingCycle>('monthly')
  const [plans, setPlans] = useState(startingPlans)
  const [currency, setCurrency] = useState(startingCurrency)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setValues((current) => ({ ...current, [key]: value }))
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
    const result = await submitApplication({
      plan,
      referralCode,
      answers: {
        ...values,
        yearsInPractice: values.yearsInPractice === '' ? '' : Number(values.yearsInPractice),
        usesNervousSystemScans: values.usesNervousSystemScans === 'yes' ? true : values.usesNervousSystemScans === 'no' ? false : '',
      },
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
        <h1 className="text-2xl font-bold text-neuro-navy">Apply to join NeuroChiro</h1>
        <p className="mt-2 text-sm text-neuro-navy/80">
          {doctorName ? `Thanks, Dr. ${doctorName}. ` : ''}
          Answer a few questions, then save a card. You are not charged unless Raymond approves the application.
        </p>
      </div>
      {canceled ? <p className="rounded-xl bg-white p-3 text-sm">The card form was closed. You can try again when you are ready.</p> : null}

      <label className="block text-sm font-bold">
        How do you practice, and what is the philosophy of the office?
        <textarea required value={values.practiceApproach} onChange={(event) => set('practiceApproach', event.target.value)} className={`${fieldClass} min-h-28 py-2`} />
      </label>
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
      <label className="block text-sm font-bold">
        How did you hear about NeuroChiro?
        <input required value={values.heardAbout} onChange={(event) => set('heardAbout', event.target.value)} className={fieldClass} />
      </label>
      <label className="block text-sm font-bold">
        Why do you want to join?
        <textarea required value={values.whyJoin} onChange={(event) => set('whyJoin', event.target.value)} className={`${fieldClass} min-h-28 py-2`} />
      </label>

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

      {error ? <p role="alert" className="text-sm font-bold text-red-700">{error}</p> : null}
      <button type="submit" disabled={loading} className="min-h-11 w-full rounded-xl bg-neuro-orange px-4 font-bold text-white disabled:opacity-60">
        {loading ? 'Opening the card form…' : 'Save card and submit application'}
      </button>
    </form>
  )
}
