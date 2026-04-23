import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { Resend } from "resend";

// This runs on a cron schedule (daily) via Vercel Cron or manual trigger
// It checks for doctors with incomplete profiles and sends reminder emails
// at Day 3, Day 7, and Day 14 after account creation

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const resend = new Resend(process.env.RESEND_API_KEY || "");

    // Get all doctors with their profile completeness
    const { data: doctors, error } = await supabase
      .from("doctors")
      .select("user_id, first_name, last_name, clinic_name, city, state, bio, photo_url, specialties, website_url, instagram_url, facebook_url")
      .eq("verification_status", "verified");

    if (error || !doctors) {
      return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
    }

    // Get profiles with emails and creation dates
    const userIds = doctors.map((d) => d.user_id).filter((id): id is string => !!id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .in("id", userIds);

    if (!profiles) {
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    const now = new Date();
    let sent = 0;
    let skipped = 0;

    for (const doctor of doctors) {
      const profile = profiles.find((p) => p.id === doctor.user_id);
      if (!profile || !profile.email) {
        skipped++;
        continue;
      }

      // Calculate profile completeness
      const checks = [
        !!doctor.photo_url,
        !!(doctor.bio && doctor.bio.length >= 50),
        !!doctor.clinic_name,
        !!(doctor.specialties && doctor.specialties.length > 0),
        !!(doctor.city && doctor.state),
        !!doctor.website_url,
        !!(doctor.instagram_url || doctor.facebook_url),
      ];
      const completeness = Math.round(
        checks.reduce((sum, done, i) => {
          const weights = [20, 20, 15, 15, 10, 10, 10];
          return sum + (done ? weights[i] : 0);
        }, 0)
      );

      // Skip if profile is complete
      if (completeness >= 100) {
        skipped++;
        continue;
      }

      // Calculate days since account creation
      const createdAt = new Date(profile.created_at);
      const daysSinceCreation = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine which reminder to send (if any)
      // Day 3, Day 7, Day 14 — check if we're within the window (±1 day)
      let reminderType: "day3" | "day7" | "day14" | null = null;
      if (daysSinceCreation >= 3 && daysSinceCreation <= 4) reminderType = "day3";
      else if (daysSinceCreation >= 7 && daysSinceCreation <= 8) reminderType = "day7";
      else if (daysSinceCreation >= 14 && daysSinceCreation <= 15) reminderType = "day14";

      if (!reminderType) {
        skipped++;
        continue;
      }

      // Build the missing items list
      const missing: string[] = [];
      if (!doctor.photo_url) missing.push("Upload a profile photo");
      if (!(doctor.bio && doctor.bio.length >= 50)) missing.push("Write a bio (50+ characters)");
      if (!doctor.clinic_name) missing.push("Add your clinic name");
      if (!(doctor.specialties && doctor.specialties.length > 0)) missing.push("Add at least one specialty");
      if (!(doctor.city && doctor.state)) missing.push("Fill in your city and state");
      if (!doctor.website_url) missing.push("Add your website URL");
      if (!(doctor.instagram_url || doctor.facebook_url)) missing.push("Add a social media link");

      const firstName = doctor.first_name || profile.full_name?.split(" ")[0] || "Doctor";
      const missingHTML = missing.map((m) => `<li style="padding:4px 0;">${m}</li>`).join("");

      // Email content based on reminder type
      const emails = {
        day3: {
          subject: `Your NeuroChiro profile is ${completeness}% complete — let's finish it`,
          headline: "Your profile is live — but not complete",
          body: `Hey Dr. ${firstName},<br><br>You claimed your profile on NeuroChiro a few days ago — awesome! But it's only <strong>${completeness}% complete</strong>, which means patients searching for a nervous system chiropractor in your area might not find you.<br><br>Here's what's still missing:`,
          cta: "Complete My Profile",
          footer: "Doctors with complete profiles get significantly more views and patient inquiries.",
        },
        day7: {
          subject: `Dr. ${firstName}, patients are searching — is your profile ready?`,
          headline: "Patients are searching in your area",
          body: `Hey Dr. ${firstName},<br><br>It's been a week since you joined NeuroChiro. Your profile is sitting at <strong>${completeness}% complete</strong>.<br><br>Right now, patients searching for a chiropractor in your area can find your listing — but without these key details, they're clicking on someone else:`,
          cta: "Finish My Profile Now",
          footer: "A complete profile takes about 5 minutes. That 5 minutes could be the difference between a new patient finding you or your competitor.",
        },
        day14: {
          subject: `Last reminder: Your NeuroChiro profile needs attention`,
          headline: "This is your last reminder",
          body: `Hey Dr. ${firstName},<br><br>Your NeuroChiro profile is still at <strong>${completeness}%</strong>. I know life gets busy, but I don't want you to miss out on what this directory can do for your practice.<br><br>Here's what's still needed:`,
          cta: "Complete My Profile",
          footer: "This is the last automated reminder. If you need help setting up your profile, just reply to this email — I'll personally walk you through it.",
        },
      };

      const email = emails[reminderType];

      try {
        await resend.emails.send({
          from: "NeuroChiro <support@neurochirodirectory.com>",
          to: [profile.email],
          subject: email.subject,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#1a2744;padding:28px;text-align:center;">
                <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro</h1>
                <p style="color:#e97325;font-size:14px;font-weight:bold;margin:8px 0 0;">${email.headline}</p>
              </div>
              <div style="padding:28px;background:white;">
                <p style="font-size:15px;color:#333;line-height:1.6;">${email.body}</p>
                <div style="background:#fff7ed;border-left:4px solid #e97325;border-radius:8px;padding:16px;margin:20px 0;">
                  <p style="margin:0 0 8px;font-weight:bold;color:#1a2744;font-size:14px;">Still needed:</p>
                  <ul style="margin:0;padding:0 0 0 16px;color:#666;font-size:14px;line-height:1.8;">
                    ${missingHTML}
                  </ul>
                </div>
                <div style="background:#f0f0f0;border-radius:10px;padding:16px;margin:20px 0;text-align:center;">
                  <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#1a2744;">${completeness}%</p>
                  <p style="margin:0;font-size:12px;color:#666;">Profile Completeness</p>
                </div>
                <div style="text-align:center;margin:24px 0;">
                  <a href="https://neurochiro.co/doctor/profile" style="display:inline-block;background:#e97325;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">${email.cta}</a>
                </div>
                <p style="color:#999;font-size:13px;font-style:italic;">${email.footer}</p>
              </div>
              <div style="background:#f0f0f0;padding:14px;text-align:center;font-size:12px;color:#999;">
                NeuroChiro Network &middot; neurochiro.co
              </div>
            </div>
          `,
        });
        sent++;
      } catch (emailErr) {
        console.error(`Failed to send reminder to ${profile.email}:`, emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      total: doctors.length,
    });
  } catch (err: any) {
    console.error("Profile reminder cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
