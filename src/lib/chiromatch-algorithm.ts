/**
 * Gale-Shapley Stable Matching Algorithm (Student-Proposing)
 *
 * Students propose to their top-ranked position.
 * Positions tentatively accept their best candidate per their ranking.
 * Rejected students propose to their next choice.
 * Continues until stable.
 */

export interface MatchInput {
  students: { id: string; rankings: string[] }[]; // position IDs in preference order
  positions: { id: string; rankings: string[]; capacity: number }[]; // student IDs in preference order
}

export interface MatchOutput {
  matches: { student_id: string; position_id: string }[];
  unmatched_students: string[];
  unmatched_positions: string[];
}

export function runGaleShapley(input: MatchInput): MatchOutput {
  const { students, positions } = input;

  // Build position preference maps for O(1) comparison
  const positionPrefs = new Map<string, Map<string, number>>();
  const positionCapacity = new Map<string, number>();
  const positionHolding = new Map<string, string[]>(); // position -> currently held students

  for (const pos of positions) {
    const prefMap = new Map<string, number>();
    pos.rankings.forEach((studentId, idx) => prefMap.set(studentId, idx));
    positionPrefs.set(pos.id, prefMap);
    positionCapacity.set(pos.id, pos.capacity);
    positionHolding.set(pos.id, []);
  }

  // Track each student's current proposal index and status
  const proposalIdx = new Map<string, number>(); // student -> next position to propose to
  const studentMatch = new Map<string, string | null>(); // student -> matched position

  for (const s of students) {
    proposalIdx.set(s.id, 0);
    studentMatch.set(s.id, null);
  }

  // Build student rankings map for quick lookup
  const studentRankingsMap = new Map<string, string[]>();
  for (const s of students) {
    studentRankingsMap.set(s.id, s.rankings);
  }

  // Run the algorithm
  let freeStudents = students.map(s => s.id);

  while (freeStudents.length > 0) {
    const nextFree: string[] = [];

    for (const studentId of freeStudents) {
      const rankings = studentRankingsMap.get(studentId) || [];
      const idx = proposalIdx.get(studentId) || 0;

      if (idx >= rankings.length) {
        // Student has exhausted all preferences — remains unmatched
        continue;
      }

      const positionId = rankings[idx];
      proposalIdx.set(studentId, idx + 1);

      const prefs = positionPrefs.get(positionId);
      if (!prefs) {
        // Position doesn't exist — student tries next
        nextFree.push(studentId);
        continue;
      }

      // Check if student is on position's ranking list
      if (!prefs.has(studentId)) {
        // Position didn't rank this student — reject
        nextFree.push(studentId);
        continue;
      }

      const capacity = positionCapacity.get(positionId) || 1;
      const holding = positionHolding.get(positionId) || [];

      if (holding.length < capacity) {
        // Position has space — accept
        holding.push(studentId);
        positionHolding.set(positionId, holding);
        studentMatch.set(studentId, positionId);
      } else {
        // Position is full — compare with worst currently held
        const studentRank = prefs.get(studentId)!;
        let worstIdx = 0;
        let worstRank = prefs.get(holding[0]) ?? Infinity;

        for (let i = 1; i < holding.length; i++) {
          const r = prefs.get(holding[i]) ?? Infinity;
          if (r > worstRank) {
            worstRank = r;
            worstIdx = i;
          }
        }

        if (studentRank < worstRank) {
          // New student is preferred over worst held — swap
          const rejected = holding[worstIdx];
          holding[worstIdx] = studentId;
          positionHolding.set(positionId, holding);
          studentMatch.set(studentId, positionId);
          studentMatch.set(rejected, null);
          nextFree.push(rejected); // Rejected student tries again
        } else {
          // Current students are all preferred — reject new student
          nextFree.push(studentId);
        }
      }
    }

    freeStudents = nextFree;
  }

  // Build output
  const matches: MatchOutput['matches'] = [];
  const unmatchedStudents: string[] = [];

  for (const s of students) {
    const match = studentMatch.get(s.id);
    if (match) {
      matches.push({ student_id: s.id, position_id: match });
    } else {
      unmatchedStudents.push(s.id);
    }
  }

  const matchedPositionIds = new Set(matches.map(m => m.position_id));
  const unmatchedPositions = positions
    .filter(p => !matchedPositionIds.has(p.id))
    .map(p => p.id);

  return { matches, unmatched_students: unmatchedStudents, unmatched_positions: unmatchedPositions };
}
