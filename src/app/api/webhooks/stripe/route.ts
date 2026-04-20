import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { Automations } from "@/lib/automations";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;
  const supabase = createServerSupabase();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 1. IDEMPOTENCY CHECK
  const { data: alreadyProcessed } = await supabase
    .from('processed_webhooks')
    .select('id')
    .eq('id', event.id)
    .single();

  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // 2. RECORD PROCESSING START
  await supabase.from('processed_webhooks').insert({ id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const customer = session.customer as string;

        if (userId) {
          // Update profile with Stripe customer ID and activate membership
          await supabase
            .from('profiles')
            .update({
              stripe_customer_id: customer,
              subscription_status: 'active',
              tier: 'active',
            })
            .eq('id', userId);

          // If user is a doctor, mark as verified
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

          if (profile?.role === 'doctor') {
            await supabase
              .from('doctors')
              .update({ verification_status: 'verified' })
              .eq('user_id', userId);
          }

          // Handle metadata-driven record creation
          const metaType = session.metadata?.type;

          if (metaType === 'vendor') {
            await supabase.from('vendors').insert({
              id: userId,
              name: session.metadata?.company_name || '',
              short_description: session.metadata?.description || '',
              is_active: false,
            });
          }

          if (metaType === 'seminar_listing') {
            await supabase.from('seminars').insert({
              host_id: userId,
              title: session.metadata?.title || 'Untitled Seminar',
              description: session.metadata?.description || '',
              dates: session.metadata?.dates || new Date().toISOString(),
              location: session.metadata?.location || null,
              is_approved: false,
            });
          }

          if (metaType === 'course_purchase') {
            const courseId = session.metadata?.courseId;
            if (courseId) {
              await (supabase as any).from('course_purchases').insert({
                user_id: userId,
                course_id: courseId,
                stripe_session_id: session.id,
                amount: session.amount_total,
              });
            }
          }

          if (metaType === 'store_purchase') {
            const productId = session.metadata?.productId;
            if (productId) {
              await (supabase as any).from('course_purchases').insert({
                user_id: userId,
                course_id: productId,
                stripe_session_id: session.id,
                amount: session.amount_total,
                source: 'store',
              });
            }
          }

          if (metaType === 'store_cart') {
            const productIds = (session.metadata?.productIds || '').split(',').filter(Boolean);
            for (const pid of productIds) {
              await (supabase as any).from('course_purchases').upsert({
                user_id: userId,
                course_id: pid,
                stripe_session_id: session.id,
                amount: session.amount_total,
                source: 'store',
              }, { onConflict: 'user_id,course_id' });
            }
          }

          if (metaType === 'course_bundle') {
            const courseIds = (session.metadata?.courseIds || '').split(',').filter(Boolean);
            for (const courseId of courseIds) {
              await (supabase as any).from('course_purchases').upsert({
                user_id: userId,
                course_id: courseId,
                stripe_session_id: session.id,
                amount: session.amount_total,
              }, { onConflict: 'user_id,course_id' });
            }
          }

          if (metaType === 'job_listing') {
            const durationDays = parseInt(session.metadata?.duration || '30', 10);
            const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
            await supabase.from('job_postings').insert({
              doctor_id: userId || session.metadata?.contact_email || 'guest',
              title: session.metadata?.title || 'Untitled Position',
              description: session.metadata?.description || '',
              category: session.metadata?.category || null,
              employment_type: session.metadata?.employment_type || null,
              salary_min: parseInt(session.metadata?.salary_min || '0', 10) || null,
              salary_max: parseInt(session.metadata?.salary_max || '0', 10) || null,
              city: session.metadata?.city || null,
              state: session.metadata?.state || null,
              apply_method: 'neurochiro',
              expires_at: expiresAt,
              status: 'Active',
            });
          }
        }

        // Handle guest store purchases (no userId)
        if (!userId) {
          const metaType = session.metadata?.type;
          const customerEmail = session.customer_details?.email || session.customer_email;

          if (metaType === 'store_purchase' && customerEmail) {
            const productId = session.metadata?.productId;
            if (productId) {
              await (supabase as any).from('course_purchases').insert({
                course_id: productId,
                stripe_session_id: session.id,
                amount: session.amount_total,
                source: 'store',
                guest_email: customerEmail,
              });
            }
          }

          if (metaType === 'store_cart' && customerEmail) {
            const productIds = (session.metadata?.productIds || '').split(',').filter(Boolean);
            for (const pid of productIds) {
              await (supabase as any).from('course_purchases').insert({
                course_id: pid,
                stripe_session_id: session.id,
                amount: session.amount_total,
                source: 'store',
                guest_email: customerEmail,
              });
            }
          }
        }

        // Enqueue automations
        Automations.onPaymentSuccess(session);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const customer = invoice.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customer)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'active', tier: 'active' })
            .eq('id', profile.id);
        }

        Automations.onPaymentSuccess(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const customer = invoice.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customer)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due', tier: 'free' })
            .eq('id', profile.id);
        }

        Automations.onPaymentFailed(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const customer = subscription.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customer)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_status: subscription.status })
            .eq('id', profile.id);
        }

        Automations.onSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customer = subscription.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customer)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'canceled', tier: 'free' })
            .eq('id', profile.id);
        }

        Automations.onSubscriptionCanceled(subscription);
        break;
      }
    }
  } catch (error) {
    console.error("Webhook Automation Dispatch Error:", error);
  }

  return NextResponse.json({ received: true });
}
