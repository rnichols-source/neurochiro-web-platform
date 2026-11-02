'use server'

import { updateTag } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'

export async function refreshAdminDirectories() {
  await checkAdminAuth()
  updateTag('admin-coverage')
  updateTag('admin-member-billing')
}
