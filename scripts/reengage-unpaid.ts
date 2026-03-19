import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';
import { parse } from 'csv-parse/sync';

// --- CONFIGURATION ---
const MAIN_CSV = path.resolve(process.cwd(), '../Downloads/Chiropractors-Grid view.csv');
const DELETE_LIST_CSV = path.resolve(process.cwd(), '../Downloads/Delete listings - Sheet1.csv');
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.argv.find(a => a.startsWith('--key='))?.split('=')[1] || 're_mock_key';

const resend = new Resend(RESEND_API_KEY);

async function processUnpaid() {
  console.log("🔍 IDENTIFYING UNPAID LISTINGS FOR RE-ENGAGEMENT...");

  // 1. Read the list of names to delete/re-engage
  const deleteListContent = fs.readFileSync(DELETE_LIST_CSV, 'utf-8');
  const deleteNames = deleteListContent.split(/\r?\n/).slice(1).map(name => name.trim().toLowerCase()).filter(name => name.length > 0);

  // 2. Read the main directory
  const mainContent = fs.readFileSync(MAIN_CSV, 'utf-8');
  const allRecords = parse(mainContent, {
    columns: (header: string[]) => header.map(h => h.trim().replace(/^\uFEFF/, '')),
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    quote: '"',
    escape: '"'
  }) as any[];

  const matchedDoctors: any[] = [];
  const missedNames: string[] = [];

  // 3. Match names
  for (const nameToFind of deleteNames) {
    // Try to find by partial match since "Dr." prefix might differ
    const found = allRecords.find(r => {
      const fullName = r['Full Name']?.toLowerCase() || "";
      return fullName.includes(nameToFind) || nameToFind.includes(fullName.replace('dr. ', ''));
    });

    if (found) {
      matchedDoctors.push({
        id: found['id'], // If available, or use unique slug/name
        name: found['Full Name'],
        practice: found['Practice Name'],
        email: found['Contact Email'] || found['Practice Email']
      });
    } else {
      missedNames.push(nameToFind);
    }
  }

  console.log(`✅ Matched ${matchedDoctors.length} doctors for re-engagement.`);
  if (missedNames.length > 0) {
    console.log(`⚠️  Could not find these names in the main CSV: ${missedNames.join(', ')}`);
  }

  // 4. Send "Second Chance" Emails
  console.log("\n✉️  SENDING RE-ENGAGEMENT EMAILS...");
  for (const doc of matchedDoctors) {
    if (doc.email) {
      await sendSecondChanceEmail(doc.email, doc.name);
      // Throttle
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // 5. Output "Removal" List for the database
  console.log("\n🛑 REMOVAL ACTIONS:");
  console.log("To hide these doctors from the directory, you can run this SQL in Supabase:");
  const ids = matchedDoctors.map(d => `'${d.name}'`).join(', ');
  console.log(`UPDATE doctors SET verification_status = 'hidden' WHERE "full_name" IN (${ids});`);
}

async function sendSecondChanceEmail(to: string, name: string) {
  const displayName = name.startsWith("Dr. ") ? name : `Dr. ${name}`;
  const subject = `Finish Your NeuroChiro Verification 🧠`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; background-color: #FCF9F5; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 40px auto; background: white; border-radius: 30px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #E5E7EB; }
        .header { padding: 40px; text-align: center; }
        .content { padding: 40px 50px; color: #0B1118; line-height: 1.6; }
        .btn { display: inline-block; background-color: #D66829; color: white !important; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px; }
        .footer { padding: 30px; text-align: center; font-size: 12px; color: #9CA3AF; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <img src="https://neurochiro.co/logo.png" width="100" alt="NeuroChiro">
        </div>
        <div class="content">
          <h2>Hello ${displayName},</h2>
          <p>We noticed you started your application for the <strong>NeuroChiro Global Directory</strong>, but didn't quite finish the final payment step.</p>
          <p>Because our network is expanding rapidly, we want to make sure you don't lose your spot. We've temporarily paused your listing, but you can reactivate it in 60 seconds.</p>
          
          <p>Ready to join the elite network of nervous-system-first practitioners?</p>
          
          <div style="text-align: center;">
            <a href="https://neurochiro.co/pricing" class="btn">Finish My Activation</a>
          </div>

          <p style="margin-top: 40px;">If you have any questions or need help with your clinical profile, just reply to this email.</p>
          <p>In health,<br/>The NeuroChiro Team</p>
        </div>
        <div class="footer">&copy; 2026 NeuroChiro Network</div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'NeuroChiro <support@neurochirodirectory.com>',
      to: [to],
      subject: subject,
      html: html,
    });
    console.log(`✅ Sent re-engagement email to: ${to}`);
  } catch (err: any) {
    console.error(`❌ Failed to send to ${to}: ${err.message}`);
  }
}

processUnpaid();
