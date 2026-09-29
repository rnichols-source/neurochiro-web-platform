import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || ''
  const country = req.nextUrl.searchParams.get('country') || 'US'

  const { checkDemandNearby } = await import('@/app/(public)/pro/actions')
  const result = await checkDemandNearby(query, country)

  return NextResponse.json(result)
}
