"use client";

import { useEffect, useState } from "react";
import { getChiroScoreForCandidate } from "./chiroscore-actions";

const GRADE_COLORS: Record<string, string> = {
  A: "bg-green-50 text-green-700 border-green-200",
  B: "bg-blue-50 text-blue-700 border-blue-200",
  C: "bg-yellow-50 text-yellow-700 border-yellow-200",
  D: "bg-orange-50 text-orange-700 border-orange-200",
  F: "bg-red-50 text-red-700 border-red-200",
};

export default function ChiroScoreInline({ candidateId }: { candidateId: string }) {
  const [score, setScore] = useState<{ total: number; grade: string } | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    getChiroScoreForCandidate(candidateId).then((result) => {
      if (result) setScore({ total: result.totalScore, grade: result.grade });
    });
  }, [candidateId]);

  if (!score) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${GRADE_COLORS[score.grade] || GRADE_COLORS.C}`}>
      {score.total} <span className="opacity-60">{score.grade}</span>
    </span>
  );
}
