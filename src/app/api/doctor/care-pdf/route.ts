import { NextResponse } from 'next/server'
import { getPortalContext } from '@/lib/portal/context'
import { libraryPlans } from '@/lib/community/library-content'
import { planBySlug } from '@/lib/community/library-model'
import { careSetPdf } from '@/lib/doctor/care-pdf'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const ctx = await getPortalContext()
  if (!ctx?.doctor) return NextResponse.json({ error: 'Sign in as a doctor.' }, { status: 401 })
  const slug = new URL(request.url).searchParams.get('slug') || ''
  const plan = planBySlug(libraryPlans(), slug)
  if (!plan) return NextResponse.json({ error: 'That care set was not found.' }, { status: 404 })
  const doctor = [ctx.doctor.clinic_name, ctx.fullName].filter(Boolean).join(' · ')
  const lines = [
    'NeuroChiro',
    plan.name,
    doctor || 'Your doctor',
    plan.objective,
    '',
  ]
  plan.phases.forEach((phase) => {
    lines.push(phase.name)
    phase.exercises.forEach((exercise, index) => {
      lines.push(`${index + 1}. ${exercise.name}`)
      if (exercise.rx) lines.push(`   ${exercise.rx}`)
      if (exercise.description) lines.push(`   ${exercise.description}`)
    })
    lines.push('')
  })
  lines.push('neurochiro.co')
  const pdf = careSetPdf(lines)
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${plan.slug}.pdf"`,
    },
  })
}
