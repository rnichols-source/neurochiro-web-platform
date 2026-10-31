import 'server-only';
import { Resend } from 'resend';
import { wrapEmail } from '@/lib/email-template';
import { STUDENT_CONFIG } from '@/config/students';
import { escapeHtml } from '@/lib/students/html';

export async function sendStudentWelcome(to: string, name: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || !to.includes('@')) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const monthly = STUDENT_CONFIG.membership.monthly.usd;
  const safeName = escapeHtml(name || 'there');
  await resend.emails.send({
    from: 'NeuroChiro <support@neurochirodirectory.com>',
    to,
    subject: 'You are in. Here is where to start.',
    html: wrapEmail(`
      <h1>Welcome, ${safeName}</h1>
      <p>Your NeuroChiro student membership is active at $${monthly}/month, or the yearly plan if that is what you chose.</p>
      <p>Start with three things:</p>
      <ul>
        <li><a href="https://www.neurochiro.co/student/welcome">Add your school and graduation year</a></li>
        <li><a href="https://www.neurochiro.co/student/roadmap">Open the roadmap</a></li>
        <li><a href="https://www.neurochiro.co/student/mentorship">Check the monthly call</a></li>
      </ul>
      <p>Questions go to support@neurochirodirectory.com.</p>
    `),
  });
}
