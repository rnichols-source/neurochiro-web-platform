import { outcomeCsv } from '@/lib/match/store';

export async function GET() {
  const csv = await outcomeCsv();
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="chiromatch-outcomes.csv"',
    },
  });
}
