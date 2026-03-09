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

  try {
    // In production, this would query Supabase profiles table
    // For now, we simulate with mock data logic
    
    let baseData: any[] = [];
    if (type === 'Students') baseData = MOCK_STUDENTS;
    else if (type === 'Doctors') {
      baseData = MOCK_DOCTORS.map(d => ({
        id: d.id,
        name: `${d.first_name} ${d.last_name}`,
        entity: d.clinic_name,
        context: `${d.city}, ${d.state}`,
        status: d.membership_tier === 'pro' ? 'Paid' : 'Free',
        engagement: 90 + Math.floor(Math.random() * 10),
        matches: 5 + Math.floor(Math.random() * 20),
        joined: "Verified",
        email: d.email || "doctor@example.com",
        role: 'doctor'
      }));
    } else if (type === 'Vendors') baseData = MOCK_VENDORS;

    let filtered = [...baseData];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.entity.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'All Statuses') {
      const s = status.split(' ')[0]; // Handle 'Paid (Premium)' -> 'Paid'
      filtered = filtered.filter(u => u.status === s);
    }

    return {
      users: filtered.slice(from, from + limit),
      total: filtered.length,
      hasMore: from + limit < filtered.length
    };
  } catch (e) {
    console.error("Error fetching talent users:", e);
    return { users: [], total: 0, hasMore: false };
  }
}

export async function getTalentAuditStats() {
  // CEO-level metrics
  return {
    totalStudents: MOCK_STUDENTS.length + 1240, // Simulated scale
    totalDoctors: MOCK_DOCTORS.length,
    totalVendors: MOCK_VENDORS.length + 12,
    paidRatio: 68, // 68% paid
    verificationRate: 92,
    newThisMonth: 142,
    activeMatches: 458
  };
}

export async function dispatchTalentBroadcast(target: string, data: any) {
  // Log the action to audit system
  console.log(`[AUDIT] Broadcast sent to ${target} by Admin. Content:`, data);
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1000));
  return { success: true };
}
