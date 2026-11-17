/** Form steps: 1 practice, 2 office, 3 card. Public URLs use step 2, step 2 part 2, and step 3. */
export function applyStepPath(pathname: string, search: string, step: 1 | 2 | 3): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  params.delete('canceled')
  if (step === 1) {
    params.set('step', '2')
    params.delete('part')
  } else if (step === 2) {
    params.set('step', '2')
    params.set('part', '2')
  } else {
    params.set('step', '3')
    params.delete('part')
  }
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export const CARD_STEP_PATH = '/doctor/apply?step=3&resume=1'
export const CARD_STEP_URL = `https://neurochiro.co${CARD_STEP_PATH}`

/** Apply page or the one-time sign-in link that opens it. Anything else falls back to the card step. */
export function safeApplicationUrl(value: string | null | undefined): string {
  if (!value) return CARD_STEP_URL
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.hostname !== 'neurochiro.co') return CARD_STEP_URL
    if (url.pathname === '/doctor/apply' || url.pathname === '/auth/activate') return url.toString()
  } catch {
    return CARD_STEP_URL
  }
  return CARD_STEP_URL
}
