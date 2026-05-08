"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { runGaleShapley } from "@/lib/chiromatch-algorithm";
import { revalidatePath } from "next/cache";

export async function executeMatching(cycleId: string) {
  const sb = createAdminClient() as any;

  // 1. Verify cycle status
  const { data: cycle } = await sb.from("match_cycles").select("status").eq("id", cycleId).single();
  if (!cycle || (cycle.status !== 'ranking_closed' && cycle.status !== 'ranking_open')) {
    return { error: "Cycle must be in ranking_closed status to run matching" };
  }

  // 2. Update status to matching
  await sb.from("match_cycles").update({ status: "matching" }).eq("id", cycleId);

  try {
    // 3. Fetch all student rankings
    const { data: studentRankings } = await sb
      .from("match_student_rankings")
      .select("student_id, position_id, rank")
      .eq("cycle_id", cycleId)
      .order("rank", { ascending: true });

    // 4. Fetch all doctor rankings
    const { data: doctorRankings } = await sb
      .from("match_doctor_rankings")
      .select("position_id, student_id, rank")
      .eq("cycle_id", cycleId)
      .order("rank", { ascending: true });

    // 5. Fetch positions
    const { data: positions } = await sb
      .from("match_positions")
      .select("id, max_matches")
      .eq("cycle_id", cycleId)
      .eq("status", "active");

    if (!positions || positions.length === 0) {
      await sb.from("match_cycles").update({ status: "ranking_closed" }).eq("id", cycleId);
      return { error: "No active positions to match" };
    }

    // 6. Build algorithm input
    // Group student rankings by student
    const studentMap = new Map<string, string[]>();
    for (const r of (studentRankings || [])) {
      if (!studentMap.has(r.student_id)) studentMap.set(r.student_id, []);
      studentMap.get(r.student_id)!.push(r.position_id);
    }

    // Group doctor rankings by position
    const positionRankMap = new Map<string, string[]>();
    for (const r of (doctorRankings || [])) {
      if (!positionRankMap.has(r.position_id)) positionRankMap.set(r.position_id, []);
      positionRankMap.get(r.position_id)!.push(r.student_id);
    }

    // For positions without doctor rankings, use all students who ranked them (in order they ranked)
    for (const pos of positions) {
      if (!positionRankMap.has(pos.id)) {
        const studentsWhoRanked = (studentRankings || [])
          .filter((r: any) => r.position_id === pos.id)
          .map((r: any) => r.student_id);
        if (studentsWhoRanked.length > 0) {
          positionRankMap.set(pos.id, studentsWhoRanked);
        }
      }
    }

    const input = {
      students: Array.from(studentMap.entries()).map(([id, rankings]) => ({ id, rankings })),
      positions: positions.map((p: any) => ({
        id: p.id,
        rankings: positionRankMap.get(p.id) || [],
        capacity: p.max_matches || 1,
      })),
    };

    // 7. Run algorithm
    const result = runGaleShapley(input);

    // 8. Insert results
    const now = new Date().toISOString();
    const resultRows = [
      ...result.matches.map(m => ({
        cycle_id: cycleId,
        position_id: m.position_id,
        student_id: m.student_id,
        status: 'matched' as const,
        matched_at: now,
      })),
      ...result.unmatched_students.map(sid => ({
        cycle_id: cycleId,
        position_id: null,
        student_id: sid,
        status: 'unmatched' as const,
        matched_at: null,
      })),
    ];

    if (resultRows.length > 0) {
      await sb.from("match_results").insert(resultRows);
    }

    // 9. Update matched positions to 'filled'
    for (const m of result.matches) {
      await sb.from("match_positions").update({ status: "filled" }).eq("id", m.position_id);
    }

    // 10. Update cycle status to matched
    await sb.from("match_cycles").update({ status: "matched" }).eq("id", cycleId);

    revalidatePath("/admin/chiromatch");
    return {
      success: true,
      matched: result.matches.length,
      unmatched_students: result.unmatched_students.length,
      unmatched_positions: result.unmatched_positions.length,
    };
  } catch (err) {
    // Revert status on error
    await sb.from("match_cycles").update({ status: "ranking_closed" }).eq("id", cycleId);
    console.error("Matching error:", err);
    return { error: "Matching algorithm failed" };
  }
}
