export type UserRole =
  | 'public'
  | 'patient'
  | 'student_free'
  | 'student_paid'
  | 'doctor'
  | 'admin'
  | 'super_admin'
  | 'founder'
  | 'regional_admin'
  | 'mastermind_member';

// Membership tiers for doctors (from doctors.membership_tier column)
export type DoctorTier = 'starter' | 'growth' | 'pro';

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/admin': ['admin', 'regional_admin', 'founder', 'super_admin'],
  '/doctor': ['doctor', 'admin', 'founder', 'super_admin'],
  '/student': ['student_paid', 'student_free', 'admin', 'founder', 'super_admin'],
  '/portal': ['patient', 'admin', 'founder', 'super_admin'],
  '/mastermind': ['mastermind_member', 'admin', 'founder', 'super_admin'],
};

export const FEATURE_ACCESS: Record<UserRole, string[]> = {
  'public': ['directory:search', 'seminars:view'],
  'patient': ['directory:search', 'seminars:view', 'portal:access'],
  'student_free': ['directory:search', 'seminars:view', 'student:dashboard'],
  'student_paid': ['directory:search', 'seminars:view', 'student:dashboard', 'jobs:apply', 'mentorship:access'],
  'doctor': ['directory:search', 'seminars:view', 'doctor:dashboard', 'network:access', 'jobs:post', 'seminars:host'],
  'admin': ['*'],
  'super_admin': ['*'],
  'founder': ['*'],
  'regional_admin': ['admin:dashboard', 'admin:users', 'admin:approvals'],
  'mastermind_member': ['mastermind:dashboard'],
};
