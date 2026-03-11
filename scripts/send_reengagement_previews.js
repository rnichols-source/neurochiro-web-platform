require('dotenv').config({ path: '../.env' });
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);
const TEST_EMAIL = 'drray@neurochirodirectory.com';

async function sendPreviews() {
  console.log('🚀 Preparing Re-engagement Previews...');

  const templatePaths = [
    { file: 'email_1.html', subject: '[PREVIEW 1] Something much bigger than a directory' },
    { file: 'email_2.html', subject: '[PREVIEW 2] Your practice command center is ready' },
    { file: 'email_3.html', subject: '[PREVIEW 3] My personal invitation to you' }
  ];

  for (const t of templatePaths) {
    console.log(`📤 Sending ${t.file}...`);
    const html = fs.readFileSync(path.join(__dirname, `../emails/reengagement/${t.file}`), 'utf8');
    const finalHtml = html.replace(/{{first_name}}/g, 'Ray');

    await resend.emails.send({
      from: 'NeuroChiro <support@neurochirodirectory.com>',
      to: [TEST_EMAIL],
      subject: t.subject,
      html: finalHtml,
    });
  }

  console.log('\n✅ All 3 previews dispatched to:', TEST_EMAIL);
}

sendPreviews().catch(err => console.error('❌ Failed:', err));
