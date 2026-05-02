import { formatMoney } from "@/lib/insights";

type OptimizationAlertProps = {
  title: string;
  detail: string;
  potentialMonthlySavingsUsd: number;
};

export function OptimizationAlert(props: OptimizationAlertProps) {
  return (
    <article className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#58a6ff]">Optimization Opportunity</p>
      <h3 className="mt-2 text-lg font-semibold text-[#f0f6fc]">{props.title}</h3>
      <p className="mt-2 text-sm text-[#8b949e]">{props.detail}</p>
      <div className="mt-4 inline-flex rounded-md bg-[#0d1117] px-3 py-1.5 text-sm font-semibold text-[#3fb950]">
        Potential savings: {formatMoney(props.potentialMonthlySavingsUsd)} / month
      </div>
    </article>
  );
}
