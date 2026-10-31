'use client';

import { createContext, useContext } from 'react';
import type { StudentPortalValue } from '@/lib/students/portal-value';

const StudentPortalContext = createContext<StudentPortalValue | null>(null);

export function StudentPortalProvider({ value, children }: { value: StudentPortalValue; children: React.ReactNode }) {
  return <StudentPortalContext.Provider value={value}>{children}</StudentPortalContext.Provider>;
}

export function useStudentPortal(): StudentPortalValue {
  const value = useContext(StudentPortalContext);
  if (!value) throw new Error('Student portal is missing');
  return value;
}
