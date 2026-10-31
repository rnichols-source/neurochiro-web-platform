export function canStudentMatch(input: {
  memberAccess: boolean;
  schoolVerified: boolean;
  requireSchoolVerification: boolean;
  completed: boolean;
  visible: boolean;
}): boolean {
  if (!input.memberAccess || !input.completed || !input.visible) return false;
  if (input.requireSchoolVerification && !input.schoolVerified) return false;
  return true;
}

export function canDoctorMatch(input: {
  member: boolean;
  openToStudents: boolean;
  completed: boolean;
  visible: boolean;
}): boolean {
  return input.member && input.openToStudents && input.completed && input.visible;
}

export function publicStudentName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Student';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].slice(0, 1).toUpperCase()}.`;
}
