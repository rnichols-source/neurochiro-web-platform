'use server'

import { Automations } from "@/lib/automations";

/**
 * SERVER ACTIONS FOR TRIGGERING AUTOMATIONS
 * All Client Components must use these instead of importing @/lib/automations directly.
 * This prevents Node.js-only libraries (like twilio) from leaking into the client bundle.
 */

export async function onProfileUpdateAction(userId: string, data: any) {
  return Automations.onProfileUpdate(userId, data);
}

export async function onSeminarRegistrationAction(userId: string, email: string, phone: string, seminarName: string) {
  return Automations.onSeminarRegistration(userId, email, phone, seminarName);
}

export async function onJobApplicationAction(applicantId: string, email: string, jobId: string, jobTitle: string, doctorEmail: string) {
  return Automations.onJobApplication(applicantId, email, jobId, jobTitle, doctorEmail);
}

export async function onReferralSentAction(referrerId: string, referrerName: string, doctorId: string, doctorEmail: string, phone: string, patientName: string) {
  return Automations.onReferralSent(referrerId, referrerName, doctorId, doctorEmail, phone, patientName);
}

export async function onVendorSignupAction(vendorName: string) {
  return Automations.onVendorSignup(vendorName);
}

export async function onMastermindApplicationAction(applicantName: string) {
  return Automations.onMastermindApplication(applicantName);
}

export async function retryAutomationAction(queueId: string) {
  // In a real app, you would check if the current user is an admin here
  return Automations.retryAutomation(queueId);
}


export async function onJobPostedAction(clinicName: string) {
  return Automations.onJobPosted(clinicName);
}

export async function onBroadcastDispatchedAction(adminId: string, data: any) {
  return Automations.onBroadcastDispatched(adminId, data);
}

export async function onBroadcastScheduledAction(adminId: string, data: any) {
  return Automations.onBroadcastScheduled(adminId, data);
}

export async function onModerationActionAction(adminId: string, action: string, type: string, target: string) {
  return Automations.onModerationAction(adminId, action, type, target);
}

export async function onSettingsToggleAction(adminId: string, setting: string, value: boolean) {
  return Automations.onSettingsToggle(adminId, setting, value);
}

export async function onSeminarHostedAction(userId: string, data: any) {
  return Automations.onSeminarHosted(userId, data);
}

export async function onSeminarApprovedAction(userId: string, email: string, seminarTitle: string) {
  return Automations.onSeminarApproved(userId, email, seminarTitle);
}

export async function onSeminarRejectedAction(userId: string, email: string, seminarTitle: string, notes: string) {
  return Automations.onSeminarRejected(userId, email, seminarTitle, notes);
}

export async function onCampaignCreatedAction(userId: string, campaignName: string) {
  return Automations.onCampaignCreated(userId, campaignName);
}
