'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getContractsAction() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function analyzeContractAction(contractText: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { error: "AI analysis is not configured. Please contact support." }
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are an expert contract analyst for chiropractic associate employment agreements. Analyze this contract and return a JSON object with this exact structure:

{
  "overallScore": <number 1-100>,
  "overallRecommendation": "<Accept/Negotiate/Walk Away>",
  "summary": "<2-3 sentence summary>",
  "clauses": [
    {
      "name": "<clause name>",
      "risk": "<Low/Medium/High/Critical>",
      "finding": "<what you found>",
      "recommendation": "<specific actionable advice>"
    }
  ]
}

Analyze these specific areas:
1. Compensation structure — base salary, production bonuses, collection percentages. Flag if below market ($60-90k base for new grads).
2. Non-compete clause — radius, duration, enforceability. Flag if radius >15 miles or duration >2 years.
3. Call schedule — after-hours, weekend expectations. Flag if unpaid or excessive.
4. Termination clause — notice period, cause vs. without cause, tail coverage. Flag if <60 days notice or no without-cause termination option.
5. Benefits — health insurance, CE allowance, malpractice coverage. Flag if no malpractice coverage.
6. Production expectations — patient volume, adjustments per day. Flag unrealistic targets.

Contract text:
${contractText.slice(0, 8000)}

Return ONLY the JSON object, no markdown formatting or code blocks.`
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'

    let analysis
    try {
      // Clean potential markdown code blocks
      const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim()
      analysis = JSON.parse(cleaned)
    } catch {
      return { error: "Failed to parse AI analysis. Please try again." }
    }

    // Save to database
    const { data, error } = await supabase
      .from('contracts')
      .insert({
        user_id: user.id,
        title: `Contract Analysis — ${new Date().toLocaleDateString()}`,
        analysis_results: analysis,
        status: 'reviewed'
      })
      .select()
      .single()

    if (error) console.error("Error saving contract:", error)

    revalidatePath('/student/contract-lab')
    return { success: true, analysis }
  } catch (err: any) {
    console.error("Contract analysis error:", err)
    return { error: "Analysis failed. Please try again." }
  }
}
