'use server'

import { createServerSupabase } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { AuditLog } from '@/types/admin';
import { checkAdminAuth } from '@/lib/admin-auth';

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

// Fallback global settings if table doesn't exist yet
const globalSettings = {
  autoApprove: false,
  outboundScan: true,
};

// checkAdminAuth is imported from @/lib/admin-auth

export async function getModerationData() {
  try {
    await checkAdminAuth();
    const supabase = createAdminClient();

    const [pendingDoctors, flaggedProfiles, pendingSeminars] = await Promise.all([
      // Pending doctor applications — rich data for inline approval
      (supabase as any).from('doctors')
        .select('id, first_name, last_name, clinic_name, slug, city, state, email, phone, address, bio, photo_url, hours, booking_url, created_at, verification_status')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: true }),

      // Profiles flagged for review
      (supabase as any).from('doctors')
        .select('id, first_name, last_name, review_notes, created_at')
        .eq('needs_review', true),

      // Seminars pending review
      supabase.from('seminars')
        .select('id, title, city, country, dates, created_at')
        .eq('is_approved', false)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    return {
      success: true,
      data: {
        pendingDoctors: pendingDoctors.data || [],
        flaggedProfiles: flaggedProfiles.data || [],
        pendingSeminars: pendingSeminars.data || [],
      }
    };
  } catch (error: any) {
    console.error("Moderation Data Fetch Error:", error);
    return { success: false, error: error.message || "Failed to fetch live moderation data." };
  }
}

export async function moderateDoctor(doctorId: string, action: 'approve' | 'reject' | 'flag', reason?: string) {
  try {
    const adminUser = await checkAdminAuth();
    const supabase = createAdminClient();

    const statusMap = {
      approve: 'verified',
      reject: 'rejected',
      flag: 'pending' 
    };

    const updateData: any = {
      verification_status: statusMap[action]
    };

    if (action === 'approve') {
      updateData.is_approved = true;

      // Block verification if coordinates are 0,0 or outside plausible bounds
      const { data: coordCheck } = await supabase
        .from('doctors')
        .select('latitude, longitude, country, address, city, state')
        .eq('id', doctorId)
        .single();

      if (coordCheck) {
        const isUS = !coordCheck.country || coordCheck.country === 'United States' || coordCheck.country === 'US';
        const lat = coordCheck.latitude;
        const lng = coordCheck.longitude;
        const hasZeroCoords = (lat === 0 && lng === 0) || lat == null || lng == null;

        if (isUS && hasZeroCoords) {
          // Try to geocode before blocking
          if (coordCheck.address) {
            try {
              const { geocodeDoctorAddress } = await import('@/lib/geocode');
              const result = await geocodeDoctorAddress(coordCheck.address, coordCheck.city || '', coordCheck.state || '');
              if (result) {
                updateData.latitude = result.lat;
                updateData.longitude = result.lng;
              } else {
                return { error: `Cannot verify: geocoding failed for "${coordCheck.address}, ${coordCheck.city}, ${coordCheck.state}". Add a valid street address first.` };
              }
            } catch {
              return { error: 'Cannot verify: geocoding service unavailable. Try again later.' };
            }
          } else {
            return { error: 'Cannot verify: no street address on file. Doctor needs to add their clinic address first.' };
          }
        }
      }
    }

    const { data: doctor, error: fetchError } = await supabase
      .from('doctors')
      .select('email, first_name')
      .eq('id', doctorId)
      .single();

    const { error: updateError } = await supabase
      .from('doctors')
      .update(updateData)
      .eq('id', doctorId);

    if (updateError) throw updateError;

    // Notify the doctor that their profile has been approved
    if (action === 'approve') {
      // Get the doctor's user_id
      const { data: approvedDoctor } = await supabase
        .from('doctors')
        .select('user_id, first_name, last_name')
        .eq('id', doctorId)
        .single();

      if (approvedDoctor?.user_id) {
        await supabase.from('notifications').insert({
          user_id: approvedDoctor.user_id,
          title: 'Account Approved!',
          body: 'Your account has been approved! You now have full access to your dashboard, profile editor, and all tools.',
          type: 'system',
          priority: 'important',
          link: '/doctor/dashboard'
        });

        // Send approval email
        try {
          const { data: profile } = await supabase.from('profiles').select('email').eq('id', approvedDoctor.user_id).single();
          if (profile?.email) {
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY || '');
            const firstName = approvedDoctor.first_name || 'Doctor';
            await resend.emails.send({
              from: 'NeuroChiro <support@neurochirodirectory.com>',
              to: [profile.email],
              subject: `You're approved, Dr. ${firstName}! Your dashboard is ready.`,
              html: `
                <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
                  <div style="background:#1a2744;padding:28px;text-align:center;">
                    <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro</h1>
                    <p style="color:#22c55e;font-size:14px;font-weight:bold;margin:8px 0 0;">Account Approved!</p>
                  </div>
                  <div style="padding:28px;background:white;">
                    <p style="font-size:15px;color:#333;line-height:1.6;">Hey Dr. ${firstName},</p>
                    <p style="font-size:15px;color:#333;line-height:1.6;">Great news — your NeuroChiro account has been approved! You now have full access to your dashboard.</p>
                    <div style="text-align:center;margin:24px 0;">
                      <a href="https://neurochiro.co/doctor/dashboard" style="display:inline-block;background:#e97325;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">Go to Dashboard</a>
                    </div>
                    <p style="color:#999;font-size:13px;">Questions? Just reply to this email.</p>
                    <p style="margin-top:20px;color:#333;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
                  </div>
                </div>
              `,
            });
          }
        } catch (emailErr) {
          console.error('Approval email failed:', emailErr);
        }
      }
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      category: 'MODERATION',
      event: `Doctor ${action.toUpperCase()}: ${doctorId}`,
      user_name: adminUser.email || "Admin",
      target: "Clinical Directory",
      status: 'Success',
      severity: action === 'reject' ? 'High' : 'Medium',
      metadata: { action, doctorId, reason, moderated_at: new Date().toISOString() }
    });

    revalidatePath('/admin/moderation');
    revalidatePath('/directory');
    return { success: true };
  } catch (error: any) {
    console.error("Moderation Action Error:", error);
    return { success: false, error: error.message || "Failed to moderate doctor." };
  }
}

export async function resolveAlert(alertId: string, action: 'Dismiss' | 'Escalate' | 'Resolve') {
  try {
    const user = await checkAdminAuth();
    const supabase = createAdminClient();
    
    await supabase.from('audit_logs').insert({
      category: 'SECURITY',
      event: `Moderator ${action}: Incident ${alertId}`,
      user_name: user?.email || "Admin",
      target: "Moderation System",
      status: 'Success',
      severity: 'Low'
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleModerationSetting(setting: 'autoApprove' | 'outboundScan', value: boolean) {
  try {
    const user = await checkAdminAuth();
    globalSettings[setting] = value;
    
    const supabase = createAdminClient();

    await supabase.from('audit_logs').insert({
      category: 'SYSTEM',
      event: `Changed Moderation Setting '${setting}' to ${value}`,
      user_name: user?.email || "Admin",
      target: "Platform Settings",
      status: 'Success',
      severity: 'Medium'
    });

    return { success: true, settings: globalSettings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateComplianceGuidelines(guidelines: string) {
  try {
    const user = await checkAdminAuth();
    const supabase = createAdminClient();

    await supabase.from('audit_logs').insert({
      category: 'GENERAL',
      event: 'Published new Compliance Guidelines',
      user_name: user?.email || "Admin",
      target: "Policy Gateway",
      status: 'Success',
      severity: 'Medium',
      metadata: { guidelines_preview: guidelines.substring(0, 100) }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
