import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';
import { parse } from 'csv-parse/sync';
import twilio from 'twilio';
import * as dotenv from 'dotenv';

// Load .env from the root of neurochiro-web-platform
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// --- CONFIGURATION ---
const CSV_PATH = path.resolve(process.cwd(), '../Downloads/Chiropractors-Grid view.csv');
const TEST_EMAIL = 'drray@neurochirodirectory.com';
const TEST_PHONE = '+18645939279'; // User's requested phone
const DRY_RUN = process.argv.includes('--dry-run');

const api_key = process.env.RESEND_API_KEY || process.argv.find(a => a.startsWith('--key='))?.split('=')[1] || 're_mock_key';
const resend = new Resend(api_key);

// Twilio Config
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || process.argv.find(a => a.startsWith('--tw-sid='))?.split('=')[1];
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN || process.argv.find(a => a.startsWith('--tw-auth='))?.split('=')[1];
const TWILIO_FROM = process.env.TWILIO_PHONE || process.argv.find(a => a.startsWith('--tw-from='))?.split('=')[1];

const twilioClient = TWILIO_SID && TWILIO_AUTH ? twilio(TWILIO_SID, TWILIO_AUTH) : null;

async function migrate() {
  console.log("🚀 STARTING PREMIUM DOCTOR MIGRATION...");
  
  const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const records = parse(fileContent, {
    columns: (header: string[]) => header.map(h => h.trim().replace(/^\uFEFF/, '')),
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    quote: '"',
    escape: '"',
    ltrim: true,
    rtrim: true
  }) as any[];

  const doctors = records.filter(r => r['Full Name']?.trim().length > 0).map(r => ({
    name: r['Full Name'].trim(),
    practice: r['Practice Name']?.trim(),
    email: (r['Contact Email'] || r['Practice Email'])?.trim()
  }));

  console.log(`📊 Extracted ${doctors.length} valid doctor profiles!`);

  if (DRY_RUN) {
    const doc = doctors[0];
    
    // 1. Send Branded Email
    console.log(`🧪 Sending PREMIUM EMAIL TEST to ${TEST_EMAIL}`);
    await sendInvitation(TEST_EMAIL, doc.name, doc.practice);
    
    // 2. Send SMS Test
    console.log(`🧪 Sending SMS TEST to ${TEST_PHONE}`);
    await sendSMSInvite(TEST_PHONE, doc.name);
    
    console.log("✅ Multi-channel dry run complete.");
    return;
  }
}

async function sendSMSInvite(to: string, name: string) {
  const displayName = name.startsWith("Dr. ") ? name : `Dr. ${name}`;
  const message = `Hello ${displayName}, your NeuroChiro profile is live on our new platform! Claim your account here: https://neurochiro.co/register?role=doctor&tier=starter - Dr. Raymond Nichols`;

  if (!twilioClient) {
    console.log("\n--- [SMS PREVIEW] ---");
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log("---------------------\n");
    console.log("⚠️ TWILIO CREDENTIALS MISSING. SMS NOT SENT.");
    return;
  }

  try {
    const res = await twilioClient.messages.create({
      body: message,
      from: TWILIO_FROM,
      to: to
    });
    console.log(`✅ SMS sent successfully to ${to}. SID: ${res.sid}`);
  } catch (err: any) {
    console.error(`❌ Twilio Error: ${err.message}`);
  }
}

async function sendInvitation(to: string, name: string, practice: string) {
  const subject = `Your NeuroChiro Profile is Live! 🧠`;
  const displayName = name.startsWith("Dr. ") ? name : `Dr. ${name}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Lato', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #FCF9F5; }
        .wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 40px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 20px 50px rgba(11, 17, 24, 0.1); border: 1px solid #E5E7EB; }
        .header { background-color: #FFFFFF; padding: 40px; text-align: center; border-bottom: 1px solid #F3F4F6; }
        .content { padding: 60px 50px; color: #0B1118; }
        .btn { display: inline-block; background-color: #D66829; color: #FFFFFF !important; padding: 22px 45px; text-decoration: none; border-radius: 20px; font-weight: 900; font-size: 16px; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 10px 30px rgba(214, 104, 41, 0.3); }
        .practice-card { background-color: #F3F4F6; border-radius: 25px; padding: 30px; margin: 40px 0; border-left: 6px solid #D66829; }
        h1 { font-weight: 900; color: #0B1118; font-size: 32px; line-height: 1.2; margin-bottom: 25px; }
        p { font-size: 18px; line-height: 1.7; color: #4B5563; }
        .footer { text-align: center; padding: 40px; font-size: 12px; color: #9CA3AF; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <img src="https://neurochiro.co/logo.png" alt="NeuroChiro" width="120" style="display: block; margin: 0 auto;">
        </div>
        <div class="content">
          <div style="text-transform: uppercase; color: #D66829; font-weight: 900; letter-spacing: 3px; font-size: 12px; margin-bottom: 15px;">Welcome to the Evolution</div>
          <h1>Hello ${displayName},</h1>
          <p>We’ve officially migrated the <strong>NeuroChiro Ecosystem</strong> to a new platform. Your clinic is already live in the global directory.</p>
          <div class="practice-card">
            <div style="font-weight: 900; font-size: 14px; text-transform: uppercase; color: #9CA3AF; margin-bottom: 5px;">Linked Practice</div>
            <div style="font-size: 22px; font-weight: 900; color: #0B1118;">${practice}</div>
          </div>
          <p>We have started you on our <strong>Starter Membership (Complimentary)</strong>. Claim your account to access your new dashboard.</p>
          <div style="text-align: center; margin-top: 50px;">
            <a href="https://neurochiro.co/register?role=doctor&tier=starter" class="btn">Claim Your Account</a>
          </div>
        </div>
        <div class="footer">
          &copy; 2026 NeuroChiro Network. All Rights Reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await resend.emails.send({
    from: 'NeuroChiro <support@neurochirodirectory.com>',
    to: [to],
    subject: subject,
    html: html,
  });
  console.log(`✅ Branded Email Sent to ${to}. Response:`, JSON.stringify(response, null, 2));
}

migrate();
