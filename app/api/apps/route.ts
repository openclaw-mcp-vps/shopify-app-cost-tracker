import { NextRequest, NextResponse } from "next/server";
import { listAccountAppCosts, listStores } from "@/lib/database";
import { buildInsights } from "@/lib/insights";
import { ACCOUNT_COOKIE, PAID_COOKIE } from "@/lib/paywall";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const paid = request.cookies.get(PAID_COOKIE)?.value === "1";
  const accountId = request.cookies.get(ACCOUNT_COOKIE)?.value;

  if (!paid || !accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stores = await listStores(accountId);
  const apps = await listAccountAppCosts(accountId);

  return NextResponse.json(buildInsights(stores, apps));
}
