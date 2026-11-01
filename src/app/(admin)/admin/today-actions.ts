'use server'

import { updateTag } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'

export async function refreshAdminToday() {
  await checkAdminAuth()
  updateTag('admin-today')
}
