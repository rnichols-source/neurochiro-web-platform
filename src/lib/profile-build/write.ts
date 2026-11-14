import 'server-only'

import { generateText, Output } from 'ai'
import { z } from 'zod'
import type { VoiceDraft } from './types.ts'
import { buildVoicePrompt, sanitizeDraft, VOICE_INSTRUCTIONS } from './voice.ts'

export const PROFILE_BUILD_MODEL = 'anthropic/claude-haiku-4.5'

const voiceSchema = z.object({
  bio: z.string(),
  shortIntro: z.string(),
  philosophy: z.string(),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).max(5),
})

export async function writeProfileCopy(dossier: string): Promise<VoiceDraft> {
  const result = await generateText({
    model: PROFILE_BUILD_MODEL,
    instructions: VOICE_INSTRUCTIONS,
    prompt: buildVoicePrompt(dossier),
    output: Output.object({ schema: voiceSchema }),
    temperature: 0.2,
    maxOutputTokens: 1200,
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(25_000),
  })
  return sanitizeDraft(result.output)
}
