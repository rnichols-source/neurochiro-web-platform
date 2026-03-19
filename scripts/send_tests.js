require('dotenv').config({ path: '../.env' });
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);
const TEST_EMAIL = 'drray@neurochirodirectory.com';

async function sendTests() {
  console.log('🚀 Preparing test emails...');

  // Load Templates
  const activationHtml = fs.readFileSync(path.join(__dirname, '../emails/activation_email.html'), 'utf8');
  const interestHtml = fs.readFileSync(path.join(__dirname, '../emails/interest_email.html'), 'utf8');

  // 1. Send Activation Test (Paying Member)
  const finalActivation = activationHtml
    .replace(/{{first_name}}/g, 'Ray')
    .replace(/{{activation_url}}/g, 'https://neurochiro.co/login');

  console.log('📤 Sending Activation Test...');
  const res1 = await resend.emails.send({
    from: 'NeuroChiro <support@neurochirodirectory.com>',
    to: [TEST_EMAIL],
    subject: '[FINAL TEST] Activate Your NeuroChiro Account',
    html: finalActivation,
  });

  // 2. Send Interest Test (Non-Paying Lead)
  const finalInterest = interestHtml
    .replace(/{{first_name}}/g, 'Ray')
    .replace(/{{application_url}}/g, 'https://neurochiro.co/pricing/doctors');

  console.log('📤 Sending Interest Test...');
  const res2 = await resend.emails.send({
    from: 'NeuroChiro <support@neurochirodirectory.com>',
    to: [TEST_EMAIL],
    subject: '[TEST] The Future of Chiropractic is Here',
    html: finalInterest,
  });

  console.log('\n✅ Test emails dispatched to:', TEST_EMAIL);
  console.log('Check your inbox (and spam folder just in case).');
}

sendTests().catch(err => {
  console.error('❌ Failed to send tests:', err);
});
