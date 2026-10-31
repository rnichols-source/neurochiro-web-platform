import { createAdminClient } from "@/lib/supabase-admin";

export function missingColumn(message: string): string | null {
  return message.match(/column "([^"]+)"/i)?.[1]
    || message.match(/Could not find the '([^']+)' column/i)?.[1]
    || null;
}

export async function insertFlexible(table: string, row: Record<string, unknown>) {
  const admin = createAdminClient() as unknown as { from: (name: string) => { insert: (value: Record<string, unknown>) => { select: (columns: string) => { single: () => Promise<{ data: { id?: string } | null; error: { message: string; code?: string } | null }> } } } };
  const payload = { ...row };
  let lastError: { message: string; code?: string } | null = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const { data, error } = await admin.from(table).insert(payload).select("id").single();
    if (!error) return { data, error: null };
    lastError = error;
    const column = missingColumn(error.message || "");
    if (column && column in payload) {
      delete payload[column];
      continue;
    }
    return { data: null, error };
  }
  return { data: null, error: lastError };
}
