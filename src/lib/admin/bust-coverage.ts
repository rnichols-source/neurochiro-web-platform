import { revalidatePath, updateTag } from 'next/cache'

export function bustAdminCoverage() {
  updateTag('admin-coverage')
  revalidatePath('/admin/coverage')
}
