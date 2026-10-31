export function classYearOptions(
  now: Date,
  students: { graduation_year?: number | string | null }[],
  timeZone = "America/New_York",
): number[] {
  const year = Number(new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(now));
  const years = new Set<number>();
  for (let offset = 0; offset <= 4; offset += 1) years.add(year + offset);
  for (const student of students) {
    const value = Number(student.graduation_year);
    if (Number.isInteger(value) && value >= 1990 && value <= 2100) years.add(value);
  }
  return [...years].sort((left, right) => left - right);
}
