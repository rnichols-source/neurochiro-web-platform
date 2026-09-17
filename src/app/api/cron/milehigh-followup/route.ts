import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

// Mile High Swag Bag follow-up campaign
// Email 1: Sent manually on 2026-09-17 (done)
// Email 2: Day 5 (2026-09-22) — social proof / spotlight clips
// Email 3: Day 10 (2026-09-27) — urgency / free month expiring

const CAMPAIGN_START = new Date('2026-09-17T12:00:00Z');

const SKIP_EMAILS = new Set([
  'mshaeffer@alignlife.com',
  'info@blueoakfamilychiro.com',
  'rnichols@alignlife.com',
]);

const CONTACTS = [
  { name: 'Kate', email: 'dr.kate143@gmail.com' },
  { name: 'Marie', email: 'mariehoobler@gmail.com' },
  { name: 'Joseph', email: 'schuesslerj3@gmail.com' },
  { name: 'Brad', email: 'teninochiropractic@gmail.com' },
  { name: 'Jackie', email: 'jackiemd.1993@gmail.com' },
  { name: 'Megan', email: 'drsocham@gmail.com' },
  { name: 'Lindsey', email: 'drlindsey@imperiumhc.com' },
  { name: 'Devin', email: 'devintucker61@gmail.com' },
  { name: 'Alex', email: 'arod.h.09@gmail.com' },
  { name: 'Josh', email: 'josh@arlenabrands.com' },
  { name: 'Danielle', email: 'daniellelmcbroom@yahoo.com' },
  { name: 'Mackayla', email: 'dr.mackayla@solsticechiro.com' },
  { name: 'Maria', email: 'drmaria@kingdomchiro.life' },
  { name: 'Kendall', email: 'rieck95@yahoo.com' },
  { name: 'Rachel', email: 'racheldejong0818@icloud.com' },
  { name: 'Benjamin', email: 'drbencarlisle@gmail.com' },
  { name: 'Ariana', email: 'ari@blueoakfamilychiro.com' },
  { name: 'Jamieson', email: 'jromage.2021@gmail.com' },
  { name: 'Isabel', email: 'isabel.tap143@gmail.com' },
  { name: 'Katie', email: 'klesm937@aol.com' },
  { name: 'Prisma', email: 'lopezprisma21@gmail.com' },
  { name: 'Rebekah', email: 'bekahdrum1216@gmail.com' },
  { name: 'Ryan', email: 'drbetzdc@gmail.com' },
  { name: 'Rebecca', email: 'rebeccatatman@gmail.com' },
  { name: 'Anavah', email: 'drgenie@hotmail.com' },
  { name: 'Tad', email: 'drtad.olc@gmail.com' },
  { name: 'Tara', email: 'drbresket@gmail.com' },
  { name: 'Mandy', email: 'jairelldc@gmail.com' },
  { name: 'Susan', email: 'scomer42@gmail.com' },
  { name: 'Zoe', email: 'aumchiropractic@gmail.com' },
  { name: 'Ashly', email: 'drashly@hfwmail.net' },
  { name: 'Melissa', email: 'mgmatthew3@proton.me' },
  { name: 'Aric', email: 'aricgomez@live.com' },
  { name: 'Anna', email: 'aehdc@hotmail.com' },
  { name: 'Jenna', email: 'jkloordc@gmail.com' },
  { name: 'Tracey', email: 'traceyhochiro@gmail.com' },
  { name: 'Mark', email: 'drmark@denvervitalitycenter.com' },
  { name: 'James', email: 'drjames@kingdomchiro.life' },
  { name: 'Kelli', email: 'drkelli@reclaimchiro.com' },
  { name: 'Kevin', email: 'kevchico34@gmail.com' },
  { name: 'Caitlin', email: 'chirocaitdc@gmail.com' },
  { name: 'Riley', email: 'info@rapidchiropractic.com' },
  { name: 'Ariana', email: 'doctor@key-chiro.com' },
  { name: 'Trent', email: 'drtrent@denverchiropracticllc.com' },
  { name: 'Carole', email: 'drcarole@askahi.ca' },
  { name: 'Courtney', email: 'dr.c@redemptioncs.com' },
  { name: 'Mary', email: 'chiroworksny@gmail.com' },
  { name: 'Nicole', email: 'drleshaw@ascentchirowa.com' },
  { name: 'Bruce', email: 'drbruce@quantum-chiro.com' },
  { name: 'Dillon', email: 'dillonschuh8@gmail.com' },
  { name: 'Lauren', email: 'matriachiropractic@outlook.com' },
  { name: 'Ian', email: 'drbulow@gmail.com' },
  { name: 'Cindy', email: 'cmacfarlane05@gmail.com' },
  { name: 'Rachel', email: 'drrachel@selfunbound.com' },
  { name: 'Haig', email: 'haigjohndc@gmail.com' },
  { name: 'Cheyenne', email: 'cheyfount@gmail.com' },
  { name: 'Jessica', email: 'jessicaellsworth.dc@gmail.com' },
  { name: 'Izabel', email: 'drizzyvm.dc@gmail.com' },
  { name: 'Amanda', email: 'mandy8641@live.com' },
  { name: 'Dayna', email: 'drsocha@alignurspine.com' },
  { name: 'Shaina', email: 'shainabarnholt@gmail.com' },
  { name: 'Chelsea', email: 'dr.chelsea@polandchiropractic.com' },
  { name: 'David', email: 'wellbehavedrage1@gmail.com' },
  { name: 'Benjamin', email: 'bamoien@gmail.com' },
  { name: 'Kevin', email: 'kwalton@waltonchiropractic.com' },
  { name: 'Sara', email: 'smg5235@gmail.com' },
  { name: 'Hailie', email: '19hailiedowling@gmail.com' },
  { name: 'Angela', email: 'drangela@creatingubuntu.com' },
  { name: 'Roxanne', email: 'roxcywag@gmail.com' },
  { name: 'Eric', email: 'eric.david.blank@gmail.com' },
  { name: 'Kimberly', email: 'drkimthor@yahoo.com' },
  { name: 'Rebecca', email: 'rweidner.dc@gmail.com' },
  { name: 'Evan', email: 'schwindte@gmail.com' },
  { name: 'Kirsten', email: 'kirstenc.hughes@gmail.com' },
  { name: 'Justin', email: 'justfountain@gmail.com' },
  { name: 'Bryan', email: 'bryanhawke@yahoo.com' },
  { name: 'Cooper', email: 'csciascia42@gmail.com' },
  { name: 'Taylor', email: 'taylorraeluster@outlook.com' },
  { name: 'Corinne', email: 'drcorinnedg@gmail.com' },
  { name: 'Chad', email: 'chadwilliamqueen@yahoo.com' },
  { name: 'Joshua', email: 'drjhenk@gmail.com' },
  { name: 'Jonathan', email: 'drfollowillj@gmail.com' },
  { name: 'Mandy', email: 'drmarziazdc@gmail.com' },
  { name: 'Donna', email: 'dr@abc2wellness.com' },
  { name: 'Paula', email: 'pauladc1313@aol.com' },
  { name: 'Lori', email: 'dr.boymom@gmail.com' },
  { name: 'Kristi', email: 'kristinuckles@gmail.com' },
  { name: 'Kenzie', email: 'drkhenk@gmail.com' },
  { name: 'Laura', email: 'drlauraduke@hotmail.com' },
  { name: 'Alex', email: 'awolfdc1@gmail.com' },
  { name: 'Codi', email: 'codiosbornedc@gmail.com' },
  { name: 'Charlotte', email: 'charlotte.meier.dc@gmail.com' },
  { name: 'Rylie', email: 'millerrylieg@gmail.com' },
  { name: 'Rick', email: 'drrick@belmarchiro.com' },
  { name: 'Josh', email: 'burckharddc@gmail.com' },
  { name: 'Aryn', email: 'draryn@inspirelifechirocenter.com' },
  { name: 'Edwin', email: 'drtedcroucher@gmail.com' },
  { name: 'Amy', email: 'dramy@selfunbound.com' },
  { name: 'Marc', email: 'docsoop@yahoo.com' },
  { name: 'Michael', email: 'drmike@staywelladjusted.com' },
  { name: 'Scott', email: 'shahn42@hotmail.com' },
  { name: 'Carmen', email: 'cmazzadc@ltfamilychiropractic.com' },
  { name: 'Nikki', email: 'nikkigingrich@gmail.com' },
  { name: 'Darin', email: 'drdarin@thevitalitycenter.com' },
  { name: 'Jill', email: 'drjillalthoff@gmail.com' },
  { name: 'David', email: 'davelamson@gmail.com' },
  { name: 'Yahdi', email: 'dryahdi@spinestudioco.com' },
  { name: 'Dellanira', email: 'delesc78@gmail.com' },
  { name: 'Dan', email: 'drdanlyons33@yahoo.com' },
  { name: 'Haley', email: 'info@blueoakfamilychiro.com' },
  { name: 'Kate', email: 'dr.katehill@gmail.com' },
  { name: 'Cathie', email: 'catherine.hengel@gmail.com' },
  { name: 'Jess', email: 'chiro@drkeppy.com' },
  { name: 'Bobby', email: 'ticb4tor@gmail.com' },
  { name: 'Peter', email: 'peharris1996@gmail.com' },
  { name: 'Lauren', email: 'lauredi791@gmail.com' },
  { name: 'Jacobe', email: 'jacobeholmandc@gmail.com' },
  { name: 'Kyle', email: 'drkmorgandc@gmail.com' },
];

const CALENDLY_URL = 'https://calendly.com/drray-neurochirodirectory/neurochiro-onboarding-call';

function getEmailContent(emailNum: number, name: string) {
  if (emailNum === 2) {
    return {
      subject: `Dr. ${name}, see what NeuroChiro doctors are doing`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a2744;padding:28px;text-align:center;">
          <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro</h1>
          <p style="color:#e97325;font-size:14px;font-weight:bold;margin:8px 0 0;">The Network is Growing</p>
        </div>
        <div style="padding:28px;background:white;">
          <p style="font-size:15px;color:#333;line-height:1.6;">Hey Dr. ${name},</p>
          <p style="font-size:15px;color:#333;line-height:1.6;">I wanted to follow up from Mile High and share what's been happening on NeuroChiro.</p>
          <p style="font-size:15px;color:#333;line-height:1.6;">We just launched the <a href="https://neurochiro.co/spotlight" style="color:#e97325;font-weight:bold;">NeuroChiro Spotlight</a>, a live interview series where we feature doctors on the platform. Patients get to see who you are, why you serve, and what makes your practice different before they ever walk through your door.</p>
          <p style="font-size:15px;color:#333;line-height:1.6;">Here's what doctors are saying:</p>
          <div style="background:#f8f6f2;border-left:4px solid #e97325;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#555;font-size:14px;font-style:italic;line-height:1.6;">"It all comes back to connecting the brain and the body and allowing the body to do what it already knows to do. It's just helping it do it."</p>
            <p style="margin:8px 0 0;color:#1a2744;font-size:13px;font-weight:bold;">— Dr. Brittany Perez, AlignLife Wellington, FL</p>
          </div>
          <div style="background:#f8f6f2;border-left:4px solid #e97325;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#555;font-size:14px;font-style:italic;line-height:1.6;">"Somebody needs to stop this. Our kids are growing up sicker than ever. Somebody needs to get ahead of it rather than behind it."</p>
            <p style="margin:8px 0 0;color:#1a2744;font-size:13px;font-weight:bold;">— Dr. Ryan Maxwell, Silver Lining Chiropractic, IL</p>
          </div>
          <p style="font-size:15px;color:#333;line-height:1.6;">Your free month from the Mile High swag bag is still available. Let's get you set up.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${CALENDLY_URL}" style="display:inline-block;background:#e97325;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">Book Your Onboarding Call</a>
          </div>
          <p style="margin-top:20px;color:#333;"><strong>Dr. Ray</strong><br>Founder, NeuroChiro</p>
        </div>
        <div style="background:#f0f0f0;padding:14px;text-align:center;font-size:12px;color:#999;">
          NeuroChiro Network &middot; neurochiro.co
        </div>
      </div>`,
    };
  }

  // Email 3 — urgency
  return {
    subject: `Last chance — your free month of NeuroChiro expires soon`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1a2744;padding:28px;text-align:center;">
        <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro</h1>
        <p style="color:#e97325;font-size:14px;font-weight:bold;margin:8px 0 0;">Your Free Month Expires Soon</p>
      </div>
      <div style="padding:28px;background:white;">
        <p style="font-size:15px;color:#333;line-height:1.6;">Hey Dr. ${name},</p>
        <p style="font-size:15px;color:#333;line-height:1.6;">This is the last time I'll reach out about this. Your free month of NeuroChiro from the Mile High swag bag is expiring soon, and I don't want you to miss it.</p>
        <p style="font-size:15px;color:#333;line-height:1.6;">Here's the thing. Patients are already searching for nervous system chiropractors in your area on NeuroChiro. If you're not listed, they're finding someone else.</p>
        <p style="font-size:15px;color:#333;line-height:1.6;">All it takes is a quick 15-minute call with me. I'll learn about your practice, get your profile built, and make sure patients in your area can find you.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${CALENDLY_URL}" style="display:inline-block;background:#e97325;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">Book Your Call Before It Expires</a>
        </div>
        <p style="font-size:15px;color:#333;line-height:1.6;">After this, the offer goes back to full price ($99/mo). I'd love to have you in the network.</p>
        <p style="margin-top:20px;color:#333;"><strong>Dr. Ray</strong><br>Founder, NeuroChiro</p>
      </div>
      <div style="background:#f0f0f0;padding:14px;text-align:center;font-size:12px;color:#999;">
        NeuroChiro Network &middot; neurochiro.co
      </div>
    </div>`,
  };
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - CAMPAIGN_START.getTime()) / (1000 * 60 * 60 * 24));

  // Determine which email to send today
  let emailNum = 0;
  if (daysSinceStart >= 5 && daysSinceStart < 6) emailNum = 2;
  else if (daysSinceStart >= 10 && daysSinceStart < 11) emailNum = 3;

  if (emailNum === 0) {
    return NextResponse.json({
      status: 'no_action',
      daysSinceStart,
      message: emailNum === 0 && daysSinceStart >= 11
        ? 'Campaign complete'
        : `Next email on day ${daysSinceStart < 5 ? 5 : 10}`,
    });
  }

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY || '');

  const eligible = CONTACTS.filter(c => !SKIP_EMAILS.has(c.email.toLowerCase()));
  let sent = 0;
  let failed = 0;

  for (const contact of eligible) {
    const { subject, html } = getEmailContent(emailNum, contact.name);
    try {
      await resend.emails.send({
        from: 'Dr. Ray <support@neurochirodirectory.com>',
        to: [contact.email],
        subject,
        html,
      });
      sent++;
    } catch {
      failed++;
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 100));
  }

  return NextResponse.json({
    status: 'sent',
    emailNum,
    sent,
    failed,
    daysSinceStart,
  });
}
