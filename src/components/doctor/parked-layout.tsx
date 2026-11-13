import { redirect } from 'next/navigation'

export function parkedLayout(hash: string) {
  redirect(`/doctor/coming-soon#${hash}`)
}
