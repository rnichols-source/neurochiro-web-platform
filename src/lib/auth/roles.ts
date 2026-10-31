export const SELF_SERVE_ROLES = ['doctor', 'student', 'patient'] as const;

export type SelfServeRole = (typeof SELF_SERVE_ROLES)[number];

export function assertSelfServeRole(role: unknown): asserts role is SelfServeRole {
  if (typeof role !== 'string' || !(SELF_SERVE_ROLES as readonly string[]).includes(role)) {
    throw new Error('Invalid role');
  }
}
