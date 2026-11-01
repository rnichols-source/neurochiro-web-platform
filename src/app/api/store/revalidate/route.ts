import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { revalidateShopifyCache } from "@/lib/shopify-revalidate";
import { getProducts } from "@/lib/shopify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secretsMatch(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}

async function refresh(request: Request) {
  const expected = process.env.STORE_REVALIDATE_SECRET;
  const url = new URL(request.url);
  const provided = request.headers.get("x-revalidate-secret") ?? url.searchParams.get("secret") ?? "";
  if (!expected || !secretsMatch(provided, expected)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const catalog = await getProducts({ cache: "no-store" });
  if (!catalog.ok) {
    revalidateShopifyCache();
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  revalidateShopifyCache(catalog.products.map((product) => product.handle));
  return NextResponse.json({ ok: true, products: catalog.products.length });
}

export async function GET(request: Request) {
  return refresh(request);
}

export async function POST(request: Request) {
  return refresh(request);
}
