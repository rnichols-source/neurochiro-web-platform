'use client'

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { searchMembers } from '@/app/(admin)/admin/members/actions'
import { isNearbyPlace, parseLocationQuery } from '@/lib/admin/location-query'
import type { MemberListRow } from '@/lib/admin/member-search'

export function MemberPalette() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [hits, setHits] = useState<MemberListRow[]>([])
  const [active, setActive] = useState(0)
  const [pending, setPending] = useState(false)
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const request = useRef(0)

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
        return
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  function onChange(value: string) {
    setText(value)
    if (timer.current) clearTimeout(timer.current)
    const trimmed = value.trim()
    if (!trimmed) {
      request.current += 1
      setHits([])
      setPending(false)
      setActive(0)
      return
    }
    setPending(true)
    timer.current = setTimeout(() => {
      const id = request.current + 1
      request.current = id
      void searchMembers({ q: trimmed, page: 1, pageSize: 8 })
        .then((result) => {
          if (id !== request.current) return
          setHits(result.rows)
          setActive(0)
          setPending(false)
        })
        .catch(() => {
          if (id !== request.current) return
          setHits([])
          setPending(false)
        })
    }, 300)
  }

  function onInputKey(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => Math.min(hits.length - 1, current + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => Math.max(0, current - 1))
    } else if (event.key === 'Enter') {
      const typed = text.trim()
      if (typed && isNearbyPlace(parseLocationQuery(typed))) {
        event.preventDefault()
        router.push(`/admin/members?q=${encodeURIComponent(typed)}&near=100`)
        setOpen(false)
        return
      }
      if (!hits[active]) return
      event.preventDefault()
      router.push(`/admin/members?q=${encodeURIComponent(typed)}&member=${encodeURIComponent(hits[active].id)}`)
      setOpen(false)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <>
      <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl md:hidden" aria-label="Search members" onClick={() => setOpen(true)}>
        <Search className="h-4 w-4" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[90]">
          <button type="button" className="absolute inset-0 bg-neuro-navy/40" aria-label="Close search" onClick={() => setOpen(false)} />
          <div role="dialog" aria-label="Search members" className="absolute inset-x-3 top-16 rounded-2xl bg-white p-3 text-neuro-navy shadow-2xl md:inset-x-auto md:left-1/2 md:w-[32rem] md:-translate-x-1/2">
            <input
              autoFocus
              value={text}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={onInputKey}
              placeholder="Search members"
              aria-label="Member search"
              className="min-h-11 w-full rounded-xl border border-black/10 bg-neuro-cream px-3 text-sm outline-none"
            />
            <div className="mt-2 max-h-80 overflow-y-auto">
              {pending ? <p className="px-2 py-3 text-sm text-neuro-gray">Searching</p> : null}
              {!pending && text.trim() && hits.length === 0 ? <p className="px-2 py-3 text-sm text-neuro-gray">No matches</p> : null}
              {hits.map((hit, index) => (
                <Link
                  key={hit.id}
                  href={`/admin/members?q=${encodeURIComponent(text.trim())}&member=${encodeURIComponent(hit.id)}`}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 flex-col justify-center rounded-xl px-2 ${index === active ? 'bg-neuro-cream' : ''}`}
                >
                  <span className="text-sm font-medium">{hit.name}</span>
                  <span className="text-xs text-neuro-gray">{hit.role}{hit.email ? ` · ${hit.email}` : ''}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
