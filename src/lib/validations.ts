import { z } from "zod";

export const stripeCheckoutSchema = z.object({
  priceId: z.string().startsWith("price_"),
  userId: z.string().uuid().or(z.string().startsWith("mock_")), 
});

export const sessionSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.string(),
  fullName: z.string(),
  subscriptionStatus: z.enum(["active", "past_due", "canceled", "trialing", "free", "none"]).default("free"),
  expiresAt: z.number().optional(), // Unix timestamp
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum([
    "student_free",
    "student_paid",
    "doctor_non_member",
    "doctor_member",
    "patient",
    "admin",
    "regional_admin",
    "mastermind_member",
    "council_member"
  ]),
});
