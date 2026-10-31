import type { StudentMembership } from '@/lib/students/membership-pure';

export type StudentPortalValue = {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  school: string | null;
  graduationYear: number | null;
  membership: StudentMembership;
  unreadMessages: number;
};
