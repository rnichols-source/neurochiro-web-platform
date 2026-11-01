import { NextResponse } from "next/server";
import { revalidateShopifyCache } from "@/lib/shopify-revalidate";
import { SHOPIFY_REVALIDATE_TOPICS, shopifyWebhookHandle, verifyShopifyWebhook } from "@/lib/shopify-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[shopify-webhook] reason=missing_env");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  if (!verifyShopifyWebhook(rawBody, hmac, secret)) {
    console.error("[shopify-webhook] reason=bad_hmac");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic") ?? "";
  if (!SHOPIFY_REVALIDATE_TOPICS.has(topic)) {
    return NextResponse.json({ ok: true });
  }

  let handle: string | null = null;
  try {
    handle = shopifyWebhookHandle(JSON.parse(rawBody) as unknown);
  } catch {
    handle = null;
  }
  revalidateShopifyCache(handle ? [handle] : []);
  return NextResponse.json({ ok: true });
}
