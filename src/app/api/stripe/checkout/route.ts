import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { stripeCheckoutSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Validate Input (Security Check)
    const result = stripeCheckoutSchema.safeParse(body);
    if (!result.success) {
      console.warn(`[SECURITY AUDIT] Invalid checkout attempt: ${result.error.message}`);
      return NextResponse.json({ error: "Invalid Request Payload", details: result.error.format() }, { status: 400 });
    }

    const { priceId, userId } = result.data;

    // 2. Create Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/billing?canceled=true`,
      metadata: {
        userId,
        planId: priceId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
