'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export type UserType = 'Students' | 'Doctors' | 'Vendors';

export async function getTalentUsers(options: {
  type: UserType;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { type, search, status, page = 1, limit = 10 } = options;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const supabase = createServerSupabase();

  try {
    const roleMap: Record<UserType, string> = {
      'Students': 'student',
      'Doctors': 'doctor',
      'Vendors': 'vendor'
    };

    let query = supabase
      .from('profiles')
      .select('*, doctors(clinic_name, city, state, verification_status), students(school, graduation_year)', { count: 'exact' })
      .eq('role', roleMap[type]);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status && status !== 'All Statuses') {
      // Map frontend status to backend status
      if (status.includes('Paid')) {
        query = query.eq('subscription_status', 'active');
      } else if (status.includes('Free')) {
        query = query.eq('subscription_status', 'free');
      } else if (status.includes('Pending')) {
        // For doctors, pending might mean verification_status
        if (type === 'Doctors') {
            // Need to handle filter on joined table or separate query
        }
      }
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const formattedUsers = (data || []).map((u: any) => {
      let entity = "";
      let context = "";
      if (type === 'Students') {
        entity = u.students?.[0]?.school || "N/A";
        context = `Class of ${u.students?.[0]?.graduation_year || "N/A"}`;
      } else if (type === 'Doctors') {
        entity = u.doctors?.[0]?.clinic_name || "N/A";
        context = `${u.doctors?.[0]?.city || ""}, ${u.doctors?.[0]?.state || ""}`;
      } else if (type === 'Vendors') {
        entity = "Vendor Partner";
        context = "Marketplace";
      }

      return {
        id: u.id,
        name: u.full_name,
        email: u.email,
        entity,
        context,
        status: u.subscription_status === 'active' ? 'Paid' : 'Free',
        engagement: 0, // Would need actual analytics table
        matches: 0,
        joined: new Date(u.created_at).toLocaleDateString(),
        role: u.role
      };
    });

    return {
      users: formattedUsers,
      total: count || 0,
      hasMore: (count || 0) > to + 1
    };
  } catch (e) {
    console.error("Error fetching talent users:", e);
    return { users: [], total: 0, hasMore: false };
  }
}

export async function getTalentAuditStats() {
  const supabase = createServerSupabase();
  
  try {
    const { count: students } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
    const { count: doctors } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor');
    const { count: vendors } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'vendor');
    const { count: paid } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active');

    return {
      totalStudents: students || 0,
      totalDoctors: doctors || 0,
      totalVendors: vendors || 0,
      paidRatio: (paid || 0) / ((students || 0) + (doctors || 0) + (vendors || 0) || 1) * 100,
      verificationRate: 0, // Would need to query doctors table specifically
      newThisMonth: 0,
      activeMatches: 0
    };
  } catch (e) {
    return {
        totalStudents: 0,
        totalDoctors: 0,
        totalVendors: 0,
        paidRatio: 0,
        verificationRate: 0,
        newThisMonth: 0,
        activeMatches: 0
    };
  }
}

export async function dispatchTalentBroadcast(target: string, data: any) {
  // Log the action to audit system
  console.log(`[AUDIT] Broadcast sent to ${target} by Admin. Content:`, data);
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1000));
  return { success: true };
}
