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
    subject: "Welcome to NeuroChiro — here's what to expect",
    bodyHtml: `
      <p style="font-size:15px;color:#333;line-height:1.6;">Welcome to the NeuroChiro patient list.</p>
      <p style="font-size:15px;color:#333;line-height:1.6;">You signed up because you're looking for a nervous system chiropractor in your area, or you want to learn more about how your nervous system affects your health. Either way, you're in the right place.</p>
      <p style="font-size:15px;color:#333;line-height:1.6;">Here's what you'll get from us:</p>
      <ul style="font-size:15px;color:#333;line-height:2;">
        <li>Weekly education on how the nervous system controls your body's ability to heal</li>
        <li>An alert when a NeuroChiro doctor joins near your ZIP code</li>
        <li>No spam, no selling, no fluff</li>
      </ul>
      <p style="font-size:15px;color:#333;line-height:1.6;">In the meantime, you can browse the doctors already on NeuroChiro:</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://neurochiro.co/directory" style="display:inline-block;background:#D66829;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">Browse the Directory</a>
      </div>
      <p style="font-size:15px;color:#333;line-height:1.6;">Talk soon,</p>
      <p style="font-size:15px;color:#333;"><strong>Dr. Ray</strong><br>Founder, NeuroChiro</p>
    `,
  },
  {
    step: 1,
    dayOffset: 3,
    subject: "Why your nervous system matters more than you think",
    bodyHtml: `
      <p style="font-size:15px;color:#333;line-height:1.6;">Your brain and spinal cord make up your central nervous system. Every function in your body, from digestion to sleep to immunity, is controlled by it.</p>
      <p style="font-size:15px;color:#333;line-height:1.6;">When there's interference in that system (chiropractors call it a subluxation), your body can't communicate properly. That's when symptoms show up: headaches, fatigue, digestive issues, brain fog, poor sleep, and more.</p>
      <p style="font-size:15px;color:#333;line-height:1.6;">A nervous system chiropractor doesn't just address pain. They find and correct the interference so your body can do what it's designed to do: heal itself.</p>
      <p style="font-size:15px;color:#333;line-height:1.6;">That's the difference between symptom management and actually getting better.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://neurochiro.co/why-neurochiro" style="display:inline-block;background:#D66829;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">Learn More</a>
      </div>
      <p style="font-size:15px;color:#333;line-height:1.6;">Dr. Ray</p>
    `,
  },
  {
    step: 2,
    dayOffset: 7,
    subject: "Real stories from real patients",
    bodyHtml: `
      <p style="font-size:15px;color:#333;line-height:1.6;">Every week, we interview chiropractors on the NeuroChiro Spotlight. The stories they share are powerful.</p>
      <p style="font-size:15px;color:#333;line-height:1.6;">A woman with chronic migraines who hasn't had one in a year. A man who walked in carrying an oxygen generator and walked out without it. An 8-year-old who ate a cookie at a birthday party with no stomach issues for the first time.</p>
      <p style="font-size:15px;color:#333;line-height:1.6;">These aren't miracles. This is what happens when the nervous system is functioning properly.</p>
      <p style="font-size:15px;color:#333;line-height:1.6;">Watch the interviews and see for yourself:</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://neurochiro.co/spotlight" style="display:inline-block;background:#D66829;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">Watch the Spotlight</a>
      </div>
      <p style="font-size:15px;color:#333;line-height:1.6;">And if you haven't found a doctor near you yet, we're working on it. When one joins your area, you'll be the first to know.</p>
      <p style="font-size:15px;color:#333;line-height:1.6;">Dr. Ray</p>
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
