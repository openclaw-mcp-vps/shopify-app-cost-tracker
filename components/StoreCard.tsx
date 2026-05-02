import { formatMoney } from "@/lib/insights";

type StoreCardProps = {
  shopDomain: string;
  appCount: number;
  monthlySpendUsd: number;
  lastSyncedAt: string | null;
};

export function StoreCard(props: StoreCardProps) {
  const lastSync = props.lastSyncedAt
    ? new Date(props.lastSyncedAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : "Not synced yet";

  return (
    <article className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#e6edf3]">{props.shopDomain}</h3>
          <p className="mt-1 text-sm text-[#8b949e]">Last sync: {lastSync}</p>
        </div>
        <div className="rounded-lg bg-[#0d1117] px-3 py-1 text-xs text-[#58a6ff]">{props.appCount} apps</div>
      </div>
      <div className="mt-4 text-2xl font-semibold text-[#f0f6fc]">{formatMoney(props.monthlySpendUsd)}</div>
      <p className="mt-1 text-sm text-[#8b949e]">Estimated monthly spend</p>
    </article>
  );
}
