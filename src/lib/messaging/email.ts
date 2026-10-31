export function escapeHtml(value: string): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char
  ));
}

export function messageThreadUrl(role: string | null | undefined, conversationId: string): string {
  const path = role === 'student'
    ? '/student/messages'
    : role === 'admin' || role === 'super_admin' || role === 'founder' || role === 'regional_admin'
      ? '/admin/inbox'
      : '/doctor/messages';
  return `https://neurochiro.co${path}?c=${conversationId}`;
}

export function settingsUrl(role: string | null | undefined): string {
  if (role === 'student') return 'https://neurochiro.co/student/settings';
  return 'https://neurochiro.co/doctor/settings';
}

export function shouldSendUnreadEmail(input: {
  prefsMessages: boolean;
  muted: boolean;
  alreadyLogged: boolean;
  stillUnread: boolean;
  dailyCount: number;
  dailyCap?: number;
}): boolean {
  if (!input.stillUnread) return false;
  if (!input.prefsMessages) return false;
  if (input.muted) return false;
  if (input.alreadyLogged) return false;
  if (input.dailyCount >= (input.dailyCap ?? 10)) return false;
  return true;
}

export function unreadEmailHtml(input: {
  recipientName: string;
  senderName: string;
  preview: string;
  ctaUrl: string;
  settingsUrl: string;
}): string {
  const sender = escapeHtml(input.senderName || 'a member');
  const preview = escapeHtml(input.preview);
  const recipient = escapeHtml(input.recipientName || 'Member');
  const cta = escapeHtml(input.ctaUrl);
  const settings = escapeHtml(input.settingsUrl);
  return [
    `<p>Hi ${recipient}, you have an unread message from <strong>${sender}</strong>.</p>`,
    `<p style="color:#6B7280;font-style:italic;border-left:3px solid #B4501A;padding-left:12px;margin:16px 0;">${preview}</p>`,
    `<p><a href="${cta}">View message</a></p>`,
    `<p>Replies to this email aren't delivered. Use the button above to reply.</p>`,
    `<p>Manage email settings: <a href="${settings}">${settings}</a></p>`,
  ].join('');
}
