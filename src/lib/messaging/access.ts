export const BLOCKED_MESSAGE = "This person isn't available for messages.";

export type AccessParty = {
  id: string;
  role: string | null;
  verified: boolean;
  membershipActive: boolean;
  acceptsStudentMessages: boolean;
};

export type AccessContext = {
  blocked: boolean;
  existingThread: boolean;
};

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; code: string; userMessage: string };

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'founder', 'regional_admin']);

function deny(code: string, userMessage: string): AccessDecision {
  return { allowed: false, code, userMessage };
}

/**
 * Pure rules for one send. Membership is skipped on an existing thread so a
 * lapsed member can still reply. Verification is still required for doctor-to-doctor.
 */
export function decideAccess(sender: AccessParty, recipient: AccessParty, ctx: AccessContext): AccessDecision {
  if (ctx.blocked) return deny('blocked', BLOCKED_MESSAGE);
  if (sender.id === recipient.id) return deny('self', 'Cannot message yourself.');
  if (ADMIN_ROLES.has(sender.role || '')) return { allowed: true };
  if (sender.role === 'patient') return deny('patient_sender', 'Patient accounts cannot send messages.');
  if (recipient.role === 'patient') return deny('patient_recipient', 'Cannot message patient accounts.');

  if (sender.role === 'doctor' && recipient.role === 'doctor') {
    if (!sender.verified || !recipient.verified) {
      return deny('unverified', BLOCKED_MESSAGE);
    }
    if (!ctx.existingThread && !sender.membershipActive) {
      return deny('membership', 'Active membership required to start new conversations.');
    }
    return { allowed: true };
  }

  if (sender.role === 'doctor' && recipient.role === 'student') return { allowed: true };
  if (sender.role === 'student' && recipient.role === 'student') return { allowed: true };
  if (sender.role === 'student' && recipient.role === 'doctor') {
    if (!recipient.acceptsStudentMessages) {
      return deny('student_closed', 'This doctor is not accepting student messages.');
    }
    return { allowed: true };
  }

  return deny('not_allowed', 'Not allowed.');
}

export function assertCanMessage(sender: AccessParty, recipient: AccessParty, ctx: AccessContext): AccessDecision {
  return decideAccess(sender, recipient, ctx);
}
