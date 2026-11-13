'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VisitAnswerPage() {
  return (
    <Suspense>
      <VisitAnswer />
    </Suspense>
  )
}

function VisitAnswer() {
  const params = useSearchParams()
  const token = params.get('token') || ''
  const answer = params.get('answer') === 'no' ? 'no' : params.get('answer') === 'yes' ? 'yes' : ''
  const [done, setDone] = useState<'yes' | 'no' | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function send(response: 'yes' | 'no') {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/contact-request/office-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, response }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Could not save that.')
      else setDone(response)
    } catch {
      setError('Connection problem. Please try again.')
    }
    setBusy(false)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#F5F3EF] px-6 py-10 text-[#15202B]">
      {done ? (
        <>
          <h1 className="font-heading text-2xl font-black">{done === 'yes' ? 'Glad you got in' : 'Thanks for telling us'}</h1>
          <p className="mt-2 text-[#5b6773]">{done === 'yes' ? 'That is saved.' : 'We will keep this on the request.'}</p>
        </>
      ) : (
        <>
          <h1 className="font-heading text-2xl font-black">Did you get in?</h1>
          <p className="mt-2 text-[#5b6773]">Did you get into the office after your NeuroChiro request?</p>
          {error ? <p className="mt-3 text-sm text-[#B3261E]">{error}</p> : null}
          <div className="mt-5 flex gap-2">
            <button type="button" disabled={busy || token.length < 32} onClick={() => send('yes')} className={`min-h-12 flex-1 rounded-xl font-bold text-white ${answer === 'yes' ? 'bg-[#0E857A]' : 'bg-[#1E2D3B]'}`}>Yes, I went in</button>
            <button type="button" disabled={busy || token.length < 32} onClick={() => send('no')} className={`min-h-12 flex-1 rounded-xl font-bold text-white ${answer === 'no' ? 'bg-[#B4501A]' : 'bg-[#1E2D3B]'}`}>Not yet</button>
          </div>
          {token.length < 32 ? <p className="mt-3 text-sm text-[#B3261E]">This link is not valid. Use the buttons in the message we sent.</p> : null}
        </>
      )}
      <Link href="/directory" className="mt-6 text-sm font-bold text-[#D66829]">Find a doctor on neurochiro.co</Link>
    </main>
  )
}
