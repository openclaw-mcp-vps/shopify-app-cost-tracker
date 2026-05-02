import { NextRequest, NextResponse } from "next/server";
import {
  deleteStore,
  getStoreByDomain,
  listAccountAppCosts,
  listStores,
  syncStoreAppCosts
} from "@/lib/database";
import { fetchStoreAppCosts, normalizeShopDomain } from "@/lib/shopify";
import { ACCOUNT_COOKIE, PAID_COOKIE } from "@/lib/paywall";
import { buildInsights } from "@/lib/insights";

export const dynamic = "force-dynamic";

function getAccountContext(request: NextRequest) {
  const paid = request.cookies.get(PAID_COOKIE)?.value === "1";
  const accountId = request.cookies.get(ACCOUNT_COOKIE)?.value;

  if (!paid || !accountId) {
    return null;
  }

  return { accountId };
}

export async function GET(request: NextRequest) {
  const context = getAccountContext(request);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stores = await listStores(context.accountId);
  const apps = await listAccountAppCosts(context.accountId);
  const insights = buildInsights(stores, apps);

  const byStore = new Map<number, { appCount: number; monthlySpendUsd: number }>();
  for (const app of insights.activeApps) {
    const current = byStore.get(app.storeId) ?? { appCount: 0, monthlySpendUsd: 0 };
    current.appCount += 1;
    current.monthlySpendUsd += app.monthlyUsd;
    byStore.set(app.storeId, current);
  }

  return NextResponse.json({
    stores: stores.map((store) => ({
      ...store,
      appCount: byStore.get(store.id)?.appCount ?? 0,
      monthlySpendUsd: Math.round((byStore.get(store.id)?.monthlySpendUsd ?? 0) * 100) / 100
    }))
  });
}

export async function POST(request: NextRequest) {
  const context = getAccountContext(request);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  let action = "";
  let shopDomain = "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { action?: string; shopDomain?: string };
    action = body.action || "";
    shopDomain = body.shopDomain || "";
  } else {
    const form = await request.formData();
    action = String(form.get("action") || "");
    shopDomain = String(form.get("shopDomain") || "");
  }

  if (action === "delete") {
    const normalized = normalizeShopDomain(shopDomain);
    await deleteStore(context.accountId, normalized);
    return NextResponse.redirect(new URL("/stores?removed=1", request.url), { status: 303 });
  }

  if (action === "sync_all") {
    const stores = await listStores(context.accountId);

    for (const store of stores) {
      const costs = await fetchStoreAppCosts(store.shopDomain, store.accessToken);
      await syncStoreAppCosts(store.id, costs);
    }

    return NextResponse.redirect(new URL("/stores?synced=all", request.url), { status: 303 });
  }

  if (action !== "sync") {
    return NextResponse.json(
      {
        error: "Invalid action. Supported actions: sync, sync_all, delete"
      },
      { status: 400 }
    );
  }

  const normalizedShop = normalizeShopDomain(shopDomain);
  const store = await getStoreByDomain(context.accountId, normalizedShop);

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const costs = await fetchStoreAppCosts(store.shopDomain, store.accessToken);
  await syncStoreAppCosts(store.id, costs);

  if (contentType.includes("application/json")) {
    return NextResponse.json({ ok: true, syncedApps: costs.length });
  }

  return NextResponse.redirect(new URL(`/stores?synced=${encodeURIComponent(store.shopDomain)}`, request.url), {
    status: 303
  });
}
