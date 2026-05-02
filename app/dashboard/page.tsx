import { AppNav } from "@/components/AppNav";
import { AppCostTable } from "@/components/AppCostTable";
import { OptimizationAlert } from "@/components/OptimizationAlert";
import { SpendByStoreChart } from "@/components/SpendByStoreChart";
import { listAccountAppCosts, listStores } from "@/lib/database";
import { buildInsights, formatMoney } from "@/lib/insights";
import { getAccountIdFromCookie } from "@/lib/paywall";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const accountId = await getAccountIdFromCookie();

  if (!accountId) {
    redirect("/");
  }

  const [stores, apps] = await Promise.all([listStores(accountId), listAccountAppCosts(accountId)]);
  const insights = buildInsights(stores, apps);

  const byStore = new Map<number, { domain: string; monthlySpendUsd: number }>();
  for (const app of insights.activeApps) {
    const current = byStore.get(app.storeId) || { domain: app.shopDomain, monthlySpendUsd: 0 };
    current.monthlySpendUsd += app.monthlyUsd;
    byStore.set(app.storeId, current);
  }

  const chartData = [...byStore.values()]
    .map((item) => ({
      store: item.domain.replace(".myshopify.com", ""),
      monthlySpendUsd: Math.round(item.monthlySpendUsd * 100) / 100
    }))
    .sort((a, b) => b.monthlySpendUsd - a.monthlySpendUsd)
    .slice(0, 12);

  const topApps = [...insights.activeApps].sort((a, b) => b.monthlyUsd - a.monthlyUsd).slice(0, 20);

  return (
    <main className="min-h-screen">
      <AppNav />
      <section className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#f0f6fc]">Cost Control Dashboard</h1>
            <p className="mt-1 text-sm text-[#8b949e]">
              Consolidated app subscription spend, change detection, and optimization recommendations.
            </p>
          </div>
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

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
            <p className="text-sm text-[#8b949e]">Monthly Spend</p>
            <p className="mt-2 text-2xl font-semibold text-[#f0f6fc]">{formatMoney(insights.totals.monthlySpendUsd)}</p>
          </div>
          <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
            <p className="text-sm text-[#8b949e]">Connected Stores</p>
            <p className="mt-2 text-2xl font-semibold text-[#f0f6fc]">{insights.totals.storeCount}</p>
          </div>
          <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
            <p className="text-sm text-[#8b949e]">Tracked Paid Apps</p>
            <p className="mt-2 text-2xl font-semibold text-[#f0f6fc]">{insights.totals.appCount}</p>
          </div>
          <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
            <p className="text-sm text-[#8b949e]">Avg Spend / Store</p>
            <p className="mt-2 text-2xl font-semibold text-[#f0f6fc]">
              {formatMoney(insights.totals.averageSpendPerStoreUsd)}
            </p>
          </div>
        </div>

        <div className="mt-8">{chartData.length > 0 ? <SpendByStoreChart data={chartData} /> : null}</div>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          {insights.suggestions.length > 0 ? (
            insights.suggestions.map((suggestion) => (
              <OptimizationAlert
                key={suggestion.title}
                title={suggestion.title}
                detail={suggestion.detail}
                potentialMonthlySavingsUsd={suggestion.potentialMonthlySavingsUsd}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[#30363d] bg-[#161b22] p-6 text-sm text-[#8b949e]">
              No optimization alerts yet. Sync store data to generate cost recommendations.
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-[#f0f6fc]">Top App Costs</h2>
          <AppCostTable apps={topApps} />
        </section>
      </section>
    </main>
  );
}
