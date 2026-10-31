export type Decision = 'interested' | 'not_now';

export type InterestRow = {
  from: string;
  to: string;
  decision: Decision;
  decidedOn?: string;
};

export type MatchPair = { studentUserId: string; doctorUserId: string };

export function revealedTo(viewerId: string, row: InterestRow): boolean {
  return row.from === viewerId;
}

export function interestsFor(viewerId: string, rows: InterestRow[]): InterestRow[] {
  return rows.filter((row) => revealedTo(viewerId, row));
}

export function mutualReady(rows: InterestRow[], studentId: string, doctorId: string): boolean {
  const student = rows.find((row) => row.from === studentId && row.to === doctorId);
  const doctor = rows.find((row) => row.from === doctorId && row.to === studentId);
  return student?.decision === 'interested' && doctor?.decision === 'interested';
}

export function insertMatchOnce(existing: MatchPair[], row: MatchPair): { rows: MatchPair[]; created: boolean } {
  const hit = existing.some((item) => item.studentUserId === row.studentUserId && item.doctorUserId === row.doctorUserId);
  if (hit) return { rows: existing, created: false };
  return { rows: [...existing, row], created: true };
}

export function allowDecision(countToday: number, alreadyToday: boolean, limit = 50): boolean {
  if (alreadyToday) return true;
  return countToday < limit;
}
