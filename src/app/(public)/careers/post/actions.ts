"use server";

import { stripe, PLANS } from "@/lib/stripe";

type Duration = "30" | "60" | "90";

const PLAN_MAP: Record<Duration, keyof typeof PLANS> = {
  "30": "job_listing_30",
  "60": "job_listing_60",
  "90": "job_listing_90",
};

export async function createJobListingCheckout(
  _jobData: {
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
  _duration: Duration
) {
  // Legacy $49/$79/$99 sessions are no longer created. In-flight job_listing
  // webhooks still publish those posts. New posts go through /jobs/post.
  void _jobData;
  void _duration;
  void PLAN_MAP;
  void PLANS;
  void stripe;
  return { url: null as string | null };
}
