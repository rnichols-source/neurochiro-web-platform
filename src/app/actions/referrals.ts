'use server'

// Referral actions — stubbed until doctor_referrals table is created

export async function sendReferral(_recipientDoctorId: string, _patientName?: string, _notes?: string) {
  // Coming soon
  return { success: true }
}

export async function getReferralsSent() {
  return []
}

export async function getReferralsReceived() {
  return []
}

export async function acknowledgeReferral(_referralId: string) {
  return { success: true }
}

export async function getReferralAnalytics() {
  return null
}
