import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const vendorId = request.nextUrl.searchParams.get('vendorId');
  if (!vendorId) return NextResponse.json({ articles: [] });

  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from('vendor_content')
    .select('id, title, body, published_at')
    .eq('vendor_id', vendorId)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(10);

  return NextResponse.json({ articles: data || [] });
}
