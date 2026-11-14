'use client'

import { useState } from 'react'
import { markInstagramSent } from './actions'

export type IgRow = {
  id: string
  handle: string
  displayName: string
  area: string
  doctor: string
  miles: number | null
  message: string
  comment: string
  commentUrl: string
  dmUrl: string
  doctorHandle: string
  sent: boolean
}

function personLabel(row: Pick<IgRow, 'handle' | 'displayName'>): string {
  return row.handle ? `@${row.handle}` : (row.displayName || 'No name saved')
}

function commentLink(value: string): string {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return ''
    if (url.hostname !== 'instagram.com' && url.hostname !== 'www.instagram.com') return ''
    return url.toString()
  } catch {
    return ''
  }
}

export function InstagramBatch({ title, rows, paste }: { title: string; rows: IgRow[]; paste: string }) {
  const [copied, setCopied] = useState('')
  const [sent, setSent] = useState<Record<string, boolean>>({})
  async function copy(value: string, id: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(id)
    } catch {
      setCopied('')
    }
  }
  return (
    <section className="rounded-[22px] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#15202B]">{title}</h2>
        <button type="button" className="min-h-11 rounded-full bg-[#15202B] px-4 text-sm font-bold text-white" onClick={() => void copy(paste, 'all')}>
          {copied === 'all' ? 'Copied' : 'Copy all for Muse'}
        </button>
      </div>
      <ul className="mt-4 divide-y divide-black/10">
        {rows.map((row) => {
          const link = commentLink(row.commentUrl)
          const one = [
            personLabel(row),
            row.commentUrl ? `Comment: ${row.commentUrl}` : '',
            row.dmUrl ? `DM thread: ${row.dmUrl}` : '',
            row.comment ? `COMMENT\n${row.comment}` : '',
            row.message ? `${row.comment ? 'DM\n' : ''}${row.message}` : '',
          ].filter(Boolean).join('\n')
          return (
            <li key={row.id} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[#15202B]">{personLabel(row)}</p>
                  <p className="text-sm text-[#5b6773]">{row.area || 'Area not saved'} · {row.doctor}{row.miles != null ? ` · ${row.miles} mi` : ''}</p>
                  {row.doctorHandle ? <p className="text-sm text-[#5b6773]">Doctor Instagram: @{row.doctorHandle}</p> : null}
                  <p className="text-sm text-[#5b6773]">
                    {link ? <a href={link} target="_blank" rel="noreferrer" className="font-bold text-[#D66829]">Original comment</a> : 'No comment link'}
                    {' · '}
                    {row.dmUrl ? <span>DM thread {row.dmUrl}</span> : 'No DM thread'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" className="min-h-11 text-sm font-bold text-[#D66829]" onClick={() => void copy(one, row.id)}>
                    {copied === row.id ? 'Copied' : 'Copy'}
                  </button>
                  <label className="flex min-h-11 items-center gap-2 text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={sent[row.id] ?? row.sent}
                      onChange={(event) => {
                        setSent((current) => ({ ...current, [row.id]: event.target.checked }))
                        void markInstagramSent(row.id, event.target.checked)
                      }}
                    />
                    Mark sent
                  </label>
                </div>
              </div>
              {row.comment ? (
                <div className="mt-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#5b6773]">Comment</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#15202B]">{row.comment}</p>
                </div>
              ) : null}
              {row.message ? (
                <div className="mt-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#5b6773]">DM</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#15202B]">{row.message}</p>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
