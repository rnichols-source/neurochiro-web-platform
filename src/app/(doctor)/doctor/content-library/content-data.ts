export interface ContentItem {
  id: string;
  title: string;
  category: 'handout' | 'template' | 'social' | 'sequence';
  tags: string[];
  description: string;
  content: string;
  createdAt: string;
}

export const CONTENT_LIBRARY: ContentItem[] = [
  // ============================================================
  // PATIENT HANDOUTS (8 pieces)
  // ============================================================
  {
    id: 'handout-subluxation',
    title: 'What is a Subluxation?',
    category: 'handout',
    tags: ['subluxation', 'education', 'new patient', 'printable'],
    description: 'A simple one-pager explaining subluxation in everyday language. Perfect for new patients or anyone who asks "what exactly are you fixing?"',
    content: `# What is a Subluxation?

## Your Spine Protects Something Important

Your spine does two big jobs. It holds you up, and it protects your spinal cord. Your spinal cord is the main highway between your brain and your body. Every message your brain sends — to your heart, your stomach, your muscles, your immune system — travels through your spine.

## So What is a Subluxation?

A subluxation is when one of the bones in your spine shifts out of its normal position, even slightly. When that happens, it can put pressure on the nerves nearby. Think of it like a kink in a garden hose. The water still flows, but not as well as it should.

When your nerves have interference like this, the messages between your brain and body get distorted. Your body can't work at 100%.

## What Causes Subluxations?

Three main things:

- **Physical stress** — Falls, accidents, poor posture, sitting too long, repetitive motions
- **Chemical stress** — Poor diet, medications, toxins in your environment
- **Emotional stress** — Work pressure, anxiety, lack of sleep, major life changes

Most people have subluxations they don't even know about. You can have nerve interference long before you feel pain.

## How Do We Find Them?

We use advanced scanning technology to see exactly how your nervous system is performing. These scans show us where the interference is, how severe it is, and how it's affecting your body. No guesswork.

## How Do We Fix Them?

That's what your adjustments do. Each adjustment is specific and gentle. We're not just "cracking your back." We're restoring the connection between your brain and your body so you can heal and function the way you were designed to.

## The Big Idea

Your body is smart. It knows how to heal a cut, fight a cold, and keep your heart beating without you thinking about it. A subluxation gets in the way of that intelligence. We remove the interference. Your body does the rest.

*If you have questions, ask us! We love helping you understand how your body works.*`,
    createdAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'handout-consistency',
    title: 'Why Consistency Matters',
    category: 'handout',
    tags: ['consistency', 'care plan', 'compliance', 'printable'],
    description: 'Explains why sticking to their care plan schedule matters, using the gym analogy. Great for patients who start to skip visits.',
    content: `# Why Consistency Matters

## Healing Takes Time (and Repetition)

When you started care, your scans showed us exactly where your nervous system was under stress. Your care plan was designed based on those results — not a guess. Every visit builds on the one before it.

## Think About It Like This

Imagine you joined a gym and went hard for one week. Would you expect to be in great shape? Of course not. Your body needs consistent effort over time to change.

Chiropractic works the same way. Each adjustment helps your spine and nervous system learn a new, healthier pattern. But your body has been stuck in the old pattern for months or even years. It takes repetition for the new pattern to stick.

## What Happens When You Skip Visits

When you miss adjustments, your body starts to drift back toward its old patterns. It's not starting from zero — but it does slow down your progress. Think of it like reheating leftovers vs. cooking a fresh meal. You lose some of the momentum.

## The Three Phases of Your Care

**1. Relief Phase** — Visits are closer together. We're calming things down and reducing the stress on your nervous system.

**2. Corrective Phase** — Visits spread out a bit. Your body is learning to hold the adjustments longer. This is where real change happens.

**3. Wellness Phase** — You're feeling great. We maintain your results with regular check-ups, like going to the dentist for cleanings.

## Your Role

- Show up for your scheduled visits
- Follow the home care recommendations we gave you
- Be patient with the process — your body is doing incredible work

## The Bottom Line

Consistency is the difference between feeling a little better and truly changing how your body works. You've already made the decision to invest in your health. Let's make sure you get the full return on that investment.

*We're here to support you every step of the way. If your schedule is tough, talk to us — we'll find a way to make it work.*`,
    createdAt: '2026-02-12T10:00:00Z',
  },
  {
    id: 'handout-nervous-system',
    title: 'Your Nervous System Explained',
    category: 'handout',
    tags: ['nervous system', 'education', 'new patient', 'printable'],
    description: 'A warm overview of the nervous system and why it matters more than most people realize. Helps patients understand the "why" behind neurological chiropractic.',
    content: `# Your Nervous System Explained

## The Boss of Everything

Your nervous system is the master control center of your entire body. It's made up of your brain, your spinal cord, and billions of nerves that reach every single cell, tissue, and organ you have.

Nothing in your body happens without your nervous system saying so.

## What Does It Actually Do?

Here's a short list of what your nervous system controls:

- Your heartbeat and breathing
- Your digestion and immune function
- Your mood and sleep quality
- Your energy levels
- Your ability to heal from injuries and sickness
- How you handle stress
- Your balance and coordination

When your nervous system is working well, your body can handle almost anything life throws at it.

## Two Modes: Gas Pedal and Brake Pedal

Your nervous system has two main modes:

**Sympathetic ("Fight or Flight")** — This is your gas pedal. It revs you up when there's danger or stress. Heart rate goes up, muscles tense, digestion slows down.

**Parasympathetic ("Rest and Digest")** — This is your brake pedal. It calms you down, helps you heal, sleep deeply, and digest your food.

Healthy people shift smoothly between these two modes. But when your nervous system is under stress (from subluxations, poor sleep, emotional strain, or toxins), you can get stuck in fight-or-flight mode. That's when problems start piling up.

## Why We Focus on Your Nervous System

Most healthcare looks at your symptoms — the headache, the back pain, the fatigue. We look at the system that controls all of those things. When your nervous system is clear and balanced, your body has the best chance of working the way it's supposed to.

## How We Measure It

We use scans that show us exactly how your nervous system is performing. These scans measure things like:

- How much stress your body is carrying
- How well your brain and body are communicating
- How balanced your nervous system is between those two modes

This isn't guesswork. It's data.

## The Big Takeaway

You don't have to understand every detail of neuroscience. Just know this: **when your nervous system works better, YOU work better.** That's what we're here to help with.

*Ask us anything. We're happy to explain more about your specific scans and what they mean for you.*`,
    createdAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'handout-post-adjustment',
    title: 'Post-Adjustment Care Instructions',
    category: 'handout',
    tags: ['post-adjustment', 'aftercare', 'instructions', 'printable'],
    description: 'What patients should (and shouldn\'t) do after an adjustment. Covers normal responses, hydration, and when to call.',
    content: `# Post-Adjustment Care Instructions

## You Just Got Adjusted — Here's What to Know

Your adjustment today helped restore better communication between your brain and your body. Here's how to get the most out of it.

## Normal Responses After an Adjustment

Everyone responds differently. You might feel:

- **Great right away** — More energy, less tension, clearer head. Enjoy it!
- **A little sore** — Like you had a good workout. This is normal, especially in the first few weeks of care. It usually fades within 24-48 hours.
- **Tired** — Your body might want to rest and recover. Listen to it.
- **Emotional** — Sometimes releasing tension in the spine can release stored stress. This is actually a good sign.

All of these are normal. Your body is adapting to a new, healthier pattern.

## Do This After Your Adjustment

- **Drink extra water** — Hydration helps your body process the changes from your adjustment.
- **Move gently** — A short walk is great. Gentle stretching is fine.
- **Rest if you need to** — Don't push through fatigue. Your body is doing important work.
- **Pay attention** — Notice how you feel over the next few days. Better sleep? More energy? Less tension? These are signs of progress.

## Avoid This After Your Adjustment

- **Heavy lifting or intense exercise** for the rest of the day. Give your body time to integrate the adjustment.
- **Cracking or popping your own neck/back.** This can undo the specific correction we just made.
- **Sitting in one position for hours.** Get up and move every 30-45 minutes.
- **Negative self-talk about your progress.** Healing is not always a straight line. Trust the process.

## When to Contact Us

Call or text our office if you experience:

- Sharp pain that came on suddenly after your visit
- Numbness or tingling that wasn't there before
- Anything that feels very different from your typical post-adjustment response

These are rare, but we always want to hear from you if something feels off.

## Remember

Each adjustment is one step in a bigger journey. The changes happening inside your body are real, even when you can't feel them yet. You're doing something incredibly important for your health.

*See you at your next visit!*`,
    createdAt: '2026-03-18T10:00:00Z',
  },
  {
    id: 'handout-first-month',
    title: 'What to Expect in Your First Month',
    category: 'handout',
    tags: ['new patient', 'expectations', 'first month', 'printable'],
    description: 'Sets realistic expectations for the first 30 days of care. Reduces drop-off by normalizing the ups and downs of early care.',
    content: `# What to Expect in Your First Month

## Welcome to Your Healing Journey

Starting chiropractic care is a big decision. You might be wondering what the next few weeks will look like. Here's an honest look at what most patients experience.

## Week 1: Getting Started

- You'll come in more frequently — this is intentional. Your nervous system needs consistent input to start changing.
- You might feel a bit sore after your first few adjustments. That's normal. Think of it like starting a new exercise routine.
- Some people feel better right away. Others don't notice changes yet. Both are normal.

## Week 2: Things Start Shifting

- Your body is beginning to respond to the adjustments. You might notice small changes — sleeping a little better, feeling a bit more relaxed, having more energy.
- Some people experience a "healing response" — old symptoms might flare up briefly before improving. This can feel frustrating, but it's actually a sign your body is processing and adapting.
- Keep showing up. This is where consistency matters most.

## Week 3: Building Momentum

- By now, most patients start to feel a real difference. The changes might be subtle or significant — everyone's timeline is different.
- Your body is starting to hold adjustments longer. The new pattern is taking root.
- You might notice changes you didn't expect — better digestion, improved mood, fewer headaches — because your nervous system affects everything.

## Week 4: Seeing the Bigger Picture

- You're hitting your stride. The adjustment routine feels normal now.
- This is a great time to reflect on where you started and how far you've come — even if you still have work to do.
- We may start to adjust your visit frequency based on how your body is responding.

## A Few Honest Truths

- **Healing is not a straight line.** You'll have great days and tough days. That's normal.
- **Symptoms are the last thing to show up and the first thing people focus on.** Real healing happens underneath, in your nervous system, long before your symptoms change.
- **Your body has been dealing with these patterns for years.** Give it time to rewrite them.

## Your Job

1. Show up for your visits
2. Drink plenty of water
3. Follow any home care recommendations
4. Be patient and kind to yourself
5. Ask us questions anytime

## We Believe In You

You chose to take control of your health. That takes courage. We're honored to be part of your journey, and we're here for every step of it.

*Your next scan will show you exactly how your nervous system is responding. We can't wait to review it with you.*`,
    createdAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 'handout-scan-results',
    title: 'Understanding Your Scan Results',
    category: 'handout',
    tags: ['scans', 'results', 'education', 'HRV', 'printable'],
    description: 'Helps patients understand what their neurological scans mean in plain language. Covers thermal, sEMG, and HRV scans.',
    content: `# Understanding Your Scan Results

## Why We Scan (Instead of Guess)

We use advanced technology to look at how your nervous system is actually performing. These scans are painless, fast, and incredibly informative. They show us things that X-rays and MRIs can't — how well your brain and body are communicating.

## The Scans We Use

### Thermal Scan (Neurospinal Thermography)
**What it measures:** Temperature differences along your spine.

**Why it matters:** Your nervous system controls blood flow. When nerves are irritated or under stress, the blood flow to that area changes, which changes the temperature. This scan shows us where nerve interference is happening.

**How to read it:** The bars on your scan should be short and centered. Long bars or bars that go far to one side show areas of stress. The colors help too — green is good, red and blue need attention.

### Surface EMG (Electromyography)
**What it measures:** How much energy your muscles are using along your spine.

**Why it matters:** Your muscles are controlled by your nerves. When there's interference, your muscles work harder than they should (or not hard enough). This scan shows us patterns of tension and imbalance.

**How to read it:** Even, balanced bars are the goal. Uneven bars mean your body is compensating — some areas are overworking while others are underperforming.

### Heart Rate Variability (HRV)
**What it measures:** How well your nervous system adapts to stress.

**Why it matters:** HRV tells us whether your body is stuck in "fight or flight" mode or if it can shift smoothly between stress mode and recovery mode. Higher HRV generally means a more adaptable, resilient nervous system.

**How to read it:** We'll show you where you fall on the scale and what your score means for your overall health and ability to handle stress.

## What the Colors Mean

- **Green** — Your nervous system is functioning well in this area
- **Yellow** — Mild stress or interference. Worth watching.
- **Red/Blue** — Significant interference. This is where we focus our care.

## Your Scores Will Change

As you progress through care, we'll rescan you to track your improvement. Most patients see meaningful changes in their scans within the first few weeks. Watching your nervous system improve on paper is one of the most rewarding parts of care.

## Questions?

We know this can be a lot of information. Please ask us to explain anything you're curious about. There are no dumb questions. Your health is worth understanding.

*We'll review your scans with you at your next progress evaluation. Bring this sheet along if it helps!*`,
    createdAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'handout-stress-spine',
    title: 'The Stress-Spine Connection',
    category: 'handout',
    tags: ['stress', 'nervous system', 'education', 'printable'],
    description: 'Explains how emotional and physical stress shows up in the spine and nervous system. Helps patients connect daily life to their chiropractic care.',
    content: `# The Stress-Spine Connection

## Stress Isn't Just in Your Head

When people say they're "stressed," they usually mean they feel overwhelmed or anxious. But stress is much more than a feeling — it's a physical event in your body. And your spine is right in the middle of it.

## Here's What Happens When You're Stressed

1. Your brain detects a threat (a deadline, an argument, bad news, even poor sleep)
2. Your nervous system shifts into "fight or flight" mode
3. Your muscles tighten — especially along your spine, neck, and shoulders
4. Your heart rate increases, digestion slows down, and your immune system takes a back seat
5. If the stress doesn't let up, your body stays locked in this pattern

## The Problem With Chronic Stress

A little stress is fine. Your body is built to handle short bursts of it. The problem is when the stress never stops. When you're stressed day after day, your muscles stay tight, your spine stays locked up, and subluxations develop or get worse.

It becomes a cycle:

**Stress → Muscle tension → Spinal misalignment → Nerve interference → Your body can't handle stress as well → More stress**

## Where You Carry It

Most people carry stress in predictable places:

- **Neck and upper back** — Worry, overthinking, screen time
- **Mid-back** — Emotional stress, feeling unsupported
- **Lower back** — Financial stress, feeling overwhelmed by responsibilities

Sound familiar? You're not imagining it. Your body literally stores stress in your spine.

## How Chiropractic Helps Break the Cycle

When we adjust your spine, we're doing more than moving bones. We're:

- Releasing the tension your muscles have been holding
- Removing interference from your nerves
- Helping your nervous system shift out of "fight or flight" and back into "rest and recover"
- Giving your brain accurate information about what's happening in your body

Many patients tell us they feel calmer, sleep better, and handle stress more easily once they're under regular care. That's not a coincidence — that's your nervous system working better.

## What You Can Do

- **Keep your adjustment schedule.** Consistency helps your nervous system build resilience.
- **Breathe.** Slow, deep belly breaths activate your "rest and recover" mode. Try 5 minutes a day.
- **Move your body.** A daily walk does wonders.
- **Sleep.** Your body heals and resets during sleep. Make it a priority.
- **Talk to us.** If life is extra stressful right now, let us know. We can adjust our approach to support what your body needs.

*You can't always control your stress. But you can control how well your body handles it. That's what we're here for.*`,
    createdAt: '2026-03-25T10:00:00Z',
  },
  {
    id: 'handout-kids',
    title: 'Chiropractic Care for Kids',
    category: 'handout',
    tags: ['pediatric', 'kids', 'family', 'education', 'printable'],
    description: 'Answers the most common parent questions about kids and chiropractic care. Warm, reassuring, evidence-informed.',
    content: `# Chiropractic Care for Kids

## "Do Kids Really Need Chiropractic?"

It's one of the most common questions we hear. And it's a great one. Here's the short answer: kids have nervous systems too — and those nervous systems are under more stress than most parents realize.

## Why Kids Get Adjusted

Children's spines and nervous systems are growing and developing rapidly. Subluxations (misalignments that create nerve interference) can happen from:

- **Birth** — Even normal deliveries put significant force on a baby's spine and neck
- **Learning to walk** — Toddlers fall an average of 25 times per day
- **Backpacks and screens** — Posture stress starts younger than ever
- **Sports and play** — Bumps, falls, and collisions are a normal part of childhood
- **Emotional stress** — School pressure, social challenges, family changes

Just because kids are resilient doesn't mean these stresses don't add up.

## What We Look For

We're not treating diseases in children. We're checking to make sure their nervous system is clear and functioning at its best. When a child's nervous system works well, their body can:

- Grow and develop properly
- Sleep more soundly
- Focus and learn more easily
- Fight off sickness more effectively
- Handle emotional ups and downs better

## Is It Safe?

Yes. Adjustments for children are very different from adult adjustments. The amount of pressure we use on an infant is about the same as what you'd use to test the ripeness of a tomato. For older kids, the adjustments are gentle, quick, and specific.

Children usually love getting adjusted. Many parents tell us it's their kid's favorite appointment.

## Common Reasons Parents Bring Their Kids In

- Colic or fussiness in babies
- Trouble sleeping
- Ear infections or frequent illness
- Difficulty concentrating
- Growing pains
- Sports performance
- Overall wellness and prevention

## What Parents Notice

Parents often report changes like:

- Better sleep
- Improved behavior and mood
- Fewer sick days
- Better focus at school
- More energy and resilience

## Starting Early Matters

Think about it this way: you take your kids to the dentist before they have cavities. Chiropractic checkups for kids work the same way. We're making sure their nervous system is developing without interference so problems don't build up over time.

## We're Happy to Answer Questions

If you're curious about whether chiropractic is right for your child, just ask. We can do a simple, non-invasive check to see how their nervous system is doing. No pressure, no commitment — just information.

*A healthy nervous system sets the foundation for a healthy life. The earlier we start, the better.*`,
    createdAt: '2026-03-28T10:00:00Z',
  },

  // ============================================================
  // TEXT/EMAIL TEMPLATES (10 pieces)
  // ============================================================
  {
    id: 'template-welcome-text',
    title: 'New Patient Welcome Text',
    category: 'template',
    tags: ['new patient', 'welcome', 'text message', 'onboarding'],
    description: 'A short, warm welcome text to send right after a new patient books or completes their first visit.',
    content: `Hey [Patient Name]! This is [Doctor Name] from [Practice Name]. I just wanted to personally welcome you and let you know how excited we are to work with you. If you have any questions before your next visit, don't hesitate to text me here. We've got your back (literally). See you soon!`,
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'template-welcome-email',
    title: 'New Patient Welcome Email',
    category: 'template',
    tags: ['new patient', 'welcome', 'email', 'onboarding'],
    description: 'A longer welcome email for new patients. Sets the tone for the relationship and reinforces the value of nervous-system-focused care.',
    content: `**Subject: Welcome to [Practice Name] — We're So Glad You're Here**

Hi [Patient Name],

I wanted to take a moment to personally welcome you to our practice. Whether you found us through a friend, online, or just walked in — I'm glad you're here.

I know choosing a new healthcare provider can feel like a big decision. I want you to know that we take that trust seriously. Our approach is a little different from what you might expect. We focus on your nervous system — the master control system of your entire body — because when it works better, everything works better.

Here's what you can expect from us:

- **We listen.** Your story matters. We'll never rush you.
- **We measure.** We use advanced scanning technology so we can see exactly what's happening — not guess.
- **We explain.** You'll always know what we're doing and why.
- **We care.** This isn't just a job for us. Helping people get healthier is what we love to do.

If you have any questions before your next visit, just reply to this email or give us a call. No question is too small.

We're excited about what's ahead for your health.

Warmly,
[Doctor Name]
[Practice Name]`,
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'template-missed-text',
    title: 'Missed Appointment Follow-Up Text',
    category: 'template',
    tags: ['missed appointment', 'no show', 'text message', 'follow-up'],
    description: 'A friendly, non-judgmental text for patients who missed an appointment. No guilt trips — just care.',
    content: `Hey [Patient Name], it's [Doctor Name]. We missed you at your appointment today! No worries at all — life happens. Just want to make sure you get rescheduled so we can keep your momentum going. Can you give us a call or text back to grab a new time? We've got you.`,
    createdAt: '2026-02-08T10:00:00Z',
  },
  {
    id: 'template-missed-email',
    title: 'Missed Appointment Follow-Up Email',
    category: 'template',
    tags: ['missed appointment', 'no show', 'email', 'follow-up'],
    description: 'A warm follow-up email for missed appointments. Reframes the missed visit around their health goals without being pushy.',
    content: `**Subject: We Missed You Today!**

Hi [Patient Name],

We noticed you weren't able to make it to your appointment today, and we just wanted to check in. No judgment at all — we know how hectic life can get.

Here's why I wanted to reach out: your care plan was designed specifically for you, based on what your scans showed us about your nervous system. Each visit builds on the last one, so staying on track really does make a difference in your results.

The good news? One missed visit isn't a setback. Let's just get you back on the schedule.

You can rebook by:
- Replying to this email
- Calling us at [phone number]
- Booking online at [booking link]

We're cheering for you and your health, [Patient Name]. Let's keep the momentum going.

Talk soon,
[Doctor Name]
[Practice Name]`,
    createdAt: '2026-02-08T10:00:00Z',
  },
  {
    id: 'template-reactivation',
    title: 'Re-Activation for Lapsed Patients',
    category: 'template',
    tags: ['reactivation', 'lapsed', 'inactive', 'text message', 'win-back'],
    description: 'A text for patients who haven\'t been in for 3+ months. Opens the door without pressure.',
    content: `Hey [Patient Name], it's [Doctor Name] from [Practice Name]. It's been a while since we've seen you and I just wanted to check in. How are you feeling? No pitch, no pressure — I genuinely want to know. If you ever want to come back in for a check-up or have questions about anything, we're here. Hope you're doing well!`,
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'template-referral-request',
    title: 'Referral Request Text',
    category: 'template',
    tags: ['referral', 'word of mouth', 'text message', 'growth'],
    description: 'A natural, non-awkward way to ask patients for referrals via text. Best sent after a positive interaction or great progress report.',
    content: `Hey [Patient Name]! Quick question — is there anyone in your life (family, friend, coworker) who's been dealing with health stuff that isn't getting better? I'd love to help them the way we've been helping you. No pressure at all. If someone comes to mind, just send them our way or share my number. Thanks for being such an awesome part of our practice family!`,
    createdAt: '2026-03-05T10:00:00Z',
  },
  {
    id: 'template-care-plan-complete',
    title: 'Care Plan Completion Congrats',
    category: 'template',
    tags: ['care plan', 'milestone', 'congratulations', 'text message'],
    description: 'Celebrates a patient completing their initial care plan. Reinforces the value of what they\'ve accomplished.',
    content: `[Patient Name]!! I just want to take a second to say CONGRATULATIONS. You finished your initial care plan and that is a huge deal. The commitment you've shown to your health is inspiring. Your scans tell the story — your nervous system is in a completely different place than when you started. I'm so proud of you. Let's talk about what's next at your next visit. You should feel really good about what you've done.`,
    createdAt: '2026-03-30T10:00:00Z',
  },
  {
    id: 'template-birthday',
    title: 'Birthday Message',
    category: 'template',
    tags: ['birthday', 'personal', 'text message', 'relationship'],
    description: 'A simple, warm birthday text. No promotions — just genuine well-wishes from the doctor.',
    content: `Happy Birthday, [Patient Name]! I hope today is amazing. Thanks for trusting us with your health — it's a privilege to be part of your journey. Enjoy your day to the fullest. You deserve it! - [Doctor Name] & the [Practice Name] team`,
    createdAt: '2026-02-18T10:00:00Z',
  },
  {
    id: 'template-post-first-visit',
    title: 'Post-First-Visit Check-In',
    category: 'template',
    tags: ['new patient', 'first visit', 'check-in', 'text message'],
    description: 'A check-in text sent the evening after a patient\'s first adjustment. Shows you care and opens a feedback loop.',
    content: `Hey [Patient Name], it's [Doctor Name]. I just wanted to check in after your first adjustment today. How are you feeling? Some people feel great right away, others feel a little sore — both are totally normal. Make sure you drink plenty of water tonight. If you have any questions at all, text me here. I'm looking forward to seeing your progress. Talk soon!`,
    createdAt: '2026-03-22T10:00:00Z',
  },
  {
    id: 'template-review-request',
    title: 'Review Request',
    category: 'template',
    tags: ['review', 'google', 'testimonial', 'text message', 'growth'],
    description: 'Asks for a Google review in a genuine, non-pushy way. Best sent after a patient shares a positive experience.',
    content: `Hey [Patient Name], hearing about your progress today honestly made my day. Would you be open to sharing your experience in a quick Google review? It only takes a minute and it helps other people in our community find us when they need help. Here's the link: [Review Link]. No pressure at all — I just think your story could really encourage someone. Thanks for being you!`,
    createdAt: '2026-04-01T10:00:00Z',
  },

  // ============================================================
  // SOCIAL MEDIA POSTS (8 pieces)
  // ============================================================
  {
    id: 'social-nervous-system-controls',
    title: 'What Your Nervous System Actually Controls',
    category: 'social',
    tags: ['education', 'nervous system', 'awareness', 'social media'],
    description: 'An educational post that opens people\'s eyes to how much their nervous system does. High save/share potential.',
    content: `Your nervous system controls:

Your heartbeat.
Your digestion.
Your immune function.
Your sleep quality.
Your mood.
Your energy.
Your ability to heal.

Every. Single. Function.

And it all runs through your spine.

So when a bone in your spine shifts and puts pressure on a nerve... it's not just "back pain." It's your body losing the ability to run at 100%.

That's why we don't chase symptoms. We check the system that controls everything.

If you've never had your nervous system evaluated, you're guessing about your health.

We don't guess. We scan. We measure. We correct.

Tag someone who needs to hear this.

[Image: Clean graphic showing a silhouette of the human body with the brain and spinal cord highlighted, with arrows pointing to different organs. Minimal, modern design with practice brand colors.]`,
    createdAt: '2026-02-25T10:00:00Z',
  },
  {
    id: 'social-brain-spine-info',
    title: 'Why Your Brain Needs Accurate Info from Your Spine',
    category: 'social',
    tags: ['education', 'brain', 'spine', 'neuroplasticity', 'social media'],
    description: 'Explains the brain-body feedback loop in a way that makes people stop scrolling. Great for positioning the practice as different.',
    content: `Your brain makes 3 million adjustments to your body every second.

Read that again.

3 million decisions. Per second.

Your posture. Your balance. Your blood pressure. Your digestion. All of it.

But here's the thing — your brain can only make good decisions if it's getting good information.

And where does most of that information come from?

Your spine.

The joints in your spine send a constant stream of data to your brain about where you are in space, how you're moving, and what's happening in your body.

When a vertebra is stuck or misaligned (what we call a subluxation), the data gets distorted. Your brain starts making decisions based on bad information.

That's when things go sideways. Literally and figuratively.

An adjustment doesn't just "crack your back." It restores the quality of information flowing between your spine and your brain.

Better input. Better output. Better you.

[Image: Split image — left side shows a foggy/static TV screen labeled "with subluxation," right side shows a crystal clear screen labeled "clear nervous system." Clean, modern design.]`,
    createdAt: '2026-03-02T10:00:00Z',
  },
  {
    id: 'social-testimonial-template',
    title: 'Patient Testimonial Template',
    category: 'social',
    tags: ['testimonial', 'social proof', 'template', 'social media'],
    description: 'A fill-in-the-blank testimonial post template. Just swap in the patient\'s story and photo.',
    content: `"I came in because of [original complaint].

I had tried [what they tried before] and nothing was really working.

After [timeframe] of care, I noticed [specific changes — sleep, energy, pain, mood, etc.].

But the thing that surprised me the most? [Unexpected benefit they didn't come in for].

I didn't know my [nervous system / spine / body] could work this well."

— [Patient First Name], [Practice Name] patient

Every person who walks through our doors has a story. And watching that story change is why we do what we do.

If you've been thinking about getting checked... this is your sign.

[Image: Genuine photo of the patient (with permission) smiling in the office, or a branded quote graphic with the testimonial text. Warm lighting, authentic feel — not stock photography.]`,
    createdAt: '2026-03-08T10:00:00Z',
  },
  {
    id: 'social-hrv-fact',
    title: 'Did You Know? HRV Fact',
    category: 'social',
    tags: ['HRV', 'heart rate variability', 'education', 'did you know', 'social media'],
    description: 'Introduces HRV (Heart Rate Variability) to a general audience. Makes people curious enough to want their own checked.',
    content: `Did you know your heart doesn't beat like a metronome?

There are tiny variations between each heartbeat. And those variations are actually a sign of HEALTH.

It's called Heart Rate Variability (HRV), and it's one of the best indicators of how well your nervous system is handling stress.

High HRV = Your body adapts well. You recover faster. You handle stress like a champ.

Low HRV = Your body is stuck in survival mode. Stress is winning.

Here's what's wild: we measure HRV as part of our nervous system evaluation. It gives us a window into how your body is actually functioning — not just how you feel.

Some of the healthiest-looking people walk in with the lowest HRV scores. And some people who feel terrible are surprised at how quickly their scores improve with care.

You can't manage what you don't measure.

Want to know your HRV score? Comment "SCAN" or send us a message.

[Image: A clean, branded graphic showing a heart with a subtle wave pattern inside it. Include the text "What's YOUR HRV score?" Bold, modern typography.]`,
    createdAt: '2026-04-02T10:00:00Z',
  },
  {
    id: 'social-kids-chiro',
    title: 'Did You Know? Kids and Chiropractic',
    category: 'social',
    tags: ['pediatric', 'kids', 'family', 'did you know', 'social media'],
    description: 'Normalizes the idea of kids getting adjusted. Addresses the most common objection (safety) head-on.',
    content: `We adjust kids in our office.

And before you ask — yes, it's safe. And no, it doesn't look like an adult adjustment.

The pressure we use on a newborn is about the same as what you'd use to check if a tomato is ripe. Seriously.

Here's why kids need chiropractic care:

The birth process puts up to 90 pounds of force on a baby's spine.

Toddlers fall 25+ times a day while learning to walk.

Kids sit in school desks for 7 hours and stare at screens for more.

Sports. Backpacks. Growth spurts. Emotional stress.

Their little nervous systems are under way more stress than we realize.

Parents bring their kids to us for:
- Better sleep
- Fewer ear infections
- Improved focus
- Less anxiety
- Stronger immune function
- Overall wellness

We don't treat these conditions. We make sure their nervous system is clear so their body can do what it's designed to do.

The best time to start chiropractic care? As early as possible.

[Image: Warm, genuine photo of a chiropractor gently adjusting a smiling child or baby. Bright, friendly lighting. Parents smiling in the background if possible.]`,
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'social-myth-buster',
    title: 'Myth-Buster: Just for Back Pain',
    category: 'social',
    tags: ['myth', 'education', 'awareness', 'back pain', 'social media'],
    description: 'Tackles the biggest misconception about chiropractic head-on. Repositions the practice as nervous-system-focused.',
    content: `"Chiropractic is just for back pain."

Let's talk about this.

If chiropractic was just about back pain, we wouldn't see:
- Patients sleeping through the night for the first time in years
- Kids focusing better in school
- Digestive issues resolving
- Anxiety levels dropping
- Immune systems getting stronger
- Energy coming back
- Headaches disappearing

We don't treat any of those things directly.

What we DO is remove interference from the nervous system — the system that controls ALL of those things.

When your brain and body communicate clearly, your body works better. Period.

Is chiropractic great for back pain? Absolutely.

But if that's all you think it is... you're missing about 90% of the picture.

Your nervous system is running the show. We just make sure nothing's getting in the way.

[Image: Text-based graphic with the myth in large text crossed out, and "It's about your nervous system" written below. Clean, bold design.]`,
    createdAt: '2026-03-12T10:00:00Z',
  },
  {
    id: 'social-milestone',
    title: 'Practice Milestone Template',
    category: 'social',
    tags: ['milestone', 'celebration', 'community', 'template', 'social media'],
    description: 'A template for celebrating practice milestones (patient count, anniversary, etc.). Fill in the blanks and post.',
    content: `[NUMBER] [patients served / adjustments given / years in practice / families helped].

We just hit this milestone and honestly... we're a little emotional about it.

Every single one of those [patients / adjustments / years / families] represents a person who trusted us with their health. Someone who said "I want something different. I want something better."

This isn't just a number to us. It's [Patient Name] who finally sleeps through the night. It's [Patient Name]'s kid who stopped getting ear infections. It's [Patient Name] who got off the sidelines and back to doing what they love.

We didn't get here alone. We got here because of YOU — our incredible community.

Thank you for trusting us. Thank you for referring your people. Thank you for showing up, even on the days you didn't feel like it.

Here's to the next [number]. We're just getting started.

[Image: Team photo in the office, everyone smiling. Or a photo of the milestone number displayed creatively (balloon numbers, written on a whiteboard, etc.). Authentic and celebratory.]`,
    createdAt: '2026-02-28T10:00:00Z',
  },
  {
    id: 'social-holiday-stress',
    title: 'Seasonal: Stress and the Holidays',
    category: 'social',
    tags: ['seasonal', 'holidays', 'stress', 'self-care', 'social media'],
    description: 'A timely post about managing holiday stress through nervous system care. Works for Thanksgiving, Christmas, New Year, or any high-stress season.',
    content: `The holidays are beautiful. And also... a lot.

Travel. Family dynamics. Financial pressure. Sugar. Alcohol. Less sleep. More obligations.

Your nervous system feels ALL of it.

Here's what happens inside your body during the holiday season:

Your stress response ramps up. Your muscles tighten. Your immune system takes a hit (hello, holiday cold). Your sleep suffers. Your digestion goes sideways.

And most people just push through it and crash in January.

What if you did it differently this year?

Here's your nervous system survival guide for the holidays:

1. Keep your adjustment schedule. Seriously. This is when you need it most.
2. Drink water like it's your job.
3. Move your body daily — even 15 minutes.
4. Set boundaries. "No" is a complete sentence.
5. Breathe. 5 deep belly breaths before every meal.
6. Sleep. Protect it fiercely.

You can enjoy the holidays AND take care of yourself. It's not either/or.

And if you need an adjustment to reset after a stressful week? That's literally what we're here for.

Save this post. You'll need it.

[Image: Cozy, warm photo — maybe a mug of tea, holiday lights slightly blurred in background, with text overlay: "Your nervous system needs you this season." Calming, not clinical.]`,
    createdAt: '2026-02-14T10:00:00Z',
  },

  // ============================================================
  // EMAIL SEQUENCES (4 pieces)
  // ============================================================
  {
    id: 'sequence-new-patient-onboarding',
    title: 'New Patient Onboarding Sequence',
    category: 'sequence',
    tags: ['new patient', 'onboarding', 'email sequence', 'nurture', 'automation'],
    description: 'A 5-email sequence sent over the first 2 weeks of care. Educates, reassures, and builds commitment during the most critical window.',
    content: `**Email 1 — Send: Day 1 (after first visit)**
**Subject: You did something brave today**

Hi [Patient Name],

Most people never take the step you took today. They keep ignoring the signals, pushing through, hoping things will just get better on their own.

You chose differently. You chose to find out what's actually going on — and to do something about it. That takes real courage.

I want you to know what happens next: your body is going to start responding to the adjustment you received today. You might feel great. You might feel a little sore. You might feel tired. All of it is normal, and all of it means your body is waking up.

Drink plenty of water tonight, move gently, and rest if you need to.

We're just getting started, and I'm genuinely excited about what's ahead for you.

See you at your next visit,
[Doctor Name]

---EMAIL 2---

**Email 2 — Send: Day 3**
**Subject: Why we scan (and why it matters)**

Hi [Patient Name],

Remember those scans we did during your first visit? I want to explain why they're such a big deal.

Most healthcare providers ask you how you feel, then make decisions based on your answer. The problem? How you feel isn't always a reliable indicator of how you're actually doing. You can feel fine and still have significant stress on your nervous system. And you can feel terrible while your body is actually healing.

Our scans bypass the guesswork. They show us exactly where your nervous system is under stress, how severe it is, and what's being affected. It's like getting a report card for your brain-body connection.

As you continue through care, we'll rescan periodically so you can see your progress in black and white. It's one of the most rewarding parts of the process — watching your nervous system transform on paper.

If you have questions about what your scans showed, bring them to your next visit. I love going over this stuff.

Talk soon,
[Doctor Name]

---EMAIL 3---

**Email 3 — Send: Day 7**
**Subject: The question everyone asks in week one**

Hi [Patient Name],

By now, you're about a week into care. And there's a question that almost every patient has at this point:

"Is this working?"

Here's what I want you to know: yes. Even if you can't feel it yet.

Your nervous system has been under stress for a long time — months, years, maybe decades. It doesn't rewire overnight. But changes are happening. With every adjustment, your brain is getting clearer signals from your spine. Your muscles are starting to relax into new patterns. Your body is beginning to shift out of chronic stress mode.

Some patients feel huge differences in the first week. Others take a few weeks to notice. Both are completely normal. The scans don't lie, and that's where we'll see the evidence of change.

Be patient with the process. Be kind to yourself. Keep showing up.

You're doing the hard part. And it's worth it.

Cheering you on,
[Doctor Name]

---EMAIL 4---

**Email 4 — Send: Day 10**
**Subject: The thing nobody told you about healing**

Hi [Patient Name],

There's something about healing that nobody really talks about: it's not a straight line.

You might have a few amazing days, then a rough one. You might feel a symptom you haven't felt in years. You might have a wave of emotion, a burst of energy, or a day where you're exhausted for no obvious reason.

This is called a healing response, and it's actually a GOOD sign. It means your body is processing, adapting, and reorganizing. It's like cleaning out a closet — it gets messier before it gets organized.

If this happens to you, don't panic. Don't assume care isn't working. Your body is doing exactly what it needs to do.

Here's what helps:
- Stay hydrated
- Get extra rest when your body asks for it
- Keep your appointment schedule (this is the worst time to skip)
- Talk to us about what you're experiencing

You're in the thick of it. This is where the real change happens.

I'm proud of you for sticking with it,
[Doctor Name]

---EMAIL 5---

**Email 5 — Send: Day 14**
**Subject: Two weeks in — let's check in**

Hi [Patient Name],

You're two weeks into care. That's a real milestone.

I want to ask you something: What have you noticed?

Maybe it's better sleep. Maybe you're less irritable. Maybe your neck doesn't lock up like it used to. Maybe you just feel... different. Lighter. More like yourself.

Whatever it is, write it down. These early wins matter more than you think. Not because they prove care is working (your scans will show that). But because they remind you WHY you started.

On tough days — and they'll come — you can look back at this list and remember: my body is changing. I'm investing in something real.

If you haven't noticed anything yet, that's okay too. Everyone's timeline is different. Your nervous system is doing the work. The results will follow.

As we move forward, I want you to know: you're not just a patient to us. You're a person we genuinely care about. And we're in your corner every step of the way.

Here's to the next two weeks,
[Doctor Name]`,
    createdAt: '2026-03-15T10:00:00Z',
  },
  {
    id: 'sequence-reactivation',
    title: 'Re-Activation Email Sequence',
    category: 'sequence',
    tags: ['reactivation', 'lapsed', 'win-back', 'email sequence', 'automation'],
    description: 'A 3-email sequence for patients who haven\'t been in for 3+ months. Non-judgmental, door-opening approach.',
    content: `**Email 1 — Send: Day 1**
**Subject: We noticed you've been gone**

Hi [Patient Name],

It's been a while since we've seen you at [Practice Name], and I wanted to reach out personally.

I'm not writing to guilt-trip you or give you a sales pitch. I just genuinely want to know — how are you doing?

Life gets busy. Priorities shift. I get it. Whatever the reason you stepped away from care, it's okay.

But here's what I know: your nervous system doesn't take time off. The stresses of daily life — the sitting, the screens, the deadlines, the sleep deprivation — they add up. And without regular check-ups, subluxations can build up silently.

If you've been thinking about coming back in, even just for a check-up, the door is wide open. No judgment. No lectures. Just a scan, an honest conversation, and a plan that works for your life right now.

You already know how you feel when your nervous system is clear. Let's get you back to that.

Reply to this email or call us at [phone number] anytime.

Hope to see you soon,
[Doctor Name]

---EMAIL 2---

**Email 2 — Send: Day 5**
**Subject: A quick thought about where you were**

Hi [Patient Name],

I was looking at your file today and remembered where you were when we last saw you. You had made real progress — your scans were improving, and you were feeling a difference.

I don't bring that up to make you feel bad about stopping. I bring it up because that progress is still meaningful. Your body remembers the work you put in. We wouldn't be starting from scratch.

If something wasn't working for you — whether it was the schedule, the cost, the commute, or anything else — I'd love the chance to talk about it. We're always looking for ways to make care work for the people who need it.

And if you stopped because you were feeling good? That's actually great. But feeling good and functioning well aren't always the same thing, and a quick scan would tell us exactly where you stand.

Either way, no pressure. Just know that we're here if and when you're ready.

Thinking of you,
[Doctor Name]

---EMAIL 3---

**Email 3 — Send: Day 10**
**Subject: One last thing (then I'll stop bugging you)**

Hi [Patient Name],

This is my last email in this little series, so I'll keep it short.

You matter to us. Not as a number. As a person.

We remember your story. We remember why you came in and what you were working toward. And if you decide to come back — whether it's today, next month, or next year — we'll be here.

If you'd like to come in for a complimentary nervous system scan to see where things stand, just reply "SCAN" and we'll get you on the schedule. No strings attached.

Whatever you decide, I wish you nothing but health and happiness.

Take care of yourself,
[Doctor Name]
[Practice Name]`,
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'sequence-referral-campaign',
    title: 'Referral Campaign Email Sequence',
    category: 'sequence',
    tags: ['referral', 'word of mouth', 'campaign', 'email sequence', 'growth'],
    description: 'A 3-email referral campaign sent over 2 weeks. Encourages patients to refer the people they care about. Warm, not transactional.',
    content: `**Email 1 — Send: Day 1**
**Subject: The people you care about most**

Hi [Patient Name],

I have a question for you — and it's a big one.

Is there someone in your life who's struggling with their health?

Maybe it's a spouse who can't sleep. A parent who's "just getting old." A friend who lives on ibuprofen. A coworker who's always stressed and tired.

You know what it felt like before you started care here. You know what it feels like now. And that gap — between where you were and where you are — is something the people you love could experience too.

I'm not asking you to "sell" chiropractic. I'm asking you to think about who in your life could benefit from the same thing that's helped you.

If someone comes to mind, here's all you need to do: share our name, give them our number, or forward this email. We'll take it from there.

You might just change someone's life. And that's not an exaggeration.

Grateful for you,
[Doctor Name]

---EMAIL 2---

**Email 2 — Send: Day 7**
**Subject: Why your referral matters more than you think**

Hi [Patient Name],

Did you know that most people who need chiropractic care never get it?

Not because they can't afford it. Not because they don't have time. But because no one they trust ever told them about it.

That's where you come in.

When you tell someone about your experience at [Practice Name], it carries 10x more weight than any ad we could ever run. Because you're not selling anything — you're sharing something real.

Here's what I ask: think of ONE person this week. Just one. Someone who you know isn't feeling their best. And just mention us. That's it.

"Hey, I've been going to this chiropractor and it's made a real difference. You should check them out."

That one sentence could be the thing that changes everything for them.

If you'd like to refer someone, you can:
- Give them our number: [phone number]
- Send them to our website: [website]
- Have them mention your name when they call — we always love knowing who sent them

Thank you for being an ambassador for better health,
[Doctor Name]

---EMAIL 3---

**Email 3 — Send: Day 14**
**Subject: A thank you (and a small gift)**

Hi [Patient Name],

Whether you've referred someone to us or not, I want to say thank you.

Thank you for being a patient who takes their health seriously. Thank you for trusting us. Thank you for being part of what makes [Practice Name] the kind of place people want to come to.

If you HAVE referred someone recently — you're incredible. Truly. You gave someone a gift they'll never forget.

If you haven't yet, no worries at all. But I did want to let you know about something: for every person you refer who starts care this month, we'd love to [gift/incentive — e.g., give you a complimentary adjustment, enter you in a drawing for X, give you a gift card to Y].

Not because we need to bribe you. But because we want to celebrate the kind of person who cares enough to share.

Thanks for being you, [Patient Name].

With gratitude,
[Doctor Name]
[Practice Name]`,
    createdAt: '2026-03-28T10:00:00Z',
  },
  {
    id: 'sequence-care-plan-milestones',
    title: 'Care Plan Milestone Emails',
    category: 'sequence',
    tags: ['care plan', 'milestones', 'progress', 'email sequence', 'retention'],
    description: 'Four emails sent at key points in a patient\'s care plan: after visit 1, visit 12, visit 24, and care plan completion. Builds momentum and celebrates progress.',
    content: `**Email 1 — Send: After Visit 1**
**Subject: Visit 1 is in the books**

Hi [Patient Name],

One down.

I know that doesn't sound like much, but every journey starts with a single step — and you just took yours.

Today we did more than adjust your spine. We started the process of retraining your nervous system. Your brain received new, better information from your spine for the first time in who knows how long. That's not small. That's the foundation of everything we're going to build together.

Here's what I want you to remember: this first phase of care is about frequency. Your visits are close together on purpose. Your nervous system needs consistent, repeated input to start changing the patterns it's been stuck in.

Show up. Trust the process. Let your body do what it knows how to do.

I'll be here every step of the way,
[Doctor Name]

---EMAIL 2---

**Email 2 — Send: After Visit 12**
**Subject: 12 visits. Here's what's happening inside.**

Hi [Patient Name],

You've now completed 12 visits and I want to pull back the curtain on what's happening inside your body.

By this point, your nervous system has received 12 specific corrections. That's 12 times your brain got better information from your spine. 12 times your muscles were reminded of what "normal" feels like. 12 times your body got a chance to shift out of stress mode and into healing mode.

Even if the changes feel subtle to you, they're not subtle to your nervous system. Here's what's typically happening around visit 12:

- Your spine is beginning to hold adjustments longer
- Your muscles are learning new resting positions
- Your nervous system is building new, healthier patterns (this is neuroplasticity in action)
- Your body's ability to adapt to stress is improving

We'll be doing a progress scan soon, and I expect we'll see measurable changes. I can't wait to show you.

Keep going. You're in the zone where the magic really starts to happen.

Proud of your commitment,
[Doctor Name]

---EMAIL 3---

**Email 3 — Send: After Visit 24**
**Subject: 24 visits — you should see this**

Hi [Patient Name],

24 visits.

Let that sink in for a moment. You've shown up, consistently, 24 times to invest in your health. That is not normal behavior — and I mean that as the highest compliment.

Most people quit when things get hard. Most people stop when they feel "good enough." You didn't. You kept going because you understand something most people don't: there's a difference between feeling okay and actually being healthy.

By now, the changes in your nervous system are significant. Your progress scans should be reflecting what you've been feeling — better adaptation to stress, improved function, more resilience.

We're entering the home stretch of your initial care plan. The habits you've built, the neurological changes you've made, the commitment you've shown — all of it is building toward something lasting.

You should be incredibly proud of yourself.

Almost there,
[Doctor Name]

---EMAIL 4---

**Email 4 — Send: At care plan completion**
**Subject: You did it.**

Hi [Patient Name],

You finished your care plan.

I want to be real with you: most people don't make it this far. Not because they didn't need to — but because it's hard to stay consistent with anything for this long. You did it anyway.

Let's look at where you started:
- Your initial scans showed [areas of significant stress]
- You were dealing with [their original concerns]
- Your nervous system was [general initial state]

And now? Your progress tells a completely different story. The changes in your scans, your function, your daily life — this is what's possible when someone commits to the process.

But I don't want you to think of this as the end. This is a graduation. You've moved from intensive care to maintenance. Your nervous system is performing at a level it hasn't reached in years, maybe ever. Now we maintain it.

Think of it like training for a marathon and then crossing the finish line. You don't stop running forever — you keep going because you love how it feels.

We'll talk about your wellness care schedule at your next visit. But for today, I just want to say:

Congratulations. I am genuinely proud of you. And I'm grateful you trusted me with your health.

Here's to the next chapter,
[Doctor Name]
[Practice Name]`,
    createdAt: '2026-04-08T10:00:00Z',
  },
];
