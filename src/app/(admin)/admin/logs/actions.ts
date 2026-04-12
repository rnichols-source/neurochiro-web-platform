'use server'

import { AuditLog, LogCategory } from "@/types/admin";
import { createAdminClient } from "@/lib/supabase-admin";

export async function getAuditLogs(options: { 
  category?: string; 
  search?: string;
  limit?: number;
} = {}) {
  const { category, search, limit = 50 } = options;
  const supabase = createAdminClient();

  try {
    let query = supabase
      .from('audit_logs')
      .select('*');

    if (category && category !== "All") {
      query = query.eq('category', category.toUpperCase());
    }

    if (search) {
      query = query.or(`event.ilike.%${search}%,user_name.ilike.%${search}%,target.ilike.%${search}%`);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((log: any) => ({
      id: log.id,
      category: log.category as LogCategory,
      event: log.event,
      user: log.user_name || "System",
      target: log.target,
      timestamp: log.created_at,
      status: log.status,
      severity: log.severity
    }));
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    return [];
  }
}

export async function logAuditAction(params: {
    category: LogCategory;
    event: string;
    target: string;
    status: string;
    severity: string;
    metadata?: any;
}) {
    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let userName = "System";
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        userName = profile?.full_name || user.email || "Unknown User";
    }

    const { error } = await supabase.from('audit_logs').insert({
        category: params.category,
        event: params.event,
        user_name: userName,
        user_id: user?.id,
        target: params.target,
        status: params.status,
        severity: params.severity,
        metadata: params.metadata || {}
    });

    return { success: !error };
}
