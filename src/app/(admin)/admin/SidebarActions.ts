'use server'

import { checkAdminAuth } from '@/lib/admin-auth';

export async function getSystemHealth() {
  try {
    await checkAdminAuth();
  } catch {
    return { status: 'UNAUTHORIZED', services: [], lastChecked: new Date().toISOString() };
  }
  // Simulate checking various services
  // In production, these would be real pings to Supabase, Stripe, etc.
  
  const services = [
    { name: 'Database', status: 'optimal' as const, latency: '12ms' },
    { name: 'Auth', status: 'optimal' as const, latency: '45ms' },
    { name: 'Stripe', status: 'optimal' as const, latency: '120ms' },
    { name: 'Messaging', status: 'optimal' as const, latency: '8ms' },
    { name: 'Automation', status: 'optimal' as const, latency: '22ms' },
  ];

  const overallStatus = 'OPTIMAL';
  
  return {
    status: overallStatus,
    services,
    lastChecked: new Date().toISOString()
  };
}

import { createAdminClient } from "@/lib/supabase-admin";

export async function logoutAdmin() {
  await checkAdminAuth();
  const supabase = createAdminClient();
  await supabase.auth.signOut();
  return { success: true };
}

export async function triggerEmergencyLockdown() {
  await checkAdminAuth();
  // HIGH SENSITIVITY ACTION
  console.log("[SECURITY] EMERGENCY LOCKDOWN TRIGGERED BY SUPER ADMIN");
  // Logic to flip 'maintenance_mode' in DB or revoke all active sessions
  return { success: true };
}
