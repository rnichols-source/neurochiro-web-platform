import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { asLooseDb, asRows } from '@/lib/synapse/loose-db';

const BASE_COLUMNS = 'id, title, body, published_at';

export async function GET(request: NextRequest) {
  try {
    const vendorId = request.nextUrl.searchParams.get('vendorId');
    if (!vendorId) return NextResponse.json({ articles: [] });

    const supabase = asLooseDb(createAdminClient());
    const withFlag = await supabase
      .from('vendor_content')
      .select(`${BASE_COLUMNS}, is_sponsored`)
      .eq('vendor_id', vendorId)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(10);

    if (!withFlag.error) {
      return NextResponse.json({ articles: asRows(withFlag.data) });
    }

    const missingColumn = withFlag.error.code === '42703'
      || withFlag.error.code === 'PGRST204'
      || /is_sponsored|schema cache|does not exist/i.test(withFlag.error.message || '');
    if (!missingColumn) return NextResponse.json({ articles: [] });

    const plain = await supabase
      .from('vendor_content')
      .select(BASE_COLUMNS)
      .eq('vendor_id', vendorId)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(10);

    return NextResponse.json({ articles: plain.error ? [] : asRows(plain.data) });
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
