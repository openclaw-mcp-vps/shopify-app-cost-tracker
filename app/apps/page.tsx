import { AppNav } from "@/components/AppNav";
import { AppCostTable } from "@/components/AppCostTable";
import { listAccountAppCosts, listStores } from "@/lib/database";
import { buildInsights, formatMoney } from "@/lib/insights";
import { getAccountIdFromCookie } from "@/lib/paywall";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppsPage() {
  const accountId = await getAccountIdFromCookie();

  if (!accountId) {
    redirect("/");
  }

  const [stores, apps] = await Promise.all([listStores(accountId), listAccountAppCosts(accountId)]);
  const insights = buildInsights(stores, apps);

  const categoryTotals = new Map<string, number>();
  for (const app of insights.activeApps) {
    const current = categoryTotals.get(app.category) || 0;
    categoryTotals.set(app.category, current + app.monthlyUsd);
  }

  const sortedCategories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <main className="min-h-screen">
      <AppNav />
      <section className="mx-auto w-full max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold text-[#f0f6fc]">App Subscriptions</h1>
        <p className="mt-1 text-sm text-[#8b949e]">
          Full list of tracked subscriptions with monthly normalized cost and change history.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {sortedCategories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#30363d] bg-[#161b22] p-6 text-sm text-[#8b949e] md:col-span-3">
              No app subscriptions synced yet.
            </div>
          ) : (
            sortedCategories.slice(0, 6).map(([category, spend]) => (
              <article key={category} className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
                <p className="text-xs uppercase tracking-wide text-[#8b949e]">{category}</p>
                <p className="mt-2 text-2xl font-semibold text-[#f0f6fc]">{formatMoney(spend)}</p>
                <p className="mt-1 text-sm text-[#8b949e]">Monthly spend in this category</p>
              </article>
            ))
          )}
        </div>

        <div className="mt-8">
          <AppCostTable apps={insights.activeApps} />
        </div>
      </section>
    </main>
  );
}
