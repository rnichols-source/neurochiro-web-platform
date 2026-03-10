export type UserRole = 
  | 'public'
  | 'patient'
  | 'student_free'
  | 'student_paid'
  | 'doctor_non_member'
  | 'doctor_member'
  | 'admin'
  | 'super_admin'
  | 'founder'
  | 'regional_admin'
  | 'mastermind_member';

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/admin': ['admin', 'regional_admin'],
  '/doctor': ['doctor_member', 'doctor_non_member', 'admin'],
  '/student': ['student_paid', 'student_free', 'admin'],
  '/portal': ['patient', 'admin'],
  '/mastermind': ['mastermind_member', 'admin'],
};

// Sub-permissions/feature access (for client-side UI checks)
export const FEATURE_ACCESS: Record<UserRole, string[]> = {
  'public': ['directory:search', 'seminars:view'],
  'patient': ['directory:search', 'seminars:view', 'portal:access'],
  'student_free': ['directory:search', 'seminars:view', 'student:dashboard'],
  'student_paid': ['directory:search', 'seminars:view', 'student:dashboard', 'jobs:apply', 'mentorship:access'],
  'doctor_non_member': ['directory:search', 'seminars:view', 'doctor:dashboard'],
  'doctor_member': ['directory:search', 'seminars:view', 'doctor:dashboard', 'network:access', 'jobs:post', 'seminars:host'],
  'admin': ['*'],
  'regional_admin': ['admin:dashboard', 'admin:users', 'admin:approvals'],
  'mastermind_member': ['mastermind:dashboard'],
};
