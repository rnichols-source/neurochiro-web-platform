"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { PL_SECTIONS } from "./pl-data";
import {
  allowedLineIds,
  buildStatement,
  isMonthKey,
  sanitizeLineValues,
  snapshotFields,
  type Statement,
} from "@/lib/pl/calc";

export type PlSnapshotRecord = {
  month: string;
  profit_margin: number;
  expenses: Record<string, number>;
  collections_cents: number;
  net_income_cents: number | null;
  currency: string | null;
};

type DbError = { message: string; code?: string } | null;

type SnapshotRow = {
  month: string;
  profit_margin: number | string | null;
  expenses: Record<string, number> | null;
  collections_cents: number | string | null;
  net_income_cents: number | string | null;
  currency: string | null;
};

type SnapshotQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      order: (column: string, options: { ascending: boolean }) => {
        limit: (count: number) => Promise<{ data: SnapshotRow[] | null; error: DbError }>;
      };
    };
  };
  upsert: (row: Record<string, unknown>, options: { onConflict: string }) => Promise<{ error: DbError }>;
  delete: () => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: DbError }>;
    };
  };
};

const allowed = allowedLineIds(PL_SECTIONS);

function snapshotsTable(supabase: ReturnType<typeof createServerSupabase>): SnapshotQuery {
  const client = supabase as unknown as { from: (table: string) => SnapshotQuery };
  return client.from("pl_snapshots");
}

function missingColumn(error: DbError): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return error.code === "PGRST204" || (message.includes("column") && (message.includes("schema cache") || message.includes("could not find")));
}

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("does not exist") || lower.includes("schema cache") || lower.includes("could not find")) {
    return "Saved months are not available yet. The numbers you type are still kept as a draft on your account.";
  }
  if (lower.includes("jwt") || lower.includes("permission") || lower.includes("row-level")) {
    return "Please sign in again, then retry.";
  }
  return "That could not be saved. Please try again.";
}

function asRecord(row: SnapshotRow): PlSnapshotRecord {
  const expenses = sanitizeLineValues(row.expenses || {}, allowed);
  const margin = Number(row.profit_margin);
  const cents = Number(row.collections_cents);
  const net = row.net_income_cents == null ? null : Number(row.net_income_cents);
  return {
    month: row.month,
    profit_margin: Number.isFinite(margin) ? margin : 0,
    expenses,
    collections_cents: Number.isFinite(cents) ? Math.round(cents) : 0,
    net_income_cents: net != null && Number.isFinite(net) ? Math.round(net) : null,
    currency: row.currency || null,
  };
}

async function requireUser() {
  const supabase = await Promise.resolve(createServerSupabase());
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function loadPlSnapshots(): Promise<{ snapshots: PlSnapshotRecord[]; error: string | null }> {
  const { supabase, user } = await requireUser();
  if (!user) return { snapshots: [], error: "Please sign in again." };
  const full = await snapshotsTable(supabase)
    .select("month, profit_margin, expenses, collections_cents, net_income_cents, currency")
    .eq("user_id", user.id)
    .order("month", { ascending: false })
    .limit(120);
  const fallback = full.error && missingColumn(full.error)
    ? await snapshotsTable(supabase)
      .select("month, profit_margin, expenses, collections_cents")
      .eq("user_id", user.id)
      .order("month", { ascending: false })
      .limit(120)
    : null;
  const data = fallback ? fallback.data : full.data;
  const error = fallback ? fallback.error : full.error;
  if (error) {
    console.error("[P&L] load failed", error.code || "", error.message);
    return { snapshots: [], error: friendlyError(error.message) };
  }
  const snapshots = (data || [])
    .filter((row) => isMonthKey(row.month))
    .map(asRecord)
    .sort((a, b) => a.month.localeCompare(b.month));
  return { snapshots, error: null };
}

export async function savePlSnapshot(input: {
  month: string;
  values: Record<string, number>;
  currency: string;
}): Promise<{ ok: true; snapshots: PlSnapshotRecord[] } | { ok: false; error: string }> {
  if (!isMonthKey(input.month)) return { ok: false, error: "Choose a real month first." };
  const currency = /^[A-Z]{3}$/.test(input.currency) ? input.currency : "USD";
  const values = sanitizeLineValues(input.values, allowed);
  const statement: Statement = buildStatement(values, PL_SECTIONS);
  if (!statement.hasAnyInput) return { ok: false, error: "Enter at least one number before saving the month." };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const fields = snapshotFields(input.month, statement, currency);
  const row = {
    user_id: user.id,
    month: fields.month,
    collections_cents: fields.collections_cents,
    expenses: fields.expenses,
    profit_margin: fields.profit_margin,
    net_income_cents: fields.net_income_cents,
    currency: fields.currency,
    updated_at: new Date().toISOString(),
  };
  let { error } = await snapshotsTable(supabase).upsert(row, { onConflict: "user_id,month" });
  if (error && missingColumn(error)) {
    const legacy = await snapshotsTable(supabase).upsert({
      user_id: user.id,
      month: fields.month,
      collections_cents: fields.collections_cents,
      expenses: fields.expenses,
      profit_margin: fields.profit_margin,
    }, { onConflict: "user_id,month" });
    error = legacy.error;
  }

  if (error) {
    console.error("[P&L] save failed", error.code || "", error.message);
    return { ok: false, error: friendlyError(error.message) };
  }
  const loaded = await loadPlSnapshots();
  if (loaded.error) return { ok: false, error: loaded.error };
  return { ok: true, snapshots: loaded.snapshots };
}

export async function deletePlSnapshot(month: string): Promise<{ ok: true; snapshots: PlSnapshotRecord[] } | { ok: false; error: string }> {
  if (!isMonthKey(month)) return { ok: false, error: "Choose a real month first." };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { error } = await snapshotsTable(supabase).delete().eq("user_id", user.id).eq("month", month);
  if (error) {
    console.error("[P&L] delete failed", error.code || "", error.message);
    return { ok: false, error: friendlyError(error.message) };
  }
  const loaded = await loadPlSnapshots();
  if (loaded.error) return { ok: false, error: loaded.error };
  return { ok: true, snapshots: loaded.snapshots };
}
