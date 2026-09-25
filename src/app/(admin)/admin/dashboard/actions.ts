'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { stripe } from "@/lib/stripe"
import { checkAdminAuth } from '@/lib/admin-auth'
import { getDoctorCounts, getSubscriberCounts } from '@/lib/platform-stats'

// ── Dashboard Stats ──

export async function getAdminDashboardStats() {
  try {
    await checkAdminAuth()
    const supabase = createAdminClient()

    // Shared counts (same numbers as coverage map and homepage)
    const doctorCounts = await getDoctorCounts()
    const subscriberCounts = await getSubscriberCounts()

    // ── MRR from active Stripe subscriptions ──
    let mrr = 0
    let monthlyCount = 0
    let annualCount = 0
    const failedPayments: any[] = []

    try {
      const subscriptions: any[] = []
      for await (const sub of stripe.subscriptions.list({ status: 'active', limit: 100 })) {
        subscriptions.push(sub)
      }

      for (const sub of subscriptions) {
        const item = sub.items?.data?.[0]
        if (!item?.price) continue
        const amount = (item.price.unit_amount || 0) / 100
        const interval = item.price.recurring?.interval

        if (interval === 'month') {
          mrr += amount
          monthlyCount++
        } else if (interval === 'year') {
          mrr += amount / 12
          annualCount++
        }
      }

      // New MRR this month (subscriptions created this month)
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      const monthStartTs = Math.floor(monthStart.getTime() / 1000)

      const newSubs: any[] = []
      for await (const sub of stripe.subscriptions.list({ created: { gte: monthStartTs }, limit: 100 })) {
        newSubs.push(sub)
      }
      let newMrr = 0
      for (const sub of newSubs) {
        const item = sub.items?.data?.[0]
        if (!item?.price) continue
        const amount = (item.price.unit_amount || 0) / 100
        const interval = item.price.recurring?.interval
        if (interval === 'month') newMrr += amount
        else if (interval === 'year') newMrr += amount / 12
      }

      // Churned MRR this month
      const canceledSubs: any[] = []
      for await (const sub of stripe.subscriptions.list({ status: 'canceled', limit: 100 })) {
        if (sub.canceled_at && sub.canceled_at >= monthStartTs) canceledSubs.push(sub)
      }
      let churnedMrr = 0
      for (const sub of canceledSubs) {
        const item = sub.items?.data?.[0]
        if (!item?.price) continue
        const amount = (item.price.unit_amount || 0) / 100
        const interval = item.price.recurring?.interval
        if (interval === 'month') churnedMrr += amount
        else if (interval === 'year') churnedMrr += amount / 12
      }

      // Failed payments
      for await (const charge of stripe.charges.list({ limit: 50 })) {
        if (charge.status === 'failed') {
          failedPayments.push({
            id: charge.id,
            amount: charge.amount / 100,
            email: charge.billing_details?.email || '',
            created: new Date(charge.created * 1000).toISOString(),
          })
          if (failedPayments.length >= 20) break
        }
      }
    } catch (stripeErr) {
      console.error('Stripe error (non-blocking):', stripeErr)
    }

    // ── Pending verifications ──
    const { count: pendingVerifications } = await supabase
      .from('doctors')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'pending')

    return {
      doctors: doctorCounts,
      subscribers: subscriberCounts,
      mrr: Math.round(mrr * 100) / 100,
      newMrr: Math.round((mrr > 0 ? mrr : 0) * 100) / 100, // placeholder until we calculate properly
      churnedMrr: 0, // placeholder
      monthlySubscriptions: monthlyCount,
      annualSubscriptions: annualCount,
      failedPayments: failedPayments.length,
      pendingVerifications: pendingVerifications || 0,
    }
  } catch (e) {
    console.error("Admin Dashboard Error:", e)
    return {
      doctors: { active: 0, pending: 0, invisible: 0, international: 0, statesCovered: 0 },
      subscribers: { confirmed: 0, pending: 0 },
      mrr: 0,
      newMrr: 0,
      churnedMrr: 0,
      monthlySubscriptions: 0,
      annualSubscriptions: 0,
      failedPayments: 0,
      pendingVerifications: 0,
    }
  }
}

// ── Action List: "What needs me today" ──

export interface ActionItem {
  id: string
  urgency: number        // 1=critical, 2=high, 3=medium, 4=low
  category: string
  title: string
  who: string
  waitingSince: string   // ISO date
  waitingDays: number
  link: string
}

export async function getActionList(): Promise<ActionItem[]> {
  try {
    await checkAdminAuth()
    const supabase = createAdminClient()
    const items: ActionItem[] = []
    const now = Date.now()
    const dayMs = 86400000

    const fourteenDaysAgo = new Date(now - 14 * dayMs).toISOString()
    const ninetyDaysAgo = new Date(now - 90 * dayMs).toISOString()

    // Controlled vocabularies for tag review queue
    const VALID_SPECIALTIES = new Set(['Nervous System Focused','Pediatric','Prenatal & Perinatal','Family Wellness','Athletes & Sports','Functional Medicine','Functional Neurology','Upper Cervical','Tonal','Structural & Corrective','Activator Method','Gonstead','Network Spinal','Injury Recovery','Torque Release','Webster Certified','Extremity Adjusting','SOT / Cranial','Animal Chiropractic','Nutrition Counseling','X-Ray / Imaging','Decompression Therapy','Massage Therapy','Corrective Exercises','Custom Orthotics','Dry Needling','Laser Therapy','Rehabilitation','Corporate Wellness','Telehealth','Spanish Speaking','Bilingual Practice','Cash Practice','Community Events','Weekend Hours'])
    const VALID_CONDITIONS = new Set(['Back Pain','Neck Pain','Headaches & Migraines','Sciatica','Sports Injuries','Pregnancy Discomfort','Pediatric Wellness','Chronic Pain','TMJ / Jaw Pain','Scoliosis','Whiplash','Carpal Tunnel','Plantar Fasciitis','Shoulder Pain','Hip Pain','Knee Pain','Postural Imbalances','Spinal Misalignment','Disc Issues','Nervous System Dysfunction','Stress & Anxiety','Sleep Issues','ADHD & Focus','Sensory Processing','Autism Support','Colic & Reflux','Ear Infections','Bedwetting','Torticollis','Developmental Delays','Growing Pains','Athletic Performance','Vertigo & Dizziness','Numbness & Tingling','Fibromyalgia','Arthritis','Work Injuries','Auto Accident Injuries','Post-Concussion','Pelvic Floor','Breech Positioning','Postpartum Recovery','Family Wellness','Elderly Care','Tech Neck','Injury Recovery','Frozen Shoulder','Tension Headaches','Rib Pain'])

    // Fetch all data in parallel
    const [
      pendingDocs,
      invisibleQueue,
      mismatchQueue,
      needsReviewDocs,
      paidDocs,
      tagDocs,
      failedCharges,
    ] = await Promise.all([
      // 1. Pending verifications
      supabase.from('doctors')
        .select('id, first_name, last_name, clinic_name, city, state, created_at')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: true }),

      // 2. Invisible doctor flags
      (supabase as any).from('automation_queue')
        .select('payload, created_at')
        .eq('event_type', 'doctor_invisible'),

      // 3. Address mismatch flags
      (supabase as any).from('automation_queue')
        .select('payload, created_at')
        .eq('event_type', 'address_mismatch'),

      // 4. Profiles flagged needs_review
      (supabase as any).from('doctors')
        .select('id, first_name, last_name, review_notes, created_at')
        .eq('needs_review', true),

      // 5. Paid doctors missing critical profile fields
      (supabase as any).from('doctors')
        .select('id, first_name, last_name, clinic_name, photo_url, hours, first_visit_price, google_reviews_url, onboarding_call_status, spotlight_status, created_at, membership_tier, price_locked_at')
        .eq('verification_status', 'verified')
        .or('country.is.null,country.eq.US'),

      // 6. Doctors with invalid specialty/conditions tags
      (supabase as any).from('doctors')
        .select('id, first_name, last_name, specialties, conditions_treated')
        .eq('verification_status', 'verified')
        .not('specialties', 'is', null),

      // 7. Failed Stripe charges (recent)
      (async () => {
        try {
          const failed: any[] = []
          for await (const charge of stripe.charges.list({ limit: 30 })) {
            if (charge.status === 'failed') {
              failed.push(charge)
              if (failed.length >= 10) break
            }
          }
          return failed
        } catch { return [] }
      })(),
    ])

    // ── 1. Pending verifications (urgency 1) ──
    for (const d of (pendingDocs.data || [])) {
      const days = Math.floor((now - new Date(d.created_at).getTime()) / dayMs)
      items.push({
        id: `pending-${d.id}`,
        urgency: 1,
        category: 'Verification',
        title: 'Doctor pending approval',
        who: `${d.first_name} ${d.last_name}`.trim() || d.clinic_name || 'Unknown',
        waitingSince: d.created_at,
        waitingDays: days,
        link: '/admin/moderation',
      })
    }

    // ── 2. Failed payments (urgency 1) ──
    for (const charge of failedCharges) {
      items.push({
        id: `failed-${charge.id}`,
        urgency: 1,
        category: 'Payment',
        title: 'Payment failed',
        who: charge.billing_details?.email || charge.billing_details?.name || 'Unknown',
        waitingSince: new Date(charge.created * 1000).toISOString(),
        waitingDays: Math.floor((now - charge.created * 1000) / dayMs),
        link: '/admin/revenue',
      })
    }

    // ── 3. Invisible doctors (urgency 2) ──
    for (const q of (invisibleQueue || [])) {
      const p = typeof q.payload === 'string' ? JSON.parse(q.payload) : q.payload
      items.push({
        id: `invisible-${p.doctorId}`,
        urgency: 2,
        category: 'Invisible',
        title: p.reason === 'no_address' ? 'No address on file' : 'Geocoding failed',
        who: p.name || 'Unknown',
        waitingSince: q.created_at,
        waitingDays: Math.floor((now - new Date(q.created_at).getTime()) / dayMs),
        link: '/admin/invisible-doctors',
      })
    }

    // ── 4. Address mismatches (urgency 2) ──
    for (const q of (mismatchQueue || [])) {
      const p = typeof q.payload === 'string' ? JSON.parse(q.payload) : q.payload
      items.push({
        id: `mismatch-${p.doctorId}`,
        urgency: 2,
        category: 'Data Quality',
        title: 'City/address mismatch',
        who: p.name || 'Unknown',
        waitingSince: q.created_at,
        waitingDays: Math.floor((now - new Date(q.created_at).getTime()) / dayMs),
        link: '/admin/invisible-doctors',
      })
    }

    // ── 5. Profiles flagged needs_review (urgency 2) ──
    for (const d of (needsReviewDocs.data || [])) {
      const name = `${d.first_name} ${d.last_name}`.trim()
      items.push({
        id: `review-${d.id}`,
        urgency: 2,
        category: 'Content Review',
        title: d.review_notes || 'Profile flagged for review',
        who: name,
        waitingSince: d.created_at,
        waitingDays: Math.floor((now - new Date(d.created_at).getTime()) / dayMs),
        link: `/admin/directory?search=${encodeURIComponent(name)}`,
      })
    }

    // ── 6. Specialty/conditions tags not in controlled vocabulary (urgency 3) ──
    const tagIssues = new Map<string, { name: string; id: string; invalid: string[] }>()
    for (const d of (tagDocs.data || [])) {
      const invalid: string[] = []
      for (const s of (d.specialties || [])) {
        if (!VALID_SPECIALTIES.has(s)) invalid.push(s)
      }
      for (const c of (d.conditions_treated || [])) {
        if (!VALID_CONDITIONS.has(c)) invalid.push(c)
      }
      if (invalid.length > 0) {
        tagIssues.set(d.id, {
          name: `${d.first_name} ${d.last_name}`.trim(),
          id: d.id,
          invalid,
        })
      }
    }
    if (tagIssues.size > 0) {
      // Show as a single aggregated item to avoid flooding the list
      const totalInvalid = Array.from(tagIssues.values()).reduce((sum, t) => sum + t.invalid.length, 0)
      items.push({
        id: 'tag-review-queue',
        urgency: 3,
        category: 'Tag Review',
        title: `${totalInvalid} uncontrolled tags across ${tagIssues.size} doctors`,
        who: `${tagIssues.size} profiles need tag cleanup`,
        waitingSince: new Date('2026-05-01').toISOString(), // approximate, from vocabulary migration
        waitingDays: Math.floor((now - new Date('2026-05-01').getTime()) / dayMs),
        link: '/admin/directory',
      })
    }

    // ── 7. Paid members with incomplete profiles (urgency 3) ──
    const paidMembers = (paidDocs.data || []).filter((d: any) =>
      d.membership_tier === 'pro' || d.price_locked_at
    )

    for (const d of paidMembers) {
      const name = `${d.first_name} ${d.last_name}`.trim() || d.clinic_name || 'Unknown'
      const missing: string[] = []
      if (!d.photo_url) missing.push('photo')
      if (!d.hours) missing.push('hours')
      if (!d.google_reviews_url) missing.push('Google reviews')

      // Only surface if missing 2+ critical fields (1 missing is common and not urgent)
      if (missing.length >= 2) {
        items.push({
          id: `profile-gap-${d.id}`,
          urgency: 3,
          category: 'Profile Gap',
          title: `Missing ${missing.join(', ')}`,
          who: name,
          waitingSince: d.created_at,
          waitingDays: Math.floor((now - new Date(d.created_at).getTime()) / dayMs),
          link: `/admin/directory?search=${encodeURIComponent(name)}`,
        })
      }
    }

    // ── 6. Onboarding calls not booked, past 14 days (urgency 3) ──
    // Only for doctors who have a user_id (actually signed up, not bulk imports)
    const recentUnbooked = paidMembers.filter((d: any) =>
      d.onboarding_call_status === 'not_booked' &&
      new Date(d.created_at) < new Date(fourteenDaysAgo) &&
      new Date(d.created_at) > new Date('2026-06-01') // exclude bulk imports
    )
    for (const d of recentUnbooked) {
      const name = `${d.first_name} ${d.last_name}`.trim() || d.clinic_name || 'Unknown'
      items.push({
        id: `onboard-${d.id}`,
        urgency: 3,
        category: 'Onboarding',
        title: 'Onboarding call not booked',
        who: name,
        waitingSince: d.created_at,
        waitingDays: Math.floor((now - new Date(d.created_at).getTime()) / dayMs),
        link: `/admin/directory?search=${encodeURIComponent(name)}`,
      })
    }

    // ── 7. Spotlight not scheduled, past 90 days (urgency 4) ──
    const oldNoSpotlight = paidMembers.filter((d: any) =>
      d.spotlight_status === 'not_scheduled' &&
      new Date(d.created_at) < new Date(ninetyDaysAgo) &&
      new Date(d.created_at) > new Date('2026-06-01')
    )
    for (const d of oldNoSpotlight) {
      const name = `${d.first_name} ${d.last_name}`.trim() || d.clinic_name || 'Unknown'
      items.push({
        id: `spotlight-${d.id}`,
        urgency: 4,
        category: 'Spotlight',
        title: 'Interview not scheduled',
        who: name,
        waitingSince: d.created_at,
        waitingDays: Math.floor((now - new Date(d.created_at).getTime()) / dayMs),
        link: '/admin/spotlight',
      })
    }

    // Sort by urgency (critical first), then by waiting days (longest first)
    items.sort((a, b) => {
      if (a.urgency !== b.urgency) return a.urgency - b.urgency
      return b.waitingDays - a.waitingDays
    })

    return items
  } catch (e) {
    console.error('Action list error:', e)
    return []
  }
}

// ── Activity Feed ──

export async function getActivityFeed(limit: number = 30) {
  try {
    await checkAdminAuth()
    const supabase = createAdminClient()
    const activities: any[] = []

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [signups, leads, notifications, recentJobs, recentSeminars] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, role, created_at')
        .gte('created_at', sevenDaysAgo.toISOString()).order('created_at', { ascending: false }).limit(20),
      supabase.from('leads').select('id, email, first_name, source, role, created_at, doctor_id')
        .gte('created_at', sevenDaysAgo.toISOString()).order('created_at', { ascending: false }).limit(20),
      supabase.from('notifications').select('id, user_id, title, body, type, created_at')
        .gte('created_at', sevenDaysAgo.toISOString()).order('created_at', { ascending: false }).limit(30),
      supabase.from('job_postings').select('id, title, doctor_id, status, created_at')
        .gte('created_at', sevenDaysAgo.toISOString()).order('created_at', { ascending: false }).limit(10),
      supabase.from('seminars').select('id, title, host_id, is_approved, created_at')
        .gte('created_at', sevenDaysAgo.toISOString()).order('created_at', { ascending: false }).limit(10),
    ])

    for (const s of (signups.data || [])) {
      activities.push({
        id: `signup-${s.id}`, type: 'signup',
        title: `New ${s.role} signed up`,
        detail: s.full_name || s.email,
        time: s.created_at,
        link: '/admin/users',
      })
    }

    for (const l of (leads.data || [])) {
      const labels: Record<string, string> = {
        appointment_request: 'Appointment request',
        directory_zero_state: 'Notify me request',
        report_concern: 'Concern reported',
        consultation_request: 'Consultation request',
      }
      activities.push({
        id: `lead-${l.id}`, type: 'lead',
        title: labels[l.source || ''] || `Lead (${l.source || 'unknown'})`,
        detail: l.first_name || l.email,
        time: l.created_at,
        link: '/admin/leads',
      })
    }

    // Only include actionable notifications, NOT portal logins
    for (const n of (notifications.data || [])) {
      if (n.type === 'portal_login') continue // skip logins from default feed
      if (n.type === 'appointment') {
        activities.push({ id: `appt-${n.id}`, type: 'inquiry', title: 'Patient inquiry', detail: n.body?.slice(0, 80) || '', time: n.created_at, link: '/admin/inbox' })
      } else if (n.type === 'job_application') {
        activities.push({ id: `jobapp-${n.id}`, type: 'job_application', title: 'Job application', detail: n.body?.slice(0, 80) || '', time: n.created_at, link: '/admin/jobs' })
      }
    }

    for (const j of (recentJobs.data || [])) {
      activities.push({ id: `job-${j.id}`, type: 'job', title: 'Job posted', detail: j.title, time: j.created_at, link: '/admin/jobs' })
    }

    for (const s of (recentSeminars.data || [])) {
      activities.push({
        id: `seminar-${s.id}`, type: 'seminar',
        title: s.is_approved ? 'Seminar published' : 'Seminar submitted (pending)',
        detail: s.title, time: s.created_at, link: '/admin/seminars',
      })
    }

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    return activities.slice(0, limit)
  } catch (e) {
    console.error('Activity feed error:', e)
    return []
  }
}
