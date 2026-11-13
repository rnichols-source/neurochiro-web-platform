'use server'

import { stripe } from "@/lib/stripe";
import { checkAdminAuth } from '@/lib/admin-auth';
import { formatMoney } from '@/lib/admin/member-search';
import { baselineMrrUsd, baselinePayingCount } from '@/lib/founder/mrr-calc';
import { loadMrrBaselineInputs, loadNeuroChiroMrr } from '@/lib/founder/mrr';

/**
 * Fetches all records from a Stripe list API using async iteration.
 */
async function fetchAll<T>(stripeList: any): Promise<T[]> {
  const results: T[] = [];
  for await (const item of stripeList) {
    results.push(item);
  }
  return results;
}

export async function getRevenueData(timeRange: string) {
  const now = new Date();
  const startDate = new Date();
  const previousStartDate = new Date();
  let previousEndDate = new Date();

  try {
    await checkAdminAuth();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  // 1. Establish Precise Time Windows
  if (timeRange === "7D") {
    startDate.setDate(now.getDate() - 7);
    previousEndDate = new Date(startDate);
    previousStartDate.setDate(previousEndDate.getDate() - 7);
  } else if (timeRange === "30D") {
    startDate.setDate(now.getDate() - 30);
    previousEndDate = new Date(startDate);
    previousStartDate.setDate(previousEndDate.getDate() - 30);
  } else if (timeRange === "90D") {
    startDate.setDate(now.getDate() - 90);
    previousEndDate = new Date(startDate);
    previousStartDate.setDate(previousEndDate.getDate() - 90);
  } else if (timeRange === "1Y") {
    startDate.setFullYear(now.getFullYear() - 1);
    previousEndDate = new Date(startDate);
    previousStartDate.setFullYear(previousEndDate.getFullYear() - 1);
  }

  const startTs = Math.floor(startDate.getTime() / 1000);
  const prevStartTs = Math.floor(previousStartDate.getTime() / 1000);
  const prevEndTs = Math.floor(previousEndDate.getTime() / 1000);

  try {
    // 2. Fetch Live Stripe Data
    const [currentCharges, previousCharges, allSubs] = await Promise.all([
      fetchAll<any>(stripe.charges.list({ created: { gte: startTs }, limit: 100 })),
      fetchAll<any>(stripe.charges.list({ created: { gte: prevStartTs, lt: prevEndTs }, limit: 100 })),
      fetchAll<any>(stripe.subscriptions.list({ status: 'all', limit: 100 })) // Fetch all to calculate trends
    ]);

    // 3. Precise Revenue Calculation (Excluding Refunds)
    const calcRevenue = (charges: any[]) => 
      charges.filter((c: any) => c.status === 'succeeded' && !c.refunded)
             .reduce((sum: number, c: any) => sum + c.amount, 0) / 100;

    const currentRevenue = calcRevenue(currentCharges);
    const previousRevenue = calcRevenue(previousCharges);
    const revenueTrend = previousRevenue === 0 ? null : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    // 4. MRR trend. Headline is the shared live total. The baseline uses the
    // same product filter and monthly math, and leaves out past_due and trialing.
    const snap = await loadNeuroChiroMrr();
    const inputs = await loadMrrBaselineInputs();
    const headlineMrr = snap.ok ? snap.mrrUsd : null;
    const previousMrr = baselineMrrUsd(allSubs, prevEndTs, inputs);
    const mrrTrend = headlineMrr == null || previousMrr === 0 ? null : ((headlineMrr - previousMrr) / previousMrr) * 100;

    const currentActiveCount = snap.payingSubscriptions ?? 0;
    const previousActiveCount = baselinePayingCount(allSubs, prevEndTs, inputs);
    const activeSubscriptionsTrend = currentActiveCount - previousActiveCount;

    // 5. Failed Payments Accuracy
    const currentFailed = currentCharges.filter((c: any) => c.status === 'failed').length;
    const previousFailed = previousCharges.filter((c: any) => c.status === 'failed').length;
    const failedPaymentsTrend = currentFailed - previousFailed;

    // 6. Revenue Attribution (Real Data)
    const breakdownRaw: Record<string, number> = {
      "Doctor Subs": 0,
      "Student Network": 0,
      "LMS & Mastermind": 0,
      "Events": 0,
      "Other": 0
    };

    currentCharges.filter((c: any) => c.status === 'succeeded').forEach((c: any) => {
      const amt = c.amount / 100;
      const desc = (c.description || "").toLowerCase();
      
      if (amt >= 140 || desc.includes("doctor")) {
        breakdownRaw["Doctor Subs"] += amt;
      } else if ((amt >= 20 && amt <= 60) || desc.includes("student") || desc.includes("council") || desc.includes("network")) {
        breakdownRaw["Student Network"] += amt;
      } else if (amt > 400 || desc.includes("mastermind") || desc.includes("lms")) {
        breakdownRaw["LMS & Mastermind"] += amt;
      } else if (desc.includes("event") || desc.includes("seminar") || desc.includes("promo")) {
        breakdownRaw["Events"] += amt;
      } else {
        breakdownRaw["Other"] += amt;
      }
    });

    const totalCalculated = Object.values(breakdownRaw).reduce((a: number, b: number) => a + b, 0);
    const breakdown = Object.entries(breakdownRaw)
      .map(([label, val]: [string, number]) => {
        let color = "bg-blue-500";
        if (label === "Doctor Subs") color = "bg-neuro-orange";
        if (label === "Student Network") color = "bg-emerald-500";
        if (label === "LMS & Mastermind") color = "bg-purple-500";
        if (label === "Events") color = "bg-amber-500";
        
        return {
          label,
          value: totalCalculated > 0 ? Math.round((val / totalCalculated) * 100) : 0,
          color
        };
      })
      .filter(item => item.value > 0);

    return {
      success: true,
      data: {
        totalRevenue: currentRevenue,
        revenueTrend,
        mrr: headlineMrr,
        mrrOther: [],
        mrrTrend,
        activeSubscriptions: currentActiveCount,
        activeSubscriptionsTrend,
        failedPayments: currentFailed,
        failedPaymentsTrend,
        transactions: currentCharges.slice(0, 50).map((c: any) => ({
          id: c.id,
          user: c.billing_details?.name || "Customer",
          amount: formatMoney(typeof c.amount === 'number' ? c.amount : 0, typeof c.currency === 'string' ? c.currency : 'usd'),
          status: c.status === 'succeeded' ? 'Succeeded' : c.status === 'failed' ? 'Failed' : 'Other',
          date: new Date(c.created * 1000).toLocaleDateString(),
          type: c.description || "Subscription update"
        })),
        breakdown,
        projectedGrowth: headlineMrr == null ? null : headlineMrr * 12
      }
    };
  } catch (error) {
    console.error("Audit Error:", error);
    return { success: false, error: "Stripe connection error during audit." };
  }
}
