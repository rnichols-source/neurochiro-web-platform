"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { checkAdminAuth } from "@/lib/admin-auth";
import type { MatchCycle, CycleStatus } from "@/types/chiromatch";

export async function getMatchCycles(): Promise<MatchCycle[]> {
  await checkAdminAuth();
  const sb = createAdminClient() as any;
  const { data } = await sb
    .from("match_cycles")
    .select("*")
    .order("match_day", { ascending: false });
  return data || [];
}

export async function createMatchCycle(input: {
  name: string;
  season: string;
  year: number;
  ranking_opens_at: string;
  ranking_closes_at: string;
  match_day: string;
}) {
  await checkAdminAuth();
  const sb = createAdminClient() as any;
  const { error } = await sb.from("match_cycles").insert({
    name: input.name,
    season: input.season,
    year: input.year,
    status: "upcoming",
    ranking_opens_at: input.ranking_opens_at,
    ranking_closes_at: input.ranking_closes_at,
    match_day: input.match_day,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/chiromatch");
  return { success: true };
}

export async function updateCycleStatus(cycleId: string, status: CycleStatus) {
  await checkAdminAuth();
  const sb = createAdminClient() as any;
  const { error } = await sb
    .from("match_cycles")
    .update({ status })
    .eq("id", cycleId);
  if (error) return { error: error.message };
  revalidatePath("/admin/chiromatch");
  return { success: true };
}

export async function getCycleStats(cycleId: string) {
  await checkAdminAuth();
  const sb = createAdminClient() as any;
  const [positions, students, matches] = await Promise.all([
    sb.from("match_positions").select("id", { count: "exact", head: true }).eq("cycle_id", cycleId).eq("status", "active"),
    sb.from("match_student_rankings").select("student_id", { count: "exact", head: true }).eq("cycle_id", cycleId),
    sb.from("match_results").select("id", { count: "exact", head: true }).eq("cycle_id", cycleId).eq("status", "matched"),
  ]);
  return {
    positions: positions.count || 0,
    students: students.count || 0,
    matches: matches.count || 0,
  };
}

export async function deleteCycle(cycleId: string) {
  await checkAdminAuth();
  const sb = createAdminClient() as any;
  const { error } = await sb.from("match_cycles").delete().eq("id", cycleId);
  if (error) return { error: error.message };
  revalidatePath("/admin/chiromatch");
  return { success: true };
}
