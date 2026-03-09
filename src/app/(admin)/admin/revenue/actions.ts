'use server'

import { stripe, PLANS } from "@/lib/stripe";

export async function getRevenueData(timeRange: string) {
  // Determine date ranges based on timeRange
  const now = new Date();
  let startDate = new Date();
  let previousStartDate = new Date();
  let previousEndDate = new Date();
  
  if (timeRange === "7D") {
    startDate.setDate(now.getDate() - 7);
    previousStartDate.setDate(startDate.getDate() - 7);
    previousEndDate = new Date(startDate);
  } else if (timeRange === "30D") {
    startDate.setDate(now.getDate() - 30);
    previousStartDate.setDate(startDate.getDate() - 30);
    previousEndDate = new Date(startDate);
  } else if (timeRange === "90D") {
    startDate.setDate(now.getDate() - 90);
    previousStartDate.setDate(startDate.getDate() - 90);
    previousEndDate = new Date(startDate);
  } else if (timeRange === "1Y") {
    startDate.setFullYear(now.getFullYear() - 1);
    previousStartDate.setFullYear(startDate.getFullYear() - 1);
    previousEndDate = new Date(startDate);
  } else {
    // Default 30D
    startDate.setDate(now.getDate() - 30);
    previousStartDate.setDate(startDate.getDate() - 30);
    previousEndDate = new Date(startDate);
  }

  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const previousStartTimestamp = Math.floor(previousStartDate.getTime() / 1000);
  const previousEndTimestamp = Math.floor(previousEndDate.getTime() / 1000);

  try {
    // Fetch charges for the current period
    const currentChargesResult = await stripe.charges.list({
      created: { gte: startTimestamp },
      limit: 100, // For a real large-scale app, we would paginate. For now, max 100 recent.
    });

    // Fetch charges for previous period (for trend calculation)
    const previousChargesResult = await stripe.charges.list({
      created: { gte: previousStartTimestamp, lt: previousEndTimestamp },
      limit: 100,
    });

    const currentCharges = currentChargesResult.data;
    const previousCharges = previousChargesResult.data;

    // 1. Total Revenue Calculation
    const currentRevenue = currentCharges
      .filter(c => c.status === 'succeeded' && !c.refunded)
      .reduce((sum, c) => sum + c.amount, 0) / 100;

    const previousRevenue = previousCharges
      .filter(c => c.status === 'succeeded' && !c.refunded)
      .reduce((sum, c) => sum + c.amount, 0) / 100;

    const revenueTrend = previousRevenue === 0 
      ? 100 
      : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    // 2. Failed Payments Calculation
    const currentFailed = currentCharges.filter(c => c.status === 'failed').length;
    const previousFailed = previousCharges.filter(c => c.status === 'failed').length;
    const failedTrend = previousFailed === 0 ? currentFailed : currentFailed - previousFailed; // Absolute change

    // 3. Subscriptions Calculation
    const subsResult = await stripe.subscriptions.list({
      status: 'active',
      limit: 100
    });
    
    const activeSubscriptions = subsResult.data.length;
    
    // MRR Calculation
    let mrr = 0;
    subsResult.data.forEach(sub => {
      const price = sub.items.data[0].price;
      if (price.unit_amount) {
        if (price.recurring?.interval === 'month') {
          mrr += price.unit_amount;
        } else if (price.recurring?.interval === 'year') {
          mrr += price.unit_amount / 12;
        }
      }
    });
    mrr = mrr / 100;

    // Assume active subscriptions count wasn't cached historically for simplicity,
    // we'll leave its trend blank or 0 for now. Same with MRR trend.

    // 4. Recent Transactions
    const recentTransactions = currentCharges.slice(0, 50).map(c => {
      let type = "Payment";
      if (c.description) type = c.description;
      else if ((c as any).invoice) type = "Subscription Renewal";
      
      return {
        id: c.id,
        user: c.billing_details?.name || c.customer?.toString() || "Guest",
        amount: (c.amount / 100).toLocaleString('en-US', { style: 'currency', currency: c.currency.toUpperCase() }),
        status: c.status === 'succeeded' ? 'Succeeded' : c.status === 'failed' ? 'Failed' : c.refunded ? 'Refunded' : c.status,
        date: new Date(c.created * 1000).toLocaleString(),
        timestamp: c.created * 1000,
        type: type,
      };
    });

    // 5. Revenue Breakdown (Simple mock attribution based on exact amounts matching our plans if no description)
    // Actually we can map by known prices or just provide some logic
    let breakdown = {
      doctorSubscriptions: 0,
      studentSubscriptions: 0,
      lmsPrograms: 0,
      events: 0,
      other: 0
    };

    currentCharges.filter(c => c.status === 'succeeded').forEach(c => {
      const amount = c.amount / 100;
      if (amount === 199 || amount === 1990) breakdown.doctorSubscriptions += amount;
      else if (amount === 35 || amount === 350) breakdown.studentSubscriptions += amount;
      else if (amount === 2500 || amount === 500) breakdown.lmsPrograms += amount;
      else if (amount === 49 || amount === 99) breakdown.events += amount;
      else breakdown.other += amount;
    });

    const totalCalculated = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const breakdownPercentages = totalCalculated === 0 ? [] : [
      { label: "Doctor Subscriptions", value: Math.round((breakdown.doctorSubscriptions / totalCalculated) * 100), color: "bg-neuro-orange" },
      { label: "Student Network", value: Math.round((breakdown.studentSubscriptions / totalCalculated) * 100), color: "bg-emerald-500" },
      { label: "LMS & Mastermind", value: Math.round((breakdown.lmsPrograms / totalCalculated) * 100), color: "bg-blue-500" },
      { label: "Events & Promos", value: Math.round((breakdown.events / totalCalculated) * 100), color: "bg-purple-500" },
      { label: "Other", value: Math.round((breakdown.other / totalCalculated) * 100), color: "bg-gray-500" }
    ].filter(item => item.value > 0);

    return {
      success: true,
      data: {
        totalRevenue: currentRevenue,
        revenueTrend: revenueTrend,
        mrr: mrr,
        mrrTrend: 0, // Mock trend for MRR
        activeSubscriptions: activeSubscriptions,
        activeSubscriptionsTrend: 0,
        failedPayments: currentFailed,
        failedPaymentsTrend: failedTrend,
        transactions: recentTransactions,
        breakdown: breakdownPercentages,
        projectedGrowth: mrr * 12 // Simple projection
      }
    };
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    return {
      success: false,
      error: "Failed to load financial data. Ensure Stripe API keys are configured."
    };
  }
}
