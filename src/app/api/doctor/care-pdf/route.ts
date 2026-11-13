import { readFile } from 'node:fs/promises'
import path from 'node:path'
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
  const logo = await readFile(path.join(process.cwd(), 'public/logo-white.png')).catch(() => undefined)
  const pdf = await careSetPdf({
    doctorName: ctx.fullName || 'Your doctor',
    clinicName: ctx.doctor.clinic_name || '',
    title: plan.name,
    objective: plan.objective,
    logoPng: logo,
    exercises: plan.phases.flatMap((phase) => phase.exercises.map((exercise) => ({
      phase: phase.name,
      name: exercise.name,
      steps: [exercise.rx, exercise.description].filter(Boolean),
    }))),
  })
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${plan.slug}.pdf"`,
    },
  })
}
