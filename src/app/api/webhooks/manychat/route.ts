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
 *   "role": "{{role}}",
 *   "location": "{{location}}",
 *   "interest": "standard" | "vip" | "screening",  -- keyword they commented
 *   "source": "screening-weekend" | "general"       -- which flow triggered this
 * }
 */

export async function POST(req: NextRequest) {
  const secret = process.env.MANYCHAT_WEBHOOK_SECRET;
  const authHeader = req.headers.get('authorization');
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
      interest,
      source,
      ...extraMetadata
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing ManyChat user_id' }, { status: 400 });
    }

    // Build metadata with screening interest if present
    const metadata: Record<string, unknown> = {
      ...extraMetadata,
      ...(interest && { screening_interest: interest.toLowerCase() }),
      ...(source && { source }),
      captured_at: new Date().toISOString(),
    };

    // Insert or Update the lead
    const { data, error } = await (supabase as any)
      .from('leads')
      .upsert({
        manychat_id: user_id.toString(),
        first_name,
        last_name,
        email,
        phone,
        role: role?.toLowerCase() || 'doctor',
        location,
        metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'manychat_id'
      })
      .select();

    if (error) {
      console.error('Supabase error saving ManyChat lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Discord notification for screening weekend leads
    const isScreeningLead = source === 'screening-weekend' ||
      ['standard', 'vip', 'screening'].includes((interest || '').toLowerCase());

    if (isScreeningLead) {
      const discordUrl = process.env.DISCORD_WEBHOOK_URL;
      if (discordUrl) {
        const tierLabel = (interest || '').toLowerCase() === 'vip'
          ? 'VIP / Accelerator'
          : (interest || '').toLowerCase() === 'standard'
            ? 'Standard / Intensive'
            : 'General Interest';

        await fetch(discordUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `📱 **SCREENING WEEKEND LEAD (ManyChat)**\n\n**Name:** ${first_name || ''} ${last_name || ''}\n**Interest:** ${tierLabel}\n**Email:** ${email || 'Not provided'}\n**Phone:** ${phone || 'Not provided'}\n**Source:** Instagram comment\n**Time:** ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`,
          }),
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lead captured successfully',
      lead_id: data?.[0]?.id,
      is_screening_lead: isScreeningLead,
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
