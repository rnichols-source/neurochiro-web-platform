import { optionKey, TECHNIQUE_OPTIONS } from '@/config/match-questions';
import { QUIZ_QUESTIONS, TECHNIQUES } from '@/app/(student)/student/techniques/technique-data';

export function suggestTechniqueKeys(): string[] {
  if (typeof window === 'undefined') return [];
  const saved = window.localStorage.getItem('neurochiro-technique-quiz');
  if (!saved) return [];
  let quiz: { completed?: boolean; answers?: Record<string, string> };
  try {
    quiz = JSON.parse(saved) as { completed?: boolean; answers?: Record<string, string> };
  } catch {
    return [];
  }
  if (!quiz.completed || !quiz.answers) return [];
  const scores: Record<string, number> = {};
  for (const question of QUIZ_QUESTIONS) {
    const label = quiz.answers[question.id];
    const option = question.options.find((item) => item.label === label);
    if (!option) continue;
    for (const [key, value] of Object.entries(option.points)) scores[key] = (scores[key] || 0) + value;
  }
  const ranked = [...TECHNIQUES].sort((a, b) => (scores[b.category] || 0) - (scores[a.category] || 0));
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const technique of ranked) {
    if (keys.length >= 3) break;
    if (seen.has(technique.category)) continue;
    seen.add(technique.category);
    const key = optionKey(technique.name);
    if (TECHNIQUE_OPTIONS.some((item) => item.key === key)) keys.push(key);
  }
  return keys;
}
