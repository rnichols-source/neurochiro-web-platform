import { TECHNIQUES } from '../../app/(student)/student/techniques/technique-data.ts';
import { resolveStateCode } from '../resolve-state.ts';

export const YEAR_IN_SCHOOL_OPTIONS = [
  'Tri 1', 'Tri 2', 'Tri 3', 'Tri 4', 'Tri 5',
  'Tri 6', 'Tri 7', 'Tri 8', 'Tri 9', 'Tri 10',
] as const;

export const TECHNIQUE_NAMES = TECHNIQUES.map((technique) => technique.name);

const TECHNIQUE_SET = new Set<string>(TECHNIQUE_NAMES);
const YEAR_SET = new Set<string>(YEAR_IN_SCHOOL_OPTIONS);

const GRAD_MIN = 2020;
const GRAD_MAX = 2040;

export type StudentOnboardingInput = {
  school?: string | null;
  yearInSchool?: string | null;
  graduationYear?: string | number | null;
  city?: string | null;
  state?: string | null;
  techniques?: string[] | null;
  fullName?: string | null;
};

export type StudentProfileFields = {
  school: string;
  yearInSchool: string;
  graduationYear: number;
  city: string;
  state: string;
  techniques: string[];
  fullName: string | null;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function knownTechniques(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const names: string[] = [];
  for (const value of values) {
    const name = text(value);
    if (!TECHNIQUE_SET.has(name) || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}

export function parseGraduationYear(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const year = Math.trunc(value);
    return year >= GRAD_MIN && year <= GRAD_MAX ? year : null;
  }
  if (typeof value !== 'string') return null;
  const raw = text(value);
  if (!/^\d{4}$/.test(raw)) return null;
  const year = Number(raw);
  return year >= GRAD_MIN && year <= GRAD_MAX ? year : null;
}

export function parseStudentOnboarding(input: StudentOnboardingInput): { ok: true; value: StudentProfileFields } | { ok: false; error: string } {
  const school = text(input.school);
  if (school.length < 2 || school.length > 200) {
    return { ok: false, error: 'Enter your chiropractic school.' };
  }
  const yearInSchool = text(input.yearInSchool);
  if (!YEAR_SET.has(yearInSchool)) {
    return { ok: false, error: 'Choose your current trimester.' };
  }
  const graduationYear = parseGraduationYear(input.graduationYear ?? null);
  if (!graduationYear) {
    return { ok: false, error: 'Enter a graduation year between 2020 and 2040.' };
  }
  const city = text(input.city);
  if (city.length < 2 || city.length > 80) {
    return { ok: false, error: 'Enter the city where you are based.' };
  }
  const state = resolveStateCode(text(input.state));
  if (!state) {
    return { ok: false, error: 'Choose a US state.' };
  }
  const techniques = knownTechniques(input.techniques);
  if (techniques.length < 1) {
    return { ok: false, error: 'Choose at least one technique.' };
  }
  if (techniques.length > 12) {
    return { ok: false, error: 'Choose up to 12 techniques.' };
  }
  const fullNameRaw = text(input.fullName);
  if (input.fullName != null && input.fullName !== '' && (fullNameRaw.length < 2 || fullNameRaw.length > 100)) {
    return { ok: false, error: 'Enter your full name.' };
  }
  return {
    ok: true,
    value: {
      school,
      yearInSchool,
      graduationYear,
      city,
      state,
      techniques,
      fullName: fullNameRaw || null,
    },
  };
}

export function studentProfileComplete(input: {
  school?: string | null;
  yearInSchool?: string | null;
  graduationYear?: number | null;
  city?: string | null;
  state?: string | null;
  techniques?: string[] | null;
}): boolean {
  return parseStudentOnboarding({
    school: input.school,
    yearInSchool: input.yearInSchool,
    graduationYear: input.graduationYear,
    city: input.city,
    state: input.state,
    techniques: input.techniques,
  }).ok;
}
