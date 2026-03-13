'use server'

import { Automations } from "@/lib/automations";

export async function triggerTestAutomation(type: string, email: string) {
  console.log(`[DEBUG] Manually triggering ${type} for ${email}`);
  
  switch (type) {
    case 'welcome':
      await Automations.onSignup("test_user_id", email, "NeuroChiro Explorer", "patient");
      break;
    case 'upgrade':
      await Automations.onMembershipUpgrade("test_user_id", email, "Elite Pro");
      break;
    case 'referral':
      await Automations.onReferralSent("ref_id", "Dr. Test", "doc_id", email, "555-0100", "John Doe");
      break;
    case 'admin_alert':
      await Automations.onJobPosted("Diagnostic Wellness Center");
      break;
    default:
      throw new Error("Unknown automation type");
  }

  return { success: true, message: `${type} automation triggered for ${email}` };
}
