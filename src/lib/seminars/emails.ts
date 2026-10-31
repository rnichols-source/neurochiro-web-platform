import { wrapEmail } from "@/lib/email-template";
import { SEMINAR_CONFIG } from "@/config/seminars";

const SITE = "https://www.neurochiro.co";

export function seminarsFrom(): string {
  return process.env.RESEND_FROM_SEMINARS || "NeuroChiro Seminars <seminars@neurochiro.co>";
}

export function registrationConfirmed(input: {
  title: string;
  slug: string;
  when: string;
  place: string;
  qrToken?: string | null;
  refundPolicy?: string | null;
}): { subject: string; html: string } {
  const checkin = input.qrToken ? `${SITE}/seminars/${input.slug}/checkin?t=${encodeURIComponent(input.qrToken)}` : `${SITE}/seminars/${input.slug}/checkin`;
  return {
    subject: `You're registered: ${input.title}`,
    html: wrapEmail(`
      <h1>You're registered</h1>
      <p><strong>${input.title}</strong><br>${input.when}<br>${input.place}</p>
      <p><a href="${checkin}">Open your check-in link</a></p>
      <p>Your check-in code: ${input.qrToken || "shown on the link above"}</p>
      <p><a href="${SITE}/seminars/${input.slug}/calendar.ics">Add to calendar</a></p>
      ${input.refundPolicy ? `<h2>Refunds</h2><p>${input.refundPolicy}</p>` : ""}
      <p>Questions? Reply to this email.</p>
    `),
  };
}

export function rsvpConfirmed(input: { title: string; slug: string; when: string; registrationLink?: string | null }): { subject: string; html: string } {
  return {
    subject: `Reminder set: ${input.title}`,
    html: wrapEmail(`
      <h1>We'll remind you</h1>
      <p><strong>${input.title}</strong><br>${input.when}</p>
      <p>This event registers on the host's site.</p>
      ${input.registrationLink ? `<p><a href="${SITE}/go/seminar/${input.slug}">Continue to registration</a></p>` : ""}
      <p>Reminders go out ${SEMINAR_CONFIG.reminderOffsetsHours.map((hours) => hours >= 24 ? `${hours / 24} days` : `${hours} hours`).join(", ")} before the event.</p>
    `),
  };
}

export function reminderEmail(input: { title: string; slug: string; when: string; place: string; hours: number; virtualUrl?: string | null }): { subject: string; html: string } {
  const whenLabel = input.hours >= 24 ? `${input.hours / 24} days` : `${input.hours} hours`;
  return {
    subject: `${input.title} is in ${whenLabel}`,
    html: wrapEmail(`
      <h1>${input.title}</h1>
      <p>Starts in ${whenLabel}.</p>
      <p>${input.when}<br>${input.place}</p>
      ${input.hours <= 2 && input.virtualUrl ? `<p><a href="${input.virtualUrl}">Join the session</a></p>` : ""}
      <p><a href="${SITE}/seminars/${input.slug}">Event page</a></p>
    `),
  };
}

export function postEventEmail(input: { title: string; slug: string }): { subject: string; html: string } {
  return {
    subject: `How was ${input.title}?`,
    html: wrapEmail(`
      <h1>Thanks for attending</h1>
      <p>Tell the next doctor what ${input.title} was like.</p>
      <p><a href="${SITE}/seminars/${input.slug}#reviews">Leave a review</a></p>
      <p><a href="${SITE}/doctor/ce-tracker">CE credits</a></p>
    `),
  };
}

export function submittedForReview(input: { title: string; place: string; when: string }): { subject: string; html: string } {
  return {
    subject: `Seminar submitted: "${input.title}" — under review`,
    html: wrapEmail(`
      <h1>Submitted for review</h1>
      <p>Your seminar is with the NeuroChiro team. It is not live yet.</p>
      <p><strong>${input.title}</strong><br>${input.place}<br>${input.when}</p>
      <p><a href="${SITE}/doctor/seminars">View your seminars</a></p>
    `),
  };
}
