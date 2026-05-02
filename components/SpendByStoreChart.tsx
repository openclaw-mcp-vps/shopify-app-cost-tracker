"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

type SpendByStoreChartProps = {
  data: Array<{ store: string; monthlySpendUsd: number }>;
};

export function SpendByStoreChart({ data }: SpendByStoreChartProps) {
  return (
    <div className="h-72 w-full rounded-xl border border-[#30363d] bg-[#161b22] p-4">
      <p className="mb-2 text-sm text-[#8b949e]">Monthly spend by store</p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 8 }}>
          <XAxis dataKey="store" tick={{ fill: "#8b949e", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8b949e", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0d1117",
              border: "1px solid #30363d",
              color: "#e6edf3",
              borderRadius: "8px"
            }}
            formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Monthly Spend"]}
          />
          <Bar dataKey="monthlySpendUsd" fill="#58a6ff" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
