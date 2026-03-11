'use server'

import { createServerSupabase } from '@/lib/supabase-server';

export interface ModerationAlert {
  id: string;
  type: string;
  source: string;
  reason: string;
  date: string;
  status: 'Critical' | 'Warning' | 'Info';
}

export interface PlatformHealthMetrics {
  verifiedDoctors: number;
  unverifiedDoctors: number;
  fraudAttemptRate: string;
  vendorCompliance: string;
  seminarVerificationRate: string;
  activeCases: number;
  avgResolutionTime: string;
}

// Global settings state simulation (In production, stored in a settings table)
let globalSettings = {
  autoApprove: false,
  outboundScan: true,
};

// Simulated mock database for alerts
let currentAlerts: ModerationAlert[] = [
  { id: '1', type: 'Suspicious Activity', source: 'User_456', reason: 'Rapid bulk messaging detected', date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), status: 'Warning' },
  { id: '2', type: 'Domain Conflict', source: 'Clinic_789', reason: 'Website URL mismatch with verified NPI', date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), status: 'Info' }
];

export async function getModerationData() {
  const supabase = createServerSupabase();
  
  try {
    const { count: pendingDoctors } = await supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending');
    const { count: pendingSeminars } = await supabase.from('seminars').select('*', { count: 'exact', head: true }).eq('is_approved', false);
    const { count: pendingVendors } = await supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('is_active', false);
    
    // Fallback counts for UI during early stage
    const pendingDoctorsCount = pendingDoctors || 0;
    const pendingSeminarsCount = pendingSeminars || 0;
    const pendingVendorsCount = pendingVendors || 0;

    const { count: verifiedDoctors } = await supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified');

    const healthMetrics: PlatformHealthMetrics = {
      verifiedDoctors: verifiedDoctors || 0,
      unverifiedDoctors: pendingDoctorsCount,
      fraudAttemptRate: '0.0%',
      vendorCompliance: '100%',
      seminarVerificationRate: '100%',
      activeCases: currentAlerts.length,
      avgResolutionTime: '< 1 hour'
    };

    return {
      success: true,
      data: {
        queues: [
          { id: 'doctors', name: "Doctor Applications", count: pendingDoctorsCount, color: "text-blue-500" },
          { id: 'seminars', name: "Seminar Listings", count: pendingSeminarsCount, color: "text-neuro-orange" },
          { id: 'vendors', name: "Vendor Partners", count: pendingVendorsCount, color: "text-purple-500" }
        ],
        alerts: currentAlerts,
        summary: {
          totalCleared: healthMetrics.verifiedDoctors,
          escalated: 0,
          pendingInvestigations: currentAlerts.length,
          totalFlagged: pendingDoctorsCount + pendingSeminarsCount + pendingVendorsCount
        },
        healthMetrics,
        settings: globalSettings
      }
    };
  } catch (error) {
    console.error("Moderation Data Fetch Error:", error);
    return { success: false, error: "Failed to fetch moderation data." };
  }
}

export async function resolveAlert(alertId: string, action: 'Dismiss' | 'Escalate' | 'Resolve') {
  console.log(`[AUDIT] Alert ${alertId} processed with action: ${action} by Super_Admin`);
  
  if (action === 'Dismiss' || action === 'Resolve') {
    currentAlerts = currentAlerts.filter(a => a.id !== alertId);
  } else if (action === 'Escalate') {
    const alert = currentAlerts.find(a => a.id === alertId);
    if (alert) alert.status = 'Critical';
  }
  
  return { success: true };
}

export async function toggleModerationSetting(setting: 'autoApprove' | 'outboundScan', value: boolean) {
  globalSettings[setting] = value;
  console.log(`[AUDIT] Moderation Setting '${setting}' changed to ${value} by Super_Admin`);
  return { success: true, settings: globalSettings };
}

export async function updateComplianceGuidelines(guidelines: string) {
  console.log(`[AUDIT] Compliance Guidelines updated by Super_Admin`);
  // Simulate delay
  await new Promise(r => setTimeout(r, 1000));
  return { success: true };
}
