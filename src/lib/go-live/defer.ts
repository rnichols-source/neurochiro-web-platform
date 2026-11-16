import { waitUntil } from '@vercel/functions'

export function deferGoLive(work: Promise<unknown>): void {
  waitUntil(Promise.resolve(work).catch((error) => {
    console.error('[go-live] deferred work failed', error instanceof Error ? error.name : 'error')
  }))
}
