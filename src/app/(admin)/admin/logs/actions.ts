'use server'

import { AuditLog, LogCategory } from "@/types/admin";

// In a real production app, this would query a 'audit_logs' table in Supabase/PostgreSQL.
// For now, we simulate a database with some initial "real" data and a generation logic.

const MOCK_DB_LOGS: AuditLog[] = [
  { id: "1", category: "SECURITY", event: "Admin Login Succeeded", user: "Super_Admin", target: "Auth_Gateway", timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), status: "Success", severity: "Low" },
  { id: "2", category: "AUTOMATION", event: "Broadcast Dispatched", user: "Admin_US", target: "All Students", timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(), status: "Success", severity: "Medium" },
  { id: "3", category: "SYSTEM", event: "API Rate Limit Warning", user: "System", target: "Google_Places_Proxy", timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), status: "Warning", severity: "High" },
  { id: "4", category: "DATA", event: "Doctor Profile Updated", user: "Dr. Chris Brown", target: "Profile_ID_902", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), status: "Success", severity: "Low" },
  { id: "5", category: "SECURITY", event: "Failed Verification Attempt", user: "Guest_User", target: "Verification_Portal", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), status: "Failed", severity: "High" },
  { id: "6", category: "DATA", event: "New Doctor Registered", user: "Dr. Amanda White", target: "Directory", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), status: "Success", severity: "Medium" },
  { id: "7", category: "AUTOMATION", event: "Daily Backup Completed", user: "System", target: "S3_Bucket_Global", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), status: "Success", severity: "Low" },
  { id: "8", category: "SYSTEM", event: "Stripe Webhook Received", user: "Stripe_Internal", target: "Payment_Gateway", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(), status: "Success", severity: "Low" },
  { id: "9", category: "SECURITY", event: "User Role Escalated", user: "Admin_US", target: "User_ID_442", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), status: "Warning", severity: "Critical" },
  { id: "10", category: "AUTOMATION", event: "Email Campaign Started", user: "Marketing_Bot", target: "Active_Leads", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), status: "Success", severity: "Low" },
];

export async function getAuditLogs(options: { 
  category?: string; 
  search?: string;
  limit?: number;
} = {}) {
  const { category, search, limit = 50 } = options;

  let filtered = [...MOCK_DB_LOGS];

  if (category && category !== "All") {
    filtered = filtered.filter(log => log.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(log => 
      log.event.toLowerCase().includes(q) || 
      log.user.toLowerCase().includes(q) || 
      log.target.toLowerCase().includes(q)
    );
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return filtered.slice(0, limit);
}

/**
 * Simulates a real-time event generator for the dashboard
 */
export async function generateLiveEvent(): Promise<AuditLog> {
  const categories: LogCategory[] = ["SECURITY", "AUTOMATION", "SYSTEM", "DATA", "GENERAL"];
  const events = [
    "User Login Succeeded", 
    "Profile Image Uploaded", 
    "Failed API Request", 
    "New Referral Captured", 
    "Subscription Canceled",
    "Admin Configuration Updated"
  ];
  const statuses: any[] = ["Success", "Warning", "Failed", "Info"];
  const users = ["System", "Super_Admin", "Dr. Emily Taylor", "Stripe_Internal", "Guest_User"];

  const category = categories[Math.floor(Math.random() * categories.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    id: Math.random().toString(36).substring(7),
    category,
    event: events[Math.floor(Math.random() * events.length)],
    user: users[Math.floor(Math.random() * users.length)],
    target: "Real-time Node",
    timestamp: new Date().toISOString(),
    status,
    severity: status === "Failed" ? "High" : status === "Warning" ? "Medium" : "Low"
  };
}
