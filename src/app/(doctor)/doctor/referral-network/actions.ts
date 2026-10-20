'use server'

// Referral actions — will be implemented with doctor_referrals table
export async function getReferralNetwork() {
  return { network: [], stats: { totalSent: 0, totalReceived: 0, uniquePartners: 0, topPartner: null, thisMonth: 0 } };
}
