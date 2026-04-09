"use server";

import { stripe, PLANS } from "@/lib/stripe";

type Duration = "30" | "60" | "90";

const PLAN_MAP: Record<Duration, keyof typeof PLANS> = {
  "30": "job_listing_30",
  "60": "job_listing_60",
  "90": "job_listing_90",
};

export async function createJobListingCheckout(
  jobData: {
    title: string;
    description: string;
    category: string;
    employment_type: string;
    salary_min: number;
    salary_max: number;
    city: string;
    state: string;
    contact_email: string;
  },
  duration: Duration
) {
  const planKey = PLAN_MAP[duration];
  const plan = PLANS[planKey];

  if (!plan || !("oneTime" in plan)) {
    throw new Error("Invalid plan selected");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price: plan.oneTime.priceId || undefined,
        quantity: 1,
        ...(plan.oneTime.priceId
          ? {}
          : {
              price_data: {
                currency: "usd",
                product_data: { name: plan.name },
                unit_amount: plan.oneTime.price * 100,
              },
            }),
      },
    ],
    metadata: {
      type: "job_listing",
      duration,
      title: jobData.title,
      description: jobData.description.slice(0, 450),
      category: jobData.category,
      employment_type: jobData.employment_type,
      salary_min: String(jobData.salary_min || 0),
      salary_max: String(jobData.salary_max || 0),
      city: jobData.city,
      state: jobData.state,
      contact_email: jobData.contact_email,
    },
    customer_email: jobData.contact_email,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/careers?posted=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/careers/post`,
  });

  return { url: session.url };
}
