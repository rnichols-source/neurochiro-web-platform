import { wrapEmail } from '../email-template.ts';
import { patientLabel } from './pure.ts';

export const REFERRAL_FROM = 'Dr. Ray <support@neurochirodirectory.com>';

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char
  ));
}

function button(href: string, label: string): string {
  return `<p style="margin-top:24px"><a href="${esc(href)}" style="display:inline-block;background:#B4501A;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">${esc(label)}</a></p>`;
}

export function referralLink(id: string): string {
  return `https://neurochiro.co/doctor/referrals/${id}`;
}

export function sentToReceiverEmail(input: {
  id: string;
  referrerName: string;
  patientFirst: string;
  patientInitial: string;
  reason: string;
  urgency: string;
  messageUrl?: string | null;
}): { subject: string; html: string } {
  const who = patientLabel(input.patientFirst, input.patientInitial);
  const subject = `${input.referrerName} sent you a patient`;
  const html = wrapEmail(`
    <h1>${esc(subject)}</h1>
    <p><strong>${esc(who)}</strong></p>
    <p>${esc(input.reason)}</p>
    <p>Urgency: ${esc(input.urgency === 'urgent' ? 'Urgent' : 'Routine')}</p>
    <p>This link opens the referral. It does not accept it for you.</p>
    ${button(referralLink(input.id), 'Accept or decline')}
    ${input.messageUrl ? button(input.messageUrl, `Message ${input.referrerName}`) : ''}
  `);
  return { subject, html };
}

export function acceptedToReferrerEmail(input: {
  receiverName: string;
  patientFirst: string;
  patientInitial: string;
}): { subject: string; html: string } {
  const who = patientLabel(input.patientFirst, input.patientInitial);
  const subject = `${input.receiverName} accepted ${who}`;
  return {
    subject,
    html: wrapEmail(`<h1>${esc(subject)}</h1><p>They have the patient's phone now. You will get another note when a visit is booked.</p>`),
  };
}

export function patientIntroEmail(input: {
  patientFirst: string;
  receiverName: string;
  clinic: string | null;
  phone: string | null;
  address: string | null;
  bookingUrl: string | null;
  profileUrl: string | null;
}): { subject: string; html: string } {
  const subject = `${input.receiverName} can see you`;
  const lines = [
    input.clinic ? `<p>${esc(input.clinic)}</p>` : '',
    input.phone ? `<p>Phone: ${esc(input.phone)}</p>` : '',
    input.address ? `<p>${esc(input.address)}</p>` : '',
    input.bookingUrl ? `<p><a href="${esc(input.bookingUrl)}">Book a visit</a></p>` : '',
    input.profileUrl ? `<p><a href="${esc(input.profileUrl)}">Profile on neurochiro.co</a></p>` : '',
    `<p>You are receiving this because you agreed to share your name and phone with this doctor.</p>`,
  ].join('');
  return {
    subject,
    html: wrapEmail(`<h1>Hello ${esc(input.patientFirst)}</h1><p>${esc(input.receiverName)} accepted a referral for you.</p>${lines}`),
  };
}

export function declinedToReferrerEmail(input: {
  id: string;
  receiverName: string;
  patientFirst: string;
  patientInitial: string;
  reason: string;
}): { subject: string; html: string } {
  const who = patientLabel(input.patientFirst, input.patientInitial);
  const subject = `${input.receiverName} declined ${who}`;
  return {
    subject,
    html: wrapEmail(`
      <h1>${esc(subject)}</h1>
      <p>${esc(input.reason || 'No reason was added.')}</p>
      ${button(`https://neurochiro.co/doctor/referrals?again=1`, 'Refer to someone else')}
    `),
  };
}

export function bookedThankYouEmail(input: {
  receiverName: string;
  patientFirst: string;
  patientInitial: string;
  note: string | null;
}): { subject: string; html: string } {
  const who = patientLabel(input.patientFirst, input.patientInitial);
  const subject = `${who} is booked with ${input.receiverName}`;
  const note = input.note ? `<p>${esc(input.note)}</p>` : '';
  return { subject, html: wrapEmail(`<h1>${esc(subject)}</h1>${note}<p>Thank you for the referral.</p>`) };
}

export function reminderEmail(kind: 'receiver_24h' | 'receiver_48h_after_accept' | 'referrer_7d_expire', input: {
  id: string;
  otherName: string;
  patientFirst: string;
  patientInitial: string;
}): { subject: string; html: string } {
  const who = patientLabel(input.patientFirst, input.patientInitial);
  if (kind === 'receiver_24h') {
    const subject = `Reminder: ${input.otherName} sent you ${who}`;
    return { subject, html: wrapEmail(`<h1>${esc(subject)}</h1><p>This is still waiting on your answer.</p>${button(referralLink(input.id), 'Accept or decline')}`) };
  }
  if (kind === 'receiver_48h_after_accept') {
    const subject = `Have you called ${who}?`;
    return { subject, html: wrapEmail(`<h1>${esc(subject)}</h1><p>You accepted this referral two days ago.</p>${button(referralLink(input.id), 'Update the referral')}`) };
  }
  const subject = `No reply yet on ${who}`;
  return {
    subject,
    html: wrapEmail(`<h1>${esc(subject)}</h1><p>No reply yet. Want to send ${esc(who)} to someone else?</p>${button('https://neurochiro.co/doctor/referrals?again=1', 'Refer to someone else')}`),
  };
}
