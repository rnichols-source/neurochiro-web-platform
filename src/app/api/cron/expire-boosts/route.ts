import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('doctors')
      .update({ is_boosted: false } as any)
      .eq('is_boosted', true)
      .lt('boost_expires_at', new Date().toISOString())
      .select('id');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const expired = data?.length || 0;
    return NextResponse.json({ message: `Expired ${expired} boosts` });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
