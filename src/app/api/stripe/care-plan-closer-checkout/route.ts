import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const isBeta = body.type === "beta";

    const setupAmount = isBeta ? 49700 : 99700; // $497 beta, $997 full
    const monthlyAmount = isBeta ? 9700 : 19700; // $97/mo beta, $197/mo full
    const label = isBeta ? "Care Plan Closer — Beta Founding Member" : "Care Plan Closer";

    // Create checkout for the setup fee (one-time)
    // Monthly subscription will be set up after the build calls
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${label} — Setup Fee`,
              description: isBeta
                ? "Includes 2 x 45-min build calls with Dr. Ray. Beta price locked forever."
                : "Includes 2 x 45-min build calls with Dr. Ray.",
            },
            unit_amount: setupAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co'}/care-plan-closer/beta/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co'}/care-plan-closer/beta`,
      metadata: {
        type: "care_plan_closer",
        tier: isBeta ? "beta" : "full",
        monthlyAmount: monthlyAmount.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Care Plan Closer Checkout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
