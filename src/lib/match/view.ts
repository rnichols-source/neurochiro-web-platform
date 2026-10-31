import type { MatchAnswers } from '@/config/match-questions';

export type MatchCard = {
  userId: string;
  pct: number;
  reason: string;
  title: string;
  subtitle: string;
  facts: string[];
  profileHref: string | null;
  photoUrl: string | null;
  doctorId: string | null;
};

export type MatchRowView = {
  id: string;
  pct: number;
  reason: string;
  title: string;
  conversationId: string | null;
  bookingUrl: string | null;
  doctorId: string | null;
  otherUserId: string;
  closed: boolean;
};

export type MatchDeskData = {
  ready: boolean;
  notice: string | null;
  empty: string | null;
  side: 'student' | 'doctor';
  complete: boolean;
  visible: boolean;
  openToStudents: boolean;
  schoolVerified: boolean;
  clinicLabel: string | null;
  answers: MatchAnswers;
  candidates: MatchCard[];
  matches: MatchRowView[];
  nextCursor: string | null;
};
