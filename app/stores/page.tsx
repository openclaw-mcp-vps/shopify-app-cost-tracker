import { AppNav } from "@/components/AppNav";
import { StoreCard } from "@/components/StoreCard";
import { listAccountAppCosts, listStores } from "@/lib/database";
import { getAccountIdFromCookie } from "@/lib/paywall";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const accountId = await getAccountIdFromCookie();

  if (!accountId) {
    redirect("/");
  }

  const [stores, apps] = await Promise.all([listStores(accountId), listAccountAppCosts(accountId)]);

  const byStore = new Map<number, { appCount: number; monthlySpendUsd: number }>();
  for (const app of apps.filter((item) => item.active)) {
    const current = byStore.get(app.storeId) || { appCount: 0, monthlySpendUsd: 0 };
    current.appCount += 1;
    current.monthlySpendUsd += app.monthlyUsd;
    byStore.set(app.storeId, current);
  }

  return (
    <main className="min-h-screen">
      <AppNav />
      <section className="mx-auto w-full max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold text-[#f0f6fc]">Store Connections</h1>
        <p className="mt-1 text-sm text-[#8b949e]">
          Connect Shopify stores, sync subscription costs, and keep your app inventory accurate.
        </p>

        <div className="mt-8 grid gap-4 rounded-2xl border border-[#30363d] bg-[#161b22] p-6 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-[#e6edf3]">Connect a new store</h2>
            <p className="mt-2 text-sm text-[#8b949e]">
              Enter a store domain like <span className="text-[#c9d1d9]">agency-client.myshopify.com</span> to start Shopify OAuth.
            </p>
          </div>
          <form action="/api/auth/shopify" method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <input
              type="text"
              name="shop"
              required
              placeholder="client-store.myshopify.com"
              className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-4 py-2 text-sm text-[#e6edf3] outline-none placeholder:text-[#6e7681] focus:border-[#58a6ff] sm:max-w-xs"
            />
            <button
              type="submit"
              className="rounded-md bg-[#2ea043] px-4 py-2 text-sm font-semibold text-[#f0fff4] transition hover:bg-[#3fb950]"
            >
              Connect Store
            </button>
          </form>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <form action="/api/stores" method="post">
            <input type="hidden" name="action" value="sync_all" />
            <button
              type="submit"
              className="rounded-md border border-[#30363d] px-4 py-2 text-sm font-semibold text-[#c9d1d9] transition hover:border-[#58a6ff] hover:text-[#58a6ff]"
            >
              Sync All Stores
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {stores.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#30363d] bg-[#161b22] p-8 text-sm text-[#8b949e]">
              No connected stores yet. Add your first store to begin app cost tracking.
            </div>
          ) : (
            stores.map((store) => {
              const metrics = byStore.get(store.id) || { appCount: 0, monthlySpendUsd: 0 };

              return (
                <div key={store.id} className="space-y-3">
                  <StoreCard
                    shopDomain={store.shopDomain}
                    appCount={metrics.appCount}
                    monthlySpendUsd={metrics.monthlySpendUsd}
                    lastSyncedAt={store.lastSyncedAt}
                  />
                  <div className="flex gap-2">
                    <form action="/api/stores" method="post" className="flex-1">
                      <input type="hidden" name="action" value="sync" />
                      <input type="hidden" name="shopDomain" value={store.shopDomain} />
                      <button
                        type="submit"
                        className="w-full rounded-md border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-[#c9d1d9] transition hover:border-[#58a6ff] hover:text-[#58a6ff]"
                      >
                        Sync
                      </button>
                    </form>
                    <form action="/api/stores" method="post" className="flex-1">
                      <input type="hidden" name="action" value="delete" />
                      <input type="hidden" name="shopDomain" value={store.shopDomain} />
                      <button
                        type="submit"
                        className="w-full rounded-md border border-[#da3633] bg-[#161b22] px-3 py-2 text-sm text-[#ff7b72] transition hover:bg-[#2d1117]"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
