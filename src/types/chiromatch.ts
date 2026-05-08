export type CycleStatus = 'upcoming' | 'ranking_open' | 'ranking_closed' | 'matching' | 'matched' | 'completed';
export type MatchStatus = 'matched' | 'unmatched';
export type CompensationType = 'salary' | 'production' | 'hybrid';
export type PositionStatus = 'active' | 'filled' | 'withdrawn';

export interface MatchCycle {
  id: string;
  name: string;
  season: string;
  year: number;
  status: CycleStatus;
  ranking_opens_at: string;
  ranking_closes_at: string;
  match_day: string;
  created_at: string;
}

export interface MatchPosition {
  id: string;
  cycle_id: string;
  doctor_id: string;
  title: string;
  description: string | null;
  compensation_type: CompensationType | null;
  salary_min: number | null;
  salary_max: number | null;
  benefits: string[] | null;
  requirements: string[] | null;
  city: string | null;
  state: string | null;
  practice_type: string | null;
  mentorship_offered: boolean;
  max_matches: number;
  status: PositionStatus;
  created_at: string;
}

export interface MatchPositionWithDoctor extends MatchPosition {
  doctor: {
    clinic_name: string;
    first_name: string;
    last_name: string;
    city: string;
    state: string;
    specialties: string[];
    photo_url: string | null;
  };
}

export interface MatchStudentRanking {
  id: string;
  cycle_id: string;
  student_id: string;
  position_id: string;
  rank: number;
  created_at: string;
}

export interface MatchDoctorRanking {
  id: string;
  cycle_id: string;
  position_id: string;
  student_id: string;
  rank: number;
  notes: string | null;
  created_at: string;
}

export interface MatchResult {
  id: string;
  cycle_id: string;
  position_id: string | null;
  student_id: string;
  status: MatchStatus;
  matched_at: string | null;
  created_at: string;
}
