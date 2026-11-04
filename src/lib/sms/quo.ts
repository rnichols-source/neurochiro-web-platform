import 'server-only'
import { readSmsConfig } from './config.ts'
import { quoSend as send } from './quo-client.ts'
import type { QuoResult } from './quo-client.ts'

export type { QuoResult }

export async function quoSend(input: { to: string; content: string }): Promise<QuoResult> {
  const config = readSmsConfig()
  return send({
    to: input.to,
    content: input.content,
    apiKey: config.apiKey,
    from: config.from,
    base: config.base,
  })
}
