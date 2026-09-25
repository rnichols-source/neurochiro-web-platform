import { NextRequest, NextResponse } from 'next/server'
import { verifySchoolToken } from '@/lib/school-verification'

/**
 * GET /api/verify-school?token=xxx
 * Called when a student clicks the verification link in their school email.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/student/dashboard?verify=missing', request.url))
  }

  const result = await verifySchoolToken(token)

  if (result.success) {
    return NextResponse.redirect(
      new URL(`/student/dashboard?verify=success&school=${encodeURIComponent(result.schoolName || '')}`, request.url)
    )
  }

  return NextResponse.redirect(
    new URL(`/student/dashboard?verify=error&reason=${encodeURIComponent(result.error || 'unknown')}`, request.url)
  )
}
