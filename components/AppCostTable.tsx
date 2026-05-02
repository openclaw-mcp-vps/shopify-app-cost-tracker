import { formatMoney } from "@/lib/insights";
import type { AppCostRow } from "@/lib/database";

type AppCostTableProps = {
  apps: AppCostRow[];
};

export function AppCostTable({ apps }: AppCostTableProps) {
  if (apps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#30363d] bg-[#161b22] p-8 text-center text-[#8b949e]">
        No app subscriptions found yet. Connect a store and run sync to populate costs.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#30363d]">
      <table className="min-w-full divide-y divide-[#30363d] bg-[#161b22] text-sm">
        <thead className="bg-[#0d1117] text-left text-xs uppercase tracking-wide text-[#8b949e]">
          <tr>
            <th className="px-4 py-3">App</th>
            <th className="px-4 py-3">Store</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3 text-right">Monthly (USD)</th>
            <th className="px-4 py-3 text-right">Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#30363d] text-[#c9d1d9]">
          {apps.map((app) => {
            const delta = app.previousMonthlyUsd === null ? null : app.monthlyUsd - app.previousMonthlyUsd;

            return (
              <tr key={`${app.storeId}-${app.appGid}`}>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium text-[#f0f6fc]">{app.appName}</p>
                  <p className="text-xs text-[#8b949e]">{app.developerName || "Unknown developer"}</p>
                </td>
                <td className="px-4 py-3 align-top text-[#8b949e]">{app.shopDomain}</td>
                <td className="px-4 py-3 align-top">
                  <span className="rounded bg-[#21262d] px-2 py-1 text-xs">{app.category}</span>
                </td>
                <td className="px-4 py-3 align-top text-[#8b949e]">{app.planName || "Standard"}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#e6edf3]">{formatMoney(app.monthlyUsd)}</td>
                <td className="px-4 py-3 text-right">
                  {delta === null ? (
                    <span className="text-xs text-[#8b949e]">New</span>
                  ) : (
                    <span
                      className={`text-xs font-semibold ${delta > 0 ? "text-[#ff7b72]" : delta < 0 ? "text-[#3fb950]" : "text-[#8b949e]"}`}
                    >
                      {delta > 0 ? "+" : ""}
                      {formatMoney(delta)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
