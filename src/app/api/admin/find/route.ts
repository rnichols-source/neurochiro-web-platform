import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await checkAdminAuth()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const q = (req.nextUrl.searchParams.get('q') || '').trim()
  if (q.length < 2 || q.length > 80) return NextResponse.json({ hits: [] })
  const like = `%${q.replace(/[%_]/g, '')}%`
  const admin = createAdminClient() as any
  const [doctors, people, subscribers, applications] = await Promise.all([
    admin.from('doctors').select('id, first_name, last_name, clinic_name, city, state, email, is_test').or(`first_name.ilike.${quote(like)},last_name.ilike.${quote(like)},clinic_name.ilike.${quote(like)},city.ilike.${quote(like)},email.ilike.${quote(like)}`).limit(8),
    admin.from('profiles').select('id, full_name, email, role, is_test').or(`full_name.ilike.${quote(like)},email.ilike.${quote(like)}`).in('role', ['patient', 'student', 'doctor']).limit(8),
    admin.from('subscribers').select('id, email, status').ilike('email', like).limit(6),
    admin.from('doctor_applications').select('id, city, state, status').or(`city.ilike.${quote(like)},state.ilike.${quote(like)}`).limit(5),
  ])
  const hits = [
    ...(doctors.data || []).filter((row: { is_test?: boolean }) => row.is_test !== true).map((row: { id: string; first_name?: string; last_name?: string; city?: string; state?: string; clinic_name?: string }) => ({
      title: `Dr. ${[row.first_name, row.last_name].filter(Boolean).join(' ')}`,
      subtitle: ['Doctor', row.clinic_name, [row.city, row.state].filter(Boolean).join(', ')].filter(Boolean).join(' · '),
      href: `/admin/people?id=${row.id}`,
    })),
    ...(people.data || []).filter((row: { is_test?: boolean }) => row.is_test !== true).map((row: { id: string; full_name?: string; role?: string; email?: string }) => ({
      title: row.full_name || 'Unnamed',
      subtitle: `${row.role === 'patient' ? 'Community member' : row.role || 'Person'}${row.email ? ` · ${row.email}` : ''}`,
      href: row.role === 'doctor' ? '/admin/members' : '/admin/people',
    })),
    ...(subscribers.data || []).map((row: { email?: string; status?: string }) => ({
      title: row.email || 'Subscriber',
      subtitle: `Subscriber · ${row.status || 'unknown'}`,
      href: '/admin/list',
    })),
    ...(applications.data || []).map((row: { city?: string; state?: string; status?: string }) => ({
      title: [row.city, row.state].filter(Boolean).join(', ') || 'Application',
      subtitle: `Application · ${row.status || ''}`,
      href: '/admin/applications',
    })),
  ].slice(0, 16)
  return NextResponse.json({ hits })
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '')}"`
}
