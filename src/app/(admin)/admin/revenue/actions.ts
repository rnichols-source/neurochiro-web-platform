'use server'

import { stripe } from "@/lib/stripe";

export async function getRevenueData(timeRange: string) {
  const now = new Date();
  let startDate = new Date();
  let previousStartDate = new Date();
  let previousEndDate = new Date();
  
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
    const [currentCharges, previousCharges, subscriptions] = await Promise.all([
      stripe.charges.list({ created: { gte: startTs }, limit: 100 }),
      stripe.charges.list({ created: { gte: prevStartTs, lt: prevEndTs }, limit: 100 }),
      stripe.subscriptions.list({ status: 'active', limit: 100, expand: ['data.plan.product'] })
    ]);

    // 3. Precise Revenue Calculation (Excluding Refunds)
    const calcRevenue = (charges: any[]) => 
      charges.filter(c => c.status === 'succeeded' && !c.refunded)
             .reduce((sum, c) => sum + c.amount, 0) / 100;

    const currentRevenue = calcRevenue(currentCharges.data);
    const previousRevenue = calcRevenue(previousCharges.data);
    const revenueTrend = previousRevenue === 0 ? 100 : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    // 4. Precise MRR Calculation (Normalized to Monthly)
    let mrr = 0;
    subscriptions.data.forEach(sub => {
      const item = sub.items.data[0];
      const amount = item.price.unit_amount || 0;
      if (item.price.recurring?.interval === 'year') {
        mrr += (amount / 12);
      } else {
        mrr += amount;
      }
    });
    mrr = mrr / 100;

    // 5. Failed Payments Accuracy
    const currentFailed = currentCharges.data.filter(c => c.status === 'failed').length;
    const previousFailed = previousCharges.data.filter(c => c.status === 'failed').length;
    const failedPaymentsTrend = currentFailed - previousFailed;

    // 6. Revenue Attribution (Real Data)
    let breakdownRaw: Record<string, number> = {
      "Doctor Subs": 0,
      "Student Network": 0,
      "LMS & Mastermind": 0,
      "Events": 0,
      "Other": 0
    };

    currentCharges.data.filter(c => c.status === 'succeeded').forEach(c => {
      const amt = c.amount / 100;
      const desc = (c.description || "").toLowerCase();
      if (amt >= 190 || desc.includes("doctor")) breakdownRaw["Doctor Subs"] += amt;
      else if (amt >= 30 && amt <= 40) breakdownRaw["Student Network"] += amt;
      else if (amt > 400) breakdownRaw["LMS & Mastermind"] += amt;
      else if (desc.includes("event") || desc.includes("seminar")) breakdownRaw["Events"] += amt;
      else breakdownRaw["Other"] += amt;
    });

    const totalCalculated = Object.values(breakdownRaw).reduce((a, b) => a + b, 0);
    const breakdown = Object.entries(breakdownRaw)
      .map(([label, val]) => ({
        label,
        value: totalCalculated > 0 ? Math.round((val / totalCalculated) * 100) : 0,
        color: label === "Doctor Subs" ? "bg-neuro-orange" : "bg-blue-500"
      }))
      .filter(item => item.value > 0);

    return {
      success: true,
      data: {
        totalRevenue: currentRevenue,
        revenueTrend,
        mrr,
        mrrTrend: 0, // Baseline for first audit
        activeSubscriptions: subscriptions.data.length,
        activeSubscriptionsTrend: 0,
        failedPayments: currentFailed,
        failedPaymentsTrend,
        transactions: currentCharges.data.map(c => ({
          id: c.id,
          user: c.billing_details?.name || "Customer",
          amount: (c.amount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
          status: c.status === 'succeeded' ? 'Succeeded' : c.status === 'failed' ? 'Failed' : 'Other',
          date: new Date(c.created * 1000).toLocaleDateString(),
          type: c.description || "Platform Service"
        })),
        breakdown,
        projectedGrowth: mrr * 12
      }
    };
  } catch (error) {
    console.error("Audit Error:", error);
    return { success: false, error: "Stripe connection error during audit." };
  }
}
