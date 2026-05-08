import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ badges: [] });

  try {
    const sb = createAdminClient() as any;
    const { data } = await sb
      .from('doctor_badges')
      .select('badge_id')
      .eq('user_id', userId);

    return NextResponse.json({ badges: (data || []).map((b: any) => b.badge_id) });
  } catch {
    return NextResponse.json({ badges: [] });
  }
}
