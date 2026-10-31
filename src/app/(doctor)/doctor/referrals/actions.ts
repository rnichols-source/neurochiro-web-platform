'use server';

import {
  acceptReferral,
  attachmentUrl,
  cancelReferral,
  declineReferral,
  doctorIdForUser,
  listShortcuts,
  loadDoctorCard,
  markContacted,
  markScheduled,
  searchForCurrentDoctor,
  submitReferral,
  toggleFavorite,
  uploadReferralFiles,
} from '@/lib/referrals/data';

export async function searchReferralDoctors(input: {
  query: string;
  specialty?: string | null;
  acceptingOnly?: boolean;
  place?: { city: string; state: string; lat: number; lng: number } | null;
}) {
  return searchForCurrentDoctor(input);
}

export async function referralShortcuts() {
  return listShortcuts();
}

export async function referralDoctor(doctorId: string) {
  return loadDoctorCard(doctorId);
}

export async function referralDoctorForUser(userId: string) {
  const id = await doctorIdForUser(userId);
  if (!id) return null;
  return loadDoctorCard(id);
}

export async function sendPatientReferral(input: {
  receivingDoctorId: string;
  patientFirstName: string;
  patientLastInitial: string;
  patientPhone: string;
  patientEmail?: string;
  patientZip?: string;
  reason: string;
  urgency: 'routine' | 'urgent';
  consentConfirmed: boolean;
}) {
  return submitReferral(input);
}

export async function acceptPatientReferral(id: string) {
  return acceptReferral(id);
}

export async function declinePatientReferral(id: string, reason: string) {
  return declineReferral(id, reason);
}

export async function contactedPatientReferral(id: string) {
  return markContacted(id);
}

export async function scheduledPatientReferral(id: string, scheduledFor: string | null, note: string) {
  return markScheduled(id, scheduledFor, note);
}

export async function cancelPatientReferral(id: string) {
  return cancelReferral(id);
}

export async function starReferralDoctor(doctorId: string) {
  return toggleFavorite(doctorId);
}

export async function signedAttachmentUrl(attachmentId: string) {
  return attachmentUrl(attachmentId);
}

export async function addReferralFiles(referralId: string, formData: FormData) {
  const files = formData.getAll('files').filter((item): item is File => item instanceof File && item.size > 0);
  return uploadReferralFiles(referralId, files);
}
