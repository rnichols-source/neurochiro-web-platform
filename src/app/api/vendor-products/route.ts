import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const vendorId = request.nextUrl.searchParams.get('vendorId');
    if (!vendorId) return NextResponse.json({ products: [] });

    const sb = createAdminClient() as any;
    const { data } = await sb
      .from('vendor_products')
      .select('id, name, description, price, image_url, link_url')
      .eq('vendor_id', vendorId)
      .order('sort_order', { ascending: true })
      .limit(8);

    return NextResponse.json({ products: data || [] });
  } catch {
    return NextResponse.json({ products: [] });
  }
}
