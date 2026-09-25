import { redirect } from 'next/navigation'

// Career Pipeline is now the main dashboard. Redirect for old links/bookmarks.
export default function CareerPipelineRedirect() {
  redirect('/student/dashboard')
}
