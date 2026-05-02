import type { AppCostRow, StoreRow } from "@/lib/database";

export type PriceChangeAlert = {
  type: "price-change";
  appName: string;
  shopDomain: string;
  oldMonthlyUsd: number;
  newMonthlyUsd: number;
  deltaUsd: number;
};

export type DuplicateAlert = {
  type: "duplicate-functionality";
  category: string;
  appNames: string[];
  estimatedSavingsUsd: number;
};

export type OptimizationSuggestion = {
  title: string;
  detail: string;
  potentialMonthlySavingsUsd: number;
};

export function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

export function buildInsights(stores: StoreRow[], apps: AppCostRow[]) {
  const activeApps = apps.filter((app) => app.active);
  const monthlySpendUsd = activeApps.reduce((sum, app) => sum + app.monthlyUsd, 0);
  const averageSpendPerStore = stores.length > 0 ? monthlySpendUsd / stores.length : 0;

  const priceChangeAlerts: PriceChangeAlert[] = activeApps
    .filter((app) => app.previousMonthlyUsd !== null && app.previousMonthlyUsd !== app.monthlyUsd)
    .map((app) => ({
      type: "price-change" as const,
      appName: app.appName,
      shopDomain: app.shopDomain,
      oldMonthlyUsd: app.previousMonthlyUsd ?? app.monthlyUsd,
      newMonthlyUsd: app.monthlyUsd,
      deltaUsd: app.monthlyUsd - (app.previousMonthlyUsd ?? app.monthlyUsd)
    }))
    .sort((a, b) => Math.abs(b.deltaUsd) - Math.abs(a.deltaUsd));

  const byCategory = new Map<string, AppCostRow[]>();
  for (const app of activeApps) {
    const existing = byCategory.get(app.category) ?? [];
    existing.push(app);
    byCategory.set(app.category, existing);
  }

  const duplicateAlerts: DuplicateAlert[] = [...byCategory.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([category, group]) => {
      const sortedByPrice = [...group].sort((a, b) => b.monthlyUsd - a.monthlyUsd);
      const estimatedSavings = sortedByPrice.slice(1).reduce((sum, app) => sum + app.monthlyUsd, 0) * 0.35;

      return {
        type: "duplicate-functionality" as const,
        category,
        appNames: sortedByPrice.map((app) => app.appName),
        estimatedSavingsUsd: Math.round(estimatedSavings * 100) / 100
      };
    })
    .sort((a, b) => b.estimatedSavingsUsd - a.estimatedSavingsUsd);

  const suggestions: OptimizationSuggestion[] = [];

  if (duplicateAlerts.length > 0) {
    const largest = duplicateAlerts[0];
    suggestions.push({
      title: `Consolidate ${largest.category} tools`,
      detail: `You have ${largest.appNames.length} apps in ${largest.category}. Keep the strongest performer and remove overlap.`,
      potentialMonthlySavingsUsd: largest.estimatedSavingsUsd
    });
  }

  const highCostApps = [...activeApps].sort((a, b) => b.monthlyUsd - a.monthlyUsd).slice(0, 3);
  if (highCostApps.length > 0) {
    const potential = highCostApps.reduce((sum, app) => sum + app.monthlyUsd * 0.15, 0);
    suggestions.push({
      title: "Negotiate top recurring subscriptions",
      detail: `Your top apps (${highCostApps.map((app) => app.appName).join(", ")}) account for most spend. Annual billing or agency rates usually reduce cost 10-20%.`,
      potentialMonthlySavingsUsd: Math.round(potential * 100) / 100
    });
  }

  if (priceChangeAlerts.some((alert) => alert.deltaUsd > 0)) {
    const totalIncrease = priceChangeAlerts
      .filter((alert) => alert.deltaUsd > 0)
      .reduce((sum, alert) => sum + alert.deltaUsd, 0);

    suggestions.push({
      title: "Audit recent price increases",
      detail: "Several apps increased pricing since your last sync. Confirm ROI or switch to lower-cost alternatives.",
      potentialMonthlySavingsUsd: Math.round(totalIncrease * 100) / 100
    });
  }

  return {
    totals: {
      storeCount: stores.length,
      appCount: activeApps.length,
      monthlySpendUsd: Math.round(monthlySpendUsd * 100) / 100,
      averageSpendPerStoreUsd: Math.round(averageSpendPerStore * 100) / 100
    },
    alerts: {
      priceChanges: priceChangeAlerts,
      duplicates: duplicateAlerts
    },
    suggestions,
    activeApps
  };
}
