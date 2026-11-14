'use client'

import { useState } from 'react'
import { createInstagramBackfill, importInstagramWaitlist } from './actions'

export function InstagramImport() {
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <form
      className="rounded-[22px] bg-white p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault()
        setBusy(true)
        void importInstagramWaitlist(text).then((result) => {
          setNote(`Saved ${result.saved}. Skipped ${result.skipped}. ${result.errors.slice(0, 3).join(' ')}`)
          setBusy(false)
        }).catch(() => {
          setNote('The import did not save. Apply the go-live migration, then try again.')
          setBusy(false)
        })
      }}
    >
      <h2 className="text-lg font-bold text-[#15202B]">Load Instagram requests</h2>
      <p className="mt-1 text-sm text-[#5b6773]">Paste handle, location, and date. One person per line. A header row is fine.</p>
      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={8} className="mt-3 w-full rounded-xl border border-black/10 px-3 py-2 text-sm" placeholder={'handle,location,date\n@ada.spine,"Greenville, SC",2026-10-02'} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="min-h-11 rounded-full bg-[#D66829] px-4 text-sm font-bold text-white disabled:opacity-50">Import</button>
        <button
          type="button"
          disabled={busy}
          className="min-h-11 rounded-full bg-[#15202B] px-4 text-sm font-bold text-white disabled:opacity-50"
          onClick={() => {
            setBusy(true)
            void createInstagramBackfill().then((result) => {
              setNote(`Backfill created ${result.batches} batches for ${result.people} people who already have a doctor within 25 miles.`)
              setBusy(false)
            }).catch(() => {
              setNote('The backfill did not run. Apply the go-live migration, then try again.')
              setBusy(false)
            })
          }}
        >
          Build 25-mile backfill
        </button>
      </div>
      {note ? <p className="mt-3 text-sm text-[#15202B]">{note}</p> : null}
    </form>
  )
}
