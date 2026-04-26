'use server'

import { createServerSupabase } from "@/lib/supabase-server";
import { Resend } from "resend";
import { Automations } from "@/lib/automations";

export async function notifyNewMessage(recipientId: string, recipientRole: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  await Automations.onMessageSent(
    user.id,
    profile?.full_name || 'A member',
    recipientId,
    recipientRole
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBroadcastAction(formData: FormData) {
  const supabase = createServerSupabase();
  const subject = formData.get("subject") as string;
  const bodyHtml = formData.get("body") as string;
  const segment = formData.get("segment") as string;
  const title = formData.get("title") as string;

  // 1. Get current admin user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // 2. Fetch Users based on segment
  let query = supabase.from("profiles").select(`
    id, 
    email, 
    full_name,
    email_preferences(marketing_opt_in, has_bounced, has_complained)
  `);

  // --- ADVANCED TARGETING LOGIC ---
  if (segment === "admin_test") {
    query = query.eq("id", user.id);
  } else if (segment === "all") {
    // All active users
  } else if (segment === "doctor") {
    query = query.eq("role", "doctor");
  } else if (segment === "verified_doctors") {
    // Target only verified specialists
    query = query.eq("role", "doctor").eq("doctors.verification_status", "verified");
  } else if (segment.startsWith("region:")) {
    const regionCode = segment.split(":")[1];
    query = query.eq("region_code", regionCode);
  } else if (segment === "student") {
    query = query.eq("role", "student");
  } else if (segment === "paid_doctors") {
    query = query.eq("role", "doctor").neq("tier", "free");
  }
  
  const { data: recipients, error: dbError } = await query;

  if (dbError || !recipients || recipients.length === 0) {
    return { error: `No eligible recipients found for segment: ${segment}` };
  }

  const validRecipients = recipients.filter((r: any) => {
    const prefs = r.email_preferences || {};
    if (prefs.marketing_opt_in === false) return false;
    if (prefs.has_bounced === true) return false;
    if (prefs.has_complained === true) return false;
    return true;
  });

  const totalCount = validRecipients.length;
  if (totalCount === 0) {
    return { error: "No eligible recipients found after reputation filters." };
  }

  // 3. Batch Sending Logic (Resend limit: 100 per batch)
  try {
    const CHUNK_SIZE = 100;
    for (let i = 0; i < validRecipients.length; i += CHUNK_SIZE) {
      const chunk = validRecipients.slice(i, i + CHUNK_SIZE);
      const batchEmails = chunk.map((r: any) => ({
        from: "NeuroChiro <support@neurochirodirectory.com>",
        to: r.email,
        subject: subject,
        html: wrapEmail(r.full_name, title, bodyHtml, r.role)
      }));
      
      const { error: resendError } = await resend.batch.send(batchEmails);
      if (resendError) throw resendError;
    }

    // 4. Save Campaign History & Admin Audit Log
    await supabase.from("campaigns").insert({
      subject,
      body_html: bodyHtml,
      segment_targeted: segment,
      status: 'completed',
      sent_by: user.id,
      total_sent: totalCount,
      sent_at: new Date().toISOString()
    });

    await supabase.from("audit_logs").insert({
      category: 'COMMUNICATION',
      event: `Global Broadcast: ${subject}`,
      user_name: user.email || "Admin",
      target: segment,
      status: 'Success',
      severity: 'Medium',
      metadata: { recipients: totalCount, subject }
    });

    return { success: true, count: totalCount };
  } catch (err: any) {
    console.error("[COMMS ERROR]", err);
    return { error: err.message };
  }
}

// Re-using our premium branded wrapper
function wrapEmail(name: string, title: string, body: string, role?: string) {
  const greeting = role === 'doctor' ? `Dr. ${name}` : name;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Lato', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #FCF9F5; }
        .wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 40px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 20px 50px rgba(11, 17, 24, 0.1); border: 1px solid #E5E7EB; }
        .header { background-color: #FFFFFF; padding: 40px; text-align: center; border-bottom: 1px solid #F3F4F6; }
        .content { padding: 60px 50px; color: #0B1118; }
        .btn { display: inline-block; background-color: #D66829; color: #FFFFFF !important; padding: 22px 45px; text-decoration: none; border-radius: 20px; font-weight: 900; font-size: 16px; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 10px 30px rgba(214, 104, 41, 0.3); }
        h1 { font-weight: 900; color: #0B1118; font-size: 32px; line-height: 1.2; margin-bottom: 25px; }
        p { font-size: 18px; line-height: 1.7; color: #4B5563; }
        .footer { text-align: center; padding: 40px; font-size: 12px; color: #9CA3AF; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <img src="https://neurochiro.co/logo.png" alt="NeuroChiro" width="120" style="display: block; margin: 0 auto;">
        </div>
        <div class="content">
          <div style="text-transform: uppercase; color: #D66829; font-weight: 900; letter-spacing: 3px; font-size: 12px; margin-bottom: 15px;">${title}</div>
          <h1>Hello ${greeting},</h1>
          ${body}
        </div>
        <div class="footer">
          &copy; 2026 NeuroChiro Network. All Rights Reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}
