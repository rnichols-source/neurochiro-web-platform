import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

/**
 * MANYCHAT WEBHOOK HANDLER
 * 
 * Expected payload (ManyChat "External Request" block):
 * {
 *   "user_id": "{{user_id}}",
 *   "first_name": "{{first_name}}",
 *   "last_name": "{{last_name}}",
 *   "email": "{{email}}",
 *   "phone": "{{phone}}",
 *   "role": "{{role}}", -- Custom User Field in ManyChat
 *   "location": "{{location}}" -- Custom User Field in ManyChat
 * }
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    const {
      user_id,
      first_name,
      last_name,
      email,
      phone,
      role,
      location,
      ...metadata
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing ManyChat user_id' }, { status: 400 });
    }

    // Insert or Update the lead
    const { data, error } = await supabase
      .from('leads')
      .upsert({
        manychat_id: user_id.toString(),
        first_name,
        last_name,
        email,
        phone,
        role: role?.toLowerCase() || 'new',
        location,
        metadata: metadata || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'manychat_id'
      })
      .select();

    if (error) {
      console.error('Supabase error saving ManyChat lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // LOGIC: If lead is a doctor, we could potentially trigger an automation
    // or notify the admin immediately.
    
    return NextResponse.json({ 
      success: true, 
      message: 'Lead captured successfully',
      lead_id: data?.[0]?.id 
    });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Ensure the endpoint is reachable (basic GET for healthcheck)
export async function GET() {
  return NextResponse.json({ status: 'ManyChat Webhook Endpoint Active' });
}
