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

export async function saveContractAnalysisAction(title: string, analysisResults: any) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      user_id: user.id,
      title,
      analysis_results: analysisResults,
      status: 'reviewed'
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/student/contract-lab')
  return data
}
