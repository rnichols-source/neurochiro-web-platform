'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { FieldLabel, FormError, fieldClass } from '@/components/community/ui'

export function AccountPanel({ name, email }: { name: string; email: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function savePassword(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Those passwords do not match.')
      return
    }
    setPending(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setPending(false)
    if (updateError) setError(updateError.message)
    else {
      setPassword('')
      setConfirm('')
      setMessage('Password updated.')
    }
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-[rgba(30,45,59,0.08)] bg-white px-3.5 py-3">
        <p className="text-[12px] font-semibold text-[#6b7785]">Name</p>
        <p className="font-heading text-[16px] font-bold text-neuro-navy">{name}</p>
        <p className="mt-2 text-[12px] font-semibold text-[#6b7785]">Email</p>
        <p className="text-[14px] text-[#16202a]">{email || 'No email on this account'}</p>
        <p className="mt-2 text-[12.5px] text-[#6b7785]">
          To change your name or email, write through <a className="font-semibold text-[#B4501A]" href="https://neurochiro.co/contact">neurochiro.co/contact</a>.
        </p>
      </div>
      <form onSubmit={savePassword} className="space-y-3 rounded-[18px] border border-[rgba(30,45,59,0.08)] bg-white px-3.5 py-3">
        <p className="font-heading text-[15px] font-bold text-neuro-navy">Password</p>
        <FormError message={error} />
        {message ? <p className="text-[13px] text-[#1f8a4c]">{message}</p> : null}
        <div>
          <FieldLabel>New password</FieldLabel>
          <input className={fieldClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <FieldLabel>Confirm</FieldLabel>
          <input className={fieldClass} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" />
        </div>
        <button type="submit" disabled={pending} className="min-h-11 w-full rounded-[11px] bg-neuro-navy text-[13.5px] font-semibold text-white disabled:opacity-60">
          {pending ? 'Saving…' : 'Update password'}
        </button>
      </form>
      <button type="button" onClick={signOut} className="min-h-11 w-full rounded-[11px] border border-[#d9dfe5] text-[13.5px] font-semibold text-neuro-navy">
        Sign out
      </button>
    </div>
  )
}
