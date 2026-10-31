'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { RoadmapStage } from '@/config/student-roadmap';
import { toggleRoadmapStep } from './actions';

export default function RoadmapList({ stages, done }: { stages: RoadmapStage[]; done: string[] }) {
  const [checked, setChecked] = useState<string[]>(done);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('nc_student_roadmap') || '[]';
      const keys = JSON.parse(raw);
      if (!Array.isArray(keys)) return;
      const saved = keys.filter((key) => typeof key === 'string');
      if (saved.length === 0) return;
      setChecked((current) => [...new Set([...current, ...saved])]);
    } catch {
      // Ignore unreadable local progress.
    }
  }, []);

  async function toggle(key: string) {
    const next = checked.includes(key) ? checked.filter((item) => item !== key) : [...checked, key];
    setChecked(next);
    const result = await toggleRoadmapStep(key, next.includes(key));
    if (result.stored === 'local') {
      const raw = window.localStorage.getItem('nc_student_roadmap') || '[]';
      const keys = new Set<string>(JSON.parse(raw));
      if (next.includes(key)) keys.add(key);
      else keys.delete(key);
      window.localStorage.setItem('nc_student_roadmap', JSON.stringify([...keys]));
    }
  }

  return (
    <div className="space-y-6">
      {stages.map((stage) => (
        <section key={stage.key}>
          <h2 className="text-lg font-bold text-portal-ink">{stage.title}</h2>
          <ul className="mt-2 space-y-2">
            {stage.steps.map((step) => (
              <li key={step.key} className="bg-white border border-portal-border rounded-xl p-4">
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 h-5 w-5" checked={checked.includes(step.key)} onChange={() => { void toggle(step.key); }} />
                  <span>
                    <span className="block text-base font-bold text-portal-ink">{step.title}</span>
                    <span className="block text-sm text-portal-ink-2">{step.why}</span>
                    <Link href={step.link} className="inline-flex min-h-11 items-center text-sm font-bold text-portal-accent">Open</Link>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
