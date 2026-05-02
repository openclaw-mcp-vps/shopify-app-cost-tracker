import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { deleteStoreByDomain } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const shopifySecret = process.env.SHOPIFY_API_SECRET;
  if (!shopifySecret) {
    return NextResponse.json({ error: "SHOPIFY_API_SECRET is missing" }, { status: 500 });
  }

  const rawBody = await request.text();
  const webhookHmac = request.headers.get("x-shopify-hmac-sha256") || "";

  const digest = crypto.createHmac("sha256", shopifySecret).update(rawBody, "utf8").digest("base64");

  const digestBuffer = Buffer.from(digest, "utf8");
  const hmacBuffer = Buffer.from(webhookHmac, "utf8");

  if (digestBuffer.length !== hmacBuffer.length || !crypto.timingSafeEqual(digestBuffer, hmacBuffer)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic") || "";

  if (topic === "app/uninstalled") {
    try {
      const payload = JSON.parse(rawBody) as { myshopify_domain?: string; domain?: string };
      const shopDomain = payload.myshopify_domain || payload.domain;
      if (shopDomain) {
        await deleteStoreByDomain(shopDomain.toLowerCase());
      }
    } catch {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }
  }

  return NextResponse.json({ received: true });
}
