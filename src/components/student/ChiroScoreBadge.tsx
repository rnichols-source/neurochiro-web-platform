"use client";

const GRADE_COLORS: Record<string, { text: string; bg: string }> = {
  A: { text: "text-green-700", bg: "bg-green-50 border-green-200" },
  B: { text: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  C: { text: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  D: { text: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  F: { text: "text-red-700", bg: "bg-red-50 border-red-200" },
};

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

export default function ChiroScoreBadge({
  score,
  size = "sm",
}: {
  score: number;
  size?: "sm" | "md";
}) {
  const grade = getGrade(score);
  const colors = GRADE_COLORS[grade];

  if (size === "md") {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colors.bg}`}>
        <span className={`text-sm font-black ${colors.text}`}>{score}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text} opacity-70`}>ChiroScore</span>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${colors.bg} ${colors.text}`}>
      {score} <span className="opacity-60">{grade}</span>
    </span>
  );
}
