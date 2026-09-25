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
