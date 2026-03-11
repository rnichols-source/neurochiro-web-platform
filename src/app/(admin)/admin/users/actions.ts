'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { MOCK_DOCTORS } from '@/lib/mock-data'

export type UserType = 'Students' | 'Doctors' | 'Vendors';

// Mock student data for demonstration when DB is empty
const MOCK_STUDENTS = [
  { id: "s1", name: "Raymond Nichols", entity: "Life University", context: "Class of 2027", status: "Paid", engagement: 98, matches: 12, joined: "Jan 2024", email: "ray@example.com", role: 'student' },
  { id: "s2", name: "Sarah Miller", entity: "Palmer College", context: "Class of 2026", status: "Free", engagement: 85, matches: 8, joined: "Mar 2024", email: "sarah@example.com", role: 'student' },
  { id: "s3", name: "James Wilson", entity: "Logan University", context: "Class of 2025", status: "Paid", engagement: 92, matches: 15, joined: "Feb 2024", email: "james@example.com", role: 'student' },
  { id: "s4", name: "Emma Thompson", entity: "Life West", context: "Class of 2026", status: "Paid", engagement: 78, matches: 5, joined: "Apr 2024", email: "emma@example.com", role: 'student' },
  { id: "s5", name: "Michael Chen", entity: "Parker University", context: "Class of 2027", status: "Pending", engagement: 45, matches: 2, joined: "May 2024", email: "michael@example.com", role: 'student' },
];

const MOCK_VENDORS = [
  { id: "v1", name: "Neurolum", entity: "Neuro-Tech Solutions", context: "Equipment Provider", status: "Paid", engagement: 95, matches: 42, joined: "Dec 2023", email: "contact@neurolum.com", role: 'vendor' },
  { id: "v2", name: "SpineFlow", entity: "SpineFlow Analytics", context: "Software SaaS", status: "Paid", engagement: 88, matches: 28, joined: "Jan 2024", email: "info@spineflow.io", role: 'vendor' },
];

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

    const formattedUsers = (data || []).map(u => {
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
