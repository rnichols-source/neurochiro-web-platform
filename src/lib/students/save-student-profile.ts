import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { resolveStateCode } from '@/lib/resolve-state';
import {
  knownTechniques,
  parseGraduationYear,
  parseStudentOnboarding,
  type StudentOnboardingInput,
} from '@/lib/students/onboarding-fields';

export type LoadedStudentProfile = {
  fullName: string;
  email: string;
  role: string;
  school: string | null;
  yearInSchool: string | null;
  graduationYear: number | null;
  city: string | null;
  state: string | null;
  techniques: string[];
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function message(error: { message?: string } | null | undefined, fallback: string): string {
  const detail = text(error?.message);
  return detail || fallback;
}

type Row = Record<string, unknown>;
type QueryResult<T> = { data: T; error: { message?: string } | null };
type Chain = {
  eq(column: string, value: string): Chain;
  select(columns: string): Chain & Promise<QueryResult<Row[] | null>>;
  maybeSingle(): Promise<QueryResult<Row | null>>;
};
type Tables = {
  from(name: string): {
    select(columns: string): Chain;
    update(values: Record<string, unknown>): Chain;
    upsert(values: Record<string, unknown>, options: { onConflict: string }): Promise<QueryResult<unknown>>;
  };
};

function tables(): Tables {
  return createAdminClient() as unknown as Tables;
}

export async function loadStudentProfile(userId: string): Promise<{ data: LoadedStudentProfile | null; error: string | null }> {
  const admin = tables();
  const profile = await admin
    .from('profiles')
    .select('role, full_name, email, school_name, chiropractic_school, graduation_year, current_year_in_school, practice_city, practice_state, areas_of_interest')
    .eq('id', userId)
    .maybeSingle();
  if (profile.error) return { data: null, error: message(profile.error, 'Could not load your profile.') };

  const student = await admin
    .from('students')
    .select('school_name, graduation_year')
    .eq('id', userId)
    .maybeSingle();
  if (student.error) return { data: null, error: message(student.error, 'Could not load your school record.') };

  const row = profile.data || {};
  const schoolRow = student.data || {};
  const school = text(row.chiropractic_school) || text(row.school_name) || text(schoolRow.school_name) || null;
  const state = resolveStateCode(text(row.practice_state)) || null;
  return {
    data: {
      fullName: text(row.full_name),
      email: text(row.email),
      role: text(row.role) || 'student',
      school,
      yearInSchool: text(row.current_year_in_school) || null,
      graduationYear: parseGraduationYear(row.graduation_year) ?? parseGraduationYear(schoolRow.graduation_year),
      city: text(row.practice_city) || null,
      state,
      techniques: knownTechniques(row.areas_of_interest),
    },
    error: null,
  };
}

export async function saveStudentProfileFields(
  userId: string,
  input: StudentOnboardingInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = parseStudentOnboarding(input);
  if (!parsed.ok) return parsed;
  const fields = parsed.value;
  const admin = tables();
  const profileUpdate: Record<string, unknown> = {
    school_name: fields.school,
    chiropractic_school: fields.school,
    graduation_year: String(fields.graduationYear),
    current_year_in_school: fields.yearInSchool,
    practice_city: fields.city,
    practice_state: fields.state,
    areas_of_interest: fields.techniques,
    updated_at: new Date().toISOString(),
  };
  if (fields.fullName) profileUpdate.full_name = fields.fullName;

  const profile = await admin.from('profiles').update(profileUpdate).eq('id', userId).select('id');
  if (profile.error) return { ok: false, error: message(profile.error, 'Could not save your profile.') };
  if (!profile.data?.length) return { ok: false, error: 'Your account profile is missing. Sign out and sign in again.' };

  const student = await admin.from('students').upsert({
    id: userId,
    school_name: fields.school,
    graduation_year: fields.graduationYear,
  }, { onConflict: 'id' });
  if (student.error) return { ok: false, error: message(student.error, 'Could not save your school.') };
  return { ok: true };
}
