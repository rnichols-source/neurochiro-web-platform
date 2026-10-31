'use client';

import { useEffect, useState } from 'react';
import { getStudentOptIn, saveStudentOptIn } from '@/app/(doctor)/doctor/profile/student-actions';

type State = {
  open_to_students?: boolean | null;
  is_mentoring?: boolean | null;
  offers_shadowing?: boolean | null;
  accepts_interns?: boolean | null;
  is_hiring?: boolean | null;
  student_note?: string | null;
};

const FIELDS: { name: keyof State; label: string }[] = [
  { name: 'open_to_students', label: 'Open to students' },
  { name: 'is_mentoring', label: 'Mentoring' },
  { name: 'offers_shadowing', label: 'Shadow days' },
  { name: 'accepts_interns', label: 'Interns' },
  { name: 'is_hiring', label: 'Hiring associates' },
];

export default function StudentOptIn() {
  const [state, setState] = useState<State | null>(null);
  const [missing, setMissing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getStudentOptIn().then((result) => {
      if (!result) return;
      if (result.missing) {
        setMissing(true);
        return;
      }
      setState(result);
    });
  }, []);

  if (missing) return null;
  if (!state) return null;

  return (
    <section className="bg-white border border-portal-border rounded-xl p-4 mb-4">
      <h2 className="text-lg font-bold text-portal-ink">Students</h2>
      <p className="mt-1 text-sm text-portal-ink-2">Students only see this if you turn it on.</p>
      <form className="mt-3 space-y-2" action={async (formData) => {
        const result = await saveStudentOptIn(formData);
        setMessage(result.error || 'Saved.');
      }}>
        {FIELDS.map((field) => (
          <label key={field.name} className="flex items-center gap-3 min-h-11 text-base text-portal-ink">
            <input type="checkbox" name={field.name} value="yes" defaultChecked={Boolean(state[field.name])} className="h-5 w-5" />
            {field.label}
          </label>
        ))}
        <textarea name="student_note" maxLength={280} defaultValue={state.student_note || ''} placeholder="A note students will see. 280 characters." className="min-h-24 w-full rounded-lg border border-portal-border px-3 py-2 text-base" />
        <button type="submit" className="min-h-11 rounded-lg bg-portal-ink px-4 text-sm font-bold text-white">Save student settings</button>
        {message ? <p className="text-sm text-portal-ink-2">{message}</p> : null}
      </form>
    </section>
  );
}
