import { getMarketingResend, getMarketingFrom, getMailingAddress, getAudienceId } from './marketing-email';

/**
 * Welcome sequence email content.
 * Three emails: day 0 (on confirmation), day 3, day 7.
 * Placeholder copy — Dr. Ray will supply real content.
 */

export interface WelcomeStep {
  step: number;
  dayOffset: number;
  subject: string;
  bodyHtml: string;
}

export const WELCOME_STEPS: WelcomeStep[] = [
  {
    step: 0,
    dayOffset: 0,
    subject: "You're in. Here's what happens next.",
    bodyHtml: `
      <p style="font-size:15px;color:#333;line-height:1.7;">Hi there,</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">You're in. Welcome to NeuroChiro.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">I'm Dr. Ray, a chiropractor in Greer, South Carolina, and I started NeuroChiro because of a problem I kept running into: people would ask me to recommend a chiropractor in their city, and I'd have no idea who to send them to.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">Not every chiropractor practices the same way. The doctors in the NeuroChiro directory focus on the nervous system, which is the system running everything else in your body. That's a different approach than getting cracked and sent on your way.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">Here's what to expect from me:</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">One email a week. Real education about how your nervous system affects your sleep, your energy, your digestion, your stress, and your pain. No hype, no fear tactics, no selling you a supplement.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">And the moment a NeuroChiro doctor joins in your area, you'll be the first to know.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">One quick thing: hit reply and tell me what brought you here. Pain that won't quit? Trying to keep your kids healthy? Just curious? I read every reply, and it tells me what to write about.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">Talk soon,</p>
      <p style="font-size:15px;color:#333;"><strong>Dr. Ray</strong><br>NeuroChiro | <a href="https://neurochiro.co" style="color:#D66829;">neurochiro.co</a></p>
    `,
  },
  {
    step: 1,
    dayOffset: 3,
    subject: "It was never really about your back",
    bodyHtml: `
      <p style="font-size:15px;color:#333;line-height:1.7;">Hi there,</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">Most people think a chiropractor is for back pain. That's like saying a mechanic is for flat tires.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">Here's the part nobody explains at the front desk.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">Your brain and spinal cord run every single thing in your body you never think about. Your heart rate. Your digestion. Your immune response. How deeply you sleep. How fast you recover from stress. Every one of those signals travels through your spine.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">When your spine doesn't move the way it's supposed to, those signals get noisy. Your body picks a side: stuck in stress mode, or able to rest and repair. Most people are living in the first one and have been for years. It shows up as the stuff you've stopped mentioning to your doctor because it's just how you are now. Tired at 2pm. Wired at 11pm. Shoulders up by your ears. Getting sick more than you used to.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">Pain is the smoke alarm. It's the last thing to show up and the first thing to leave. It is not the fire.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">That's why nervous system-focused chiropractors check how your spine is functioning, not just where it hurts. The goal isn't to make the pain quiet. It's to get the signal clean so your body can do what it already knows how to do.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">Next week I'll get into what's actually happening when that stress response gets stuck in the on position, and a few things you can do about it tonight.</p>
      <p style="font-size:15px;color:#333;"><strong>Dr. Ray</strong><br>NeuroChiro | <a href="https://neurochiro.co" style="color:#D66829;">neurochiro.co</a></p>
    `,
  },
  {
    step: 2,
    dayOffset: 7,
    subject: "How the directory works (and one thing to try this week)",
    bodyHtml: `
      <p style="font-size:15px;color:#333;line-height:1.7;">Hi there,</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">Two quick things.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">First, a heads-up on how the directory works. Every doctor listed on NeuroChiro is a licensed chiropractor who practices with a nervous system focus. This isn't a scraped list of everybody with a license in your state. Each one applies, and I review them before they're listed.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">If there's already one near you, you can find them here: <a href="https://neurochiro.co" style="color:#D66829;font-weight:bold;">neurochiro.co</a></p>
      <p style="font-size:15px;color:#333;line-height:1.7;">If there isn't, that's exactly why you're on this list. I use where you all are to decide which cities to recruit doctors in next. When one joins near you, you'll hear from me.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">Second, one thing to try this week.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">Before you get out of bed tomorrow, take six slow breaths. In through your nose for four counts, out through your mouth for six. The long exhale is the part that matters. It's one of the few direct switches you have into the rest-and-repair side of your nervous system.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">It won't fix anything structural. But it'll show you how fast your body responds when you give it the right signal, and it costs you ninety seconds.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">From here you'll hear from me once a week. Education, doctor spotlights, and answers to the questions people keep sending in.</p>
      <p style="font-size:15px;color:#333;line-height:1.7;">Glad you're here.</p>
      <p style="font-size:15px;color:#333;"><strong>Dr. Ray</strong><br>NeuroChiro | <a href="https://neurochiro.co" style="color:#D66829;">neurochiro.co</a></p>
    `,
  },
];

/**
 * Wraps welcome email content with header, footer, unsubscribe link, and mailing address.
 */
export function wrapWelcomeEmail(bodyHtml: string): string {
  const address = getMailingAddress();
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1E2D3B;padding:28px;text-align:center;">
        <h1 style="color:white;font-size:22px;margin:0;">NEURO<span style="color:#D66829;">CHIRO</span></h1>
      </div>
      <div style="padding:28px;background:white;">
        ${bodyHtml}
      </div>
      <div style="background:#f5f3ef;padding:20px;text-align:center;font-size:11px;color:#999;line-height:1.6;">
        <p style="margin:0 0 8px;">This email contains educational content only. It is not medical advice and does not create a doctor-patient relationship.</p>
        <p style="margin:0 0 8px;">${address}</p>
        <p style="margin:0;">
          <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#D66829;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `;
}

/**
 * Sends a single welcome step to a subscriber.
 * Writes to sequence_state BEFORE sending to prevent double-send.
 * If the send fails, deletes the sequence_state row.
 */
export async function sendWelcomeStep(
  supabase: any,
  subscriberId: string,
  email: string,
  step: WelcomeStep,
  dryRun: boolean = false
): Promise<{ sent: boolean; error?: string }> {
  // Attempt to insert sequence_state row first (idempotency guard)
  const { error: insertError } = await supabase
    .from('sequence_state')
    .insert({ subscriber_id: subscriberId, step: step.step });

  if (insertError) {
    if (insertError.code === '23505') {
      // Already sent this step
      return { sent: false, error: 'already_sent' };
    }
    return { sent: false, error: insertError.message };
  }

  if (dryRun) {
    // Roll back the insert for dry run
    await supabase
      .from('sequence_state')
      .delete()
      .eq('subscriber_id', subscriberId)
      .eq('step', step.step);
    return { sent: true };
  }

  // Send the email
  try {
    const resend = getMarketingResend();
    const from = getMarketingFrom();

    await resend.emails.send({
      from,
      to: [email],
      subject: step.subject,
      html: wrapWelcomeEmail(step.bodyHtml),
      headers: {
        'List-Unsubscribe': '<{{{RESEND_UNSUBSCRIBE_URL}}}>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    return { sent: true };
  } catch (sendErr: any) {
    // Send failed — roll back the sequence_state row
    await supabase
      .from('sequence_state')
      .delete()
      .eq('subscriber_id', subscriberId)
      .eq('step', step.step);
    return { sent: false, error: sendErr.message };
  }
}
