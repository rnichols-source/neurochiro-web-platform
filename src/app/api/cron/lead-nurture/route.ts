import { wrapEmail } from '@/lib/email-template';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const maxDuration = 300;

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const getResend = () => new Resend(process.env.RESEND_API_KEY || '');

/**
 * LEAD NURTURE AGENT — Runs daily at 9 AM EST (Mon-Fri)
 * Sends timed email sequences to captured leads based on their role and source.
 *
 * Sequence:
 *   Step 1 (Day 1): Welcome + value prop
 *   Step 2 (Day 3): Social proof + success stories
 *   Step 3 (Day 7): Direct CTA to sign up
 *   Step 4 (Day 14): Final nudge
 *
 * After step 4, lead is marked 'closed' if they haven't converted.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const resend = getResend();
    const now = new Date();

    // Get leads that need nurturing:
    // - status = 'new' (never nurtured) OR 'contacted' (in sequence)
    // - have an email
    // - not converted or closed
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .in('status', ['new', 'contacted'])
      .not('email', 'is', null)
      .order('created_at', { ascending: true })
      .limit(30);

    if (!leads || leads.length === 0) {
      return NextResponse.json({ success: true, message: 'No leads to nurture', sent: 0 });
    }

    let sent = 0;
    let skipped = 0;
    let closed = 0;

    for (const lead of leads) {
      const meta = lead.metadata || {};
      const step = meta.nurture_step || 0;
      const lastNurtured = meta.last_nurtured_at ? new Date(meta.last_nurtured_at) : null;
      const created = new Date(lead.created_at);
      const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceLastNurture = lastNurtured
        ? Math.floor((now.getTime() - lastNurtured.getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceCreated;

      // Determine which step to send
      let nextStep = 0;
      if (step === 0 && daysSinceCreated >= 0) nextStep = 1;       // Day 0-1: Welcome
      else if (step === 1 && daysSinceLastNurture >= 2) nextStep = 2; // Day 3: Social proof
      else if (step === 2 && daysSinceLastNurture >= 4) nextStep = 3; // Day 7: CTA
      else if (step === 3 && daysSinceLastNurture >= 7) nextStep = 4; // Day 14: Final
      else { skipped++; continue; } // Not time yet

      // After step 4, close the lead
      if (step >= 4) {
        await supabase.from('leads').update({
          status: 'closed',
          metadata: { ...meta, nurture_step: 4, closed_reason: 'nurture_complete' },
          updated_at: now.toISOString(),
        }).eq('id', lead.id);
        closed++;
        continue;
      }

      const role = lead.role || 'patient';
      const name = lead.first_name || lead.email?.split('@')[0] || 'there';
      const location = lead.location || 'your area';
      const email = getEmailContent(nextStep, role, name, location);

      if (!email) { skipped++; continue; }

      try {
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: lead.email,
          subject: email.subject,
          html: wrapEmail(email.body),
        });
        sent++;

        // Update lead
        const { error: updateError } = await supabase.from('leads').update({
          status: 'contacted',
          metadata: { ...meta, nurture_step: nextStep, last_nurtured_at: now.toISOString() },
          updated_at: now.toISOString(),
        }).eq('id', lead.id);
        if (updateError) console.error(`[LEAD NURTURE] Update failed for ${lead.email}:`, updateError);
      } catch (err) {
        console.error(`[LEAD NURTURE] Email failed for ${lead.email}:`, err);
        skipped++;
      }
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      category: 'AUTOMATION',
      event: `Lead Nurture: ${sent} emails sent, ${skipped} skipped, ${closed} closed`,
      user_name: 'System',
      target: 'leads',
      status: 'Success',
      severity: 'Medium',
      metadata: { sent, skipped, closed },
    });

    return NextResponse.json({ success: true, sent, skipped, closed });
  } catch (err: any) {
    console.error('[LEAD NURTURE ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getEmailContent(step: number, role: string, name: string, location: string): { subject: string; body: string } | null {
  if (role === 'doctor') return getDoctorEmail(step, name);
  if (role === 'student') return getStudentEmail(step, name);
  return getPatientEmail(step, name, location);
}

function getPatientEmail(step: number, name: string, location: string): { subject: string; body: string } | null {
  switch (step) {
    case 1:
      return {
        subject: "Welcome to NeuroChiro",
        body: `
          <p>Hi ${name},</p>
          <p>Thanks for signing up to be notified about nervous system chiropractors in ${location}.</p>
          <p>NeuroChiro is the only directory built specifically for chiropractors who focus on the nervous system — not just cracking backs, but understanding how your brain and body communicate.</p>
          <p>Here's what you can do right now:</p>
          <ul style="color: #1E2D3B; line-height: 2;">
            <li><strong>Browse the directory</strong> — search by city, state, or specialty</li>
            <li><strong>Save doctors</strong> — bookmark ones you're interested in</li>
            <li><strong>Track your health</strong> — free daily check-in for energy, pain, and sleep</li>
          </ul>
          <p style="margin: 24px 0;">
            <a href="https://neurochiro.co/directory" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Find a Doctor Near You</a>
          </p>
          <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `,
      };
    case 2:
      return {
        subject: "Why nervous system chiropractic is different",
        body: `
          <p>Hi ${name},</p>
          <p>Traditional chiropractic focuses on pain. Nervous system chiropractic focuses on <strong>function</strong> — how well your brain communicates with your body.</p>
          <p>Our doctors use advanced scanning technology (like INSiGHT) to measure your nervous system's stress levels, then create personalized care plans based on your unique neurology.</p>
          <p>The result? Patients report improvements in:</p>
          <ul style="color: #1E2D3B; line-height: 2;">
            <li>Sleep quality and energy levels</li>
            <li>Stress resilience and emotional regulation</li>
            <li>Focus, digestion, and immune function</li>
            <li>Pain — but as a side effect of better nervous system health</li>
          </ul>
          <p style="margin: 24px 0;">
            <a href="https://neurochiro.co/learn/what-is-nervous-system-chiropractic" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Learn How It Works</a>
          </p>
          <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `,
      };
    case 3:
      return {
        subject: `Doctors near ${location} are joining NeuroChiro`,
        body: `
          <p>Hi ${name},</p>
          <p>Our network is growing every week. Verified nervous system specialists are joining from across the country — and we're expanding into ${location}.</p>
          <p>Create a free account to:</p>
          <ul style="color: #1E2D3B; line-height: 2;">
            <li>Save your favorite doctors and get notified when they post updates</li>
            <li>Track your daily health with our free check-in tool</li>
            <li>Access personalized exercises for your nervous system</li>
            <li>Message doctors directly through the platform</li>
          </ul>
          <p style="margin: 24px 0;">
            <a href="https://neurochiro.co/register?role=patient" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Create Free Account</a>
          </p>
          <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `,
      };
    case 4:
      return {
        subject: "Last note from us",
        body: `
          <p>Hi ${name},</p>
          <p>Just a final reminder that your free NeuroChiro account is waiting. Whenever you're ready, you can:</p>
          <p style="margin: 20px 0;">
            <a href="https://neurochiro.co/register?role=patient" style="color: #D66829; font-weight: bold;">Create your account here</a>
          </p>
          <p>We won't email you again unless you sign up. Wishing you great health.</p>
          <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `,
      };
    default:
      return null;
  }
}

function getDoctorEmail(step: number, name: string): { subject: string; body: string } | null {
  switch (step) {
    case 1:
      return {
        subject: "Your free NeuroChiro profile",
        body: `
          <p>Hi ${name},</p>
          <p>Thanks for your interest in NeuroChiro — the global directory built specifically for nervous system chiropractors.</p>
          <p>A free listing gets you:</p>
          <ul style="color: #1E2D3B; line-height: 2;">
            <li>Your own profile page visible to patients searching for care</li>
            <li>Verification badge showing you're a legitimate practitioner</li>
            <li>Profile view analytics so you can see who's finding you</li>
          </ul>
          <p>It takes about 2 minutes to set up. No credit card required.</p>
          <p style="margin: 24px 0;">
            <a href="https://neurochiro.co/register?role=doctor" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Get Listed Free</a>
          </p>
          <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `,
      };
    case 2:
      return {
        subject: "How NeuroChiro doctors are growing their practices",
        body: `
          <p>Hi ${name},</p>
          <p>NeuroChiro isn't just a directory. It's a complete practice growth platform:</p>
          <ul style="color: #1E2D3B; line-height: 2;">
            <li><strong>Patient referrals</strong> — doctors refer patients to each other across the network</li>
            <li><strong>Student recruitment</strong> — find associates and interns from our talent pool</li>
            <li><strong>Seminar hosting</strong> — list your CE events and reach chiropractors globally</li>
            <li><strong>Practice tools</strong> — KPI tracker, care plan builder, P&L analyzer</li>
          </ul>
          <p>All starting with a free directory listing.</p>
          <p style="margin: 24px 0;">
            <a href="https://neurochiro.co/why-neurochiro" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">See What's Included</a>
          </p>
          <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `,
      };
    case 3:
      return {
        subject: "Your patients are searching for you",
        body: `
          <p>Hi ${name},</p>
          <p>Every day, patients search NeuroChiro for nervous system chiropractors. If you're not listed, they're finding someone else.</p>
          <p>Getting listed takes 2 minutes:</p>
          <ol style="color: #1E2D3B; line-height: 2;">
            <li>Create your free account</li>
            <li>Add your photo and bio</li>
            <li>Start showing up in patient searches</li>
          </ol>
          <p style="margin: 24px 0;">
            <a href="https://neurochiro.co/register?role=doctor" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Get Listed Now — Free</a>
          </p>
          <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `,
      };
    case 4:
      return {
        subject: "Last note — your free listing",
        body: `
          <p>Hi ${name},</p>
          <p>Last email from me. Your free NeuroChiro listing is ready whenever you are:</p>
          <p style="margin: 20px 0;">
            <a href="https://neurochiro.co/register?role=doctor" style="color: #D66829; font-weight: bold;">Create your profile here</a>
          </p>
          <p>No pressure. We're here when you're ready.</p>
          <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `,
      };
    default:
      return null;
  }
}

function getStudentEmail(step: number, name: string): { subject: string; body: string } | null {
  switch (step) {
    case 1:
      return {
        subject: "Your chiropractic career starts here",
        body: `
          <p>Hi ${name},</p>
          <p>Welcome to NeuroChiro — the platform where chiropractic students build their careers before graduation.</p>
          <p>Here's what you get with a free account:</p>
          <ul style="color: #1E2D3B; line-height: 2;">
            <li><strong>Job board</strong> — associate positions, internships, and contract roles</li>
            <li><strong>Seminar calendar</strong> — find CE events and technique training</li>
            <li><strong>Academy</strong> — free courses on nervous system foundations and neuroplasticity</li>
            <li><strong>Doctor directory</strong> — find mentors and potential employers</li>
          </ul>
          <p style="margin: 24px 0;">
            <a href="https://neurochiro.co/register?role=student" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Create Free Account</a>
          </p>
          <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `,
      };
    case 2:
      return {
        subject: "The tools your school doesn't teach you",
        body: `
          <p>Hi ${name},</p>
          <p>School teaches you how to adjust. NeuroChiro teaches you how to <strong>build a career</strong>.</p>
          <p>Our Student Pro members get access to:</p>
          <ul style="color: #1E2D3B; line-height: 2;">
            <li><strong>Interview Prep</strong> — 20 real interview questions with frameworks and example answers</li>
            <li><strong>Contract Lab</strong> — analyze associate agreements and spot red flags before you sign</li>
            <li><strong>Financial Planner</strong> — model your salary, student loans, and first-year budget</li>
            <li><strong>Technique Explorer</strong> — compare 18 techniques to find your fit</li>
          </ul>
          <p>Start with a free account — upgrade when you're ready.</p>
          <p style="margin: 24px 0;">
            <a href="https://neurochiro.co/careers" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Browse Open Positions</a>
          </p>
          <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `,
      };
    case 3:
      return {
        subject: "Doctors are hiring on NeuroChiro",
        body: `
          <p>Hi ${name},</p>
          <p>Practices across the country are posting associate positions on NeuroChiro. Don't wait until graduation to start looking.</p>
          <p>Create your free student profile so employers can find you:</p>
          <ol style="color: #1E2D3B; line-height: 2;">
            <li>Sign up (free, 2 minutes)</li>
            <li>Add your school, graduation year, and interests</li>
            <li>Browse jobs and message doctors directly</li>
          </ol>
          <p style="margin: 24px 0;">
            <a href="https://neurochiro.co/register?role=student" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Join Free — 2 Minutes</a>
          </p>
          <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `,
      };
    case 4:
      return {
        subject: "Last note — your free student account",
        body: `
          <p>Hi ${name},</p>
          <p>Final reminder. Your free NeuroChiro student account is ready whenever you are:</p>
          <p style="margin: 20px 0;">
            <a href="https://neurochiro.co/register?role=student" style="color: #D66829; font-weight: bold;">Create your account here</a>
          </p>
          <p>We won't email you again. Best of luck with school and your career.</p>
          <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `,
      };
    default:
      return null;
  }
}
