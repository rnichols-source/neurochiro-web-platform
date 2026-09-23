import { Resend } from 'resend';

/**
 * Marketing email client — uses a separate Resend API key and sending domain.
 * Never falls back to the transactional key. Fails loudly if not configured.
 */

let _client: Resend | null = null;

export function getMarketingResend(): Resend {
  if (_client) return _client;

  const key = process.env.RESEND_MARKETING_API_KEY;
  if (!key) {
    throw new Error(
      'RESEND_MARKETING_API_KEY is not set. Marketing emails cannot be sent. ' +
      'This key must point to the Resend domain for mail.neurochiro.co, not the transactional domain.'
    );
  }
  _client = new Resend(key);
  return _client;
}

export function getMarketingFrom(): string {
  const from = process.env.RESEND_MARKETING_FROM;
  if (!from) {
    throw new Error(
      'RESEND_MARKETING_FROM is not set. Expected format: "NeuroChiro <hello@mail.neurochiro.co>"'
    );
  }
  return from;
}

export function getMailingAddress(): string {
  const addr = process.env.NEUROCHIRO_MAILING_ADDRESS;
  if (!addr) {
    throw new Error(
      'NEUROCHIRO_MAILING_ADDRESS is not set. Required for CAN-SPAM compliance in every marketing email.'
    );
  }
  return addr;
}

export function getAudienceId(): string {
  const id = process.env.RESEND_AUDIENCE_ID;
  if (!id) {
    throw new Error(
      'RESEND_AUDIENCE_ID is not set. Create an Audience in Resend and set this env var.'
    );
  }
  return id;
}

/**
 * Wraps marketing email content with CAN-SPAM footer.
 */
export function wrapMarketingEmail(bodyHtml: string): string {
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
