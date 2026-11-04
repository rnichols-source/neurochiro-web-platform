import type { ReactNode } from 'react'
import Link from 'next/link'
import { DOCTOR_SMS_CONSENT_V1, PATIENT_SMS_CONSENT_V1 } from '@/lib/sms/consent'

const linkClass = 'underline underline-offset-2'

function linked(text: string, phrases: { label: string; href: string }[]) {
  const nodes: ReactNode[] = []
  let cursor = 0
  phrases.forEach((phrase, index) => {
    const at = text.indexOf(phrase.label, cursor)
    if (at < 0) return
    nodes.push(text.slice(cursor, at))
    nodes.push(
      <Link key={phrase.href} href={phrase.href} className={linkClass}>
        {phrase.label}
      </Link>,
    )
    cursor = at + phrase.label.length
    if (index === phrases.length - 1) nodes.push(text.slice(cursor))
  })
  return nodes.length ? nodes : text
}

export function PatientSmsConsentLabel() {
  return (
    <>
      {linked(PATIENT_SMS_CONSENT_V1, [
        { label: 'SMS Terms', href: '/sms-terms' },
        { label: 'Privacy Policy', href: '/privacy' },
      ])}
    </>
  )
}

export function DoctorSmsConsentLabel() {
  return (
    <>
      {linked(DOCTOR_SMS_CONSENT_V1, [
        { label: 'SMS Terms', href: '/sms-terms' },
      ])}
    </>
  )
}
