import type { FaqEntry, VoiceDraft } from './types.ts'

export const VOICE_INSTRUCTIONS = [
  'You write NeuroChiro directory copy from facts already collected from a doctor’s public pages.',
  'Use only facts present in the source. If a fact is missing, return an empty string or an empty list. Do not guess.',
  'Say "community members", never "patients".',
  'Never mention AlignLife.',
  'Never use the phrase "Perfect Storm".',
  'Write in a warm, plain voice. No hype, no slogans, no claims that are not in the source.',
  'bio is third person, under 180 words. shortIntro is one or two sentences under 400 characters. philosophy is under 800 characters.',
  'Return at most 5 FAQ entries, and only when the source actually answers them.',
].join('\n')

export function buildVoicePrompt(dossier: string): string {
  return [
    'Write the directory bio, short intro, philosophy, and up to 5 FAQs.',
    'Rules: say community members, not patients. Never mention AlignLife. Never use the phrase Perfect Storm.',
    'Only use facts found on the pages below. Leave unknown fields blank.',
    '',
    dossier.slice(0, 12000),
  ].join('\n')
}

export function sanitizeVoice(value: string): string {
  const swapped = swapPatients(value)
  const kept = swapped
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence && !/alignlife|perfect storm/i.test(sentence))
  return kept.join(' ').replace(/\s+/g, ' ').trim()
}

export function sanitizeDraft(draft: VoiceDraft): VoiceDraft {
  const faqs = draft.faqs
    .map((item) => ({
      question: sanitizeVoice(item.question).slice(0, 180),
      answer: sanitizeVoice(item.answer).slice(0, 600),
    }))
    .filter((item) => item.question.length >= 8 && item.answer.length >= 8)
    .slice(0, 5)
  return {
    bio: sanitizeVoice(draft.bio).slice(0, 4000),
    shortIntro: sanitizeVoice(draft.shortIntro).slice(0, 500),
    philosophy: sanitizeVoice(draft.philosophy).slice(0, 1000),
    faqs,
  }
}

export function emptyVoice(): VoiceDraft {
  return { bio: '', shortIntro: '', philosophy: '', faqs: [] }
}

function swapPatients(value: string): string {
  return value
    .replace(/\bpatients'\b/gi, 'community members\'')
    .replace(/\bpatients\b/gi, (word) => (word[0] === 'P' ? 'Community members' : 'community members'))
    .replace(/\bpatient's\b/gi, (word) => (word[0] === 'P' ? "Community member's" : "community member's"))
    .replace(/\bpatient\b/gi, (word) => (word[0] === 'P' ? 'Community member' : 'community member'))
}

export function voiceFaqs(extracted: FaqEntry[], written: FaqEntry[]): FaqEntry[] {
  const source = written.length ? written : extracted
  return sanitizeDraft({ bio: '', shortIntro: '', philosophy: '', faqs: source }).faqs
}
