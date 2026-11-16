import type { StudentMembership } from '@/lib/students/membership-pure';

export type StudentPortalValue = {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  school: string | null;
  yearInSchool: string | null;
  graduationYear: number | null;
  city: string | null;
  state: string | null;
  techniques: string[];
  membership: StudentMembership;
  unreadMessages: number;
};
