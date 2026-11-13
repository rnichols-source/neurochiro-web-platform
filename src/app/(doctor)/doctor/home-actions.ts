'use server'

import { cookies } from 'next/headers'

export async function skipProfileStep() {
  const jar = await cookies()
  jar.set('nc_doctor_skip_profile', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 18,
  })
}
