'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addFamilyMember, removeFamilyMember } from '@/lib/community/actions'
import { RELATIONSHIP_LABELS, RELATIONSHIPS, allowsAccountInvite, type Relationship } from '@/lib/community/logic'
import { FieldLabel, FormError, fieldClass } from '@/components/community/ui'

export type FamilyPerson = {
  id: string
  firstName: string
  relationship: Relationship
  invitedEmail: string | null
}

export function FamilyManager({ people }: { people: FamilyPerson[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [relationship, setRelationship] = useState<Relationship>('child')
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')

  function add(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    start(async () => {
      const result = await addFamilyMember({ firstName, relationship, invitedEmail: email })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setFirstName('')
      setEmail('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {people.length === 0 ? (
        <p className="text-[13.5px] leading-snug text-[#3d4a57]">No one else is on this household yet. A child can stay here without their own login.</p>
      ) : (
        <ul className="divide-y divide-[#eee]">
          {people.map((person) => (
            <li key={person.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-heading text-[15px] font-bold text-neuro-navy">{person.firstName}</p>
                <p className="text-[12px] text-[#6b7785]">
                  {RELATIONSHIP_LABELS[person.relationship]}
                  {person.invitedEmail ? ' · email saved, not sent' : ''}
                </p>
              </div>
              <button
                type="button"
                className="text-[13px] font-semibold text-[#B4501A]"
                onClick={() => start(async () => {
                  const result = await removeFamilyMember(person.id)
                  if (!result.ok) setError(result.error)
                  else router.refresh()
                })}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="space-y-3 border-t border-[#eee] pt-3">
        <FormError message={error} />
        <div>
          <FieldLabel>First name</FieldLabel>
          <input className={fieldClass} value={firstName} onChange={(event) => setFirstName(event.target.value)} required maxLength={40} autoComplete="off" />
        </div>
        <div>
          <FieldLabel>Relationship</FieldLabel>
          <select className={fieldClass} value={relationship} onChange={(event) => setRelationship(event.target.value as Relationship)}>
            {RELATIONSHIPS.map((item) => <option key={item} value={item}>{RELATIONSHIP_LABELS[item]}</option>)}
          </select>
        </div>
        {allowsAccountInvite(relationship) ? (
          <div>
            <FieldLabel>Their email, if they should have their own login later</FieldLabel>
            <input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Optional" />
            <p className="mt-1 text-[12px] leading-snug text-[#6b7785]">We save the address and do not email them. They can create a free account when they want one.</p>
          </div>
        ) : (
          <p className="text-[12.5px] leading-snug text-[#6b7785]">A child stays on your account. They do not need a separate login.</p>
        )}
        <button type="submit" disabled={pending} className="min-h-11 w-full rounded-[11px] bg-neuro-orange text-[13.5px] font-semibold text-white disabled:opacity-60">
          {pending ? 'Saving…' : 'Add to household'}
        </button>
      </form>
    </div>
  )
}
