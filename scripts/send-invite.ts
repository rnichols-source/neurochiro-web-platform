import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

// Get arguments from command line
const args = process.argv.slice(2);
const emailArg = args.find(a => a.startsWith('--email='))?.split('=')[1];
const nameArg = args.find(a => a.startsWith('--name='))?.split('=')[1] || 'Doctor';

if (!emailArg) {
  console.error("❌ ERROR: You must provide an email. Example: --email=doctor@example.com");
  process.exit(1);
}

async function sendInvite() {
  console.log(`🚀 Sending Directory Claim Invite to ${emailArg} (${nameArg})...`);

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
          <div style="text-transform: uppercase; color: #D66829; font-weight: 900; letter-spacing: 3px; font-size: 12px; margin-bottom: 15px;">Early Access Invitation</div>
          <h1>Hi Dr. ${nameArg.split(' ').pop()},</h1>
          <p>We've officially launched the new NeuroChiro platform, and as a valued member of our directory, your clinic listing is already live!</p>
          <p>We are currently testing the new <strong>Profile Claim</strong> system with a select group of chiropractors before we invite the entire network. Since you were part of our original directory, we would love for you to be among the first to try it.</p>
          
          <div style="text-align: center; margin-top: 50px; margin-bottom: 50px;">
            <a href="https://neurochiro.co/register?role=doctor&tier=starter&claim_id=legacy" class="btn">Claim Your Profile</a>
          </div>

          <p>By claiming your profile, you'll be able to manage your clinic's presence, access advanced analytics, and connect with top student talent immediately.</p>
          <p>As we are in the final testing phase, we would greatly appreciate your feedback. If anything feels off, please let us know.</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #F3F4F6;">
            <p style="font-style: italic; font-size: 16px;">"The evolution of the NeuroChiro network is here."</p>
            <p style="font-weight: 900; color: #0B1118;">Onward,<br/>Dr. Raymond Nichols</p>
          </div>
        </div>
        <div class="footer">
          &copy; 2026 NeuroChiro Network. All Rights Reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await resend.emails.send({
      from: 'NeuroChiro <support@neurochirodirectory.com>',
      to: [emailArg as string],
      subject: 'Your NeuroChiro profile is ready to claim 🧠',
      html: html,
    });
    console.log("✅ Invitation sent successfully!", JSON.stringify(response, null, 2));
  } catch (err) {
    console.error("❌ Failed to send invitation:", err);
  }
}

sendInvite();
