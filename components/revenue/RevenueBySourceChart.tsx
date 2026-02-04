"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface RevenueBySourceChartProps {
  data: Array<{
    source: string;
    amount: number;
    count: number;
  }>;
}

export default function RevenueBySourceChart({ data }: RevenueBySourceChartProps) {
  const chartData = data.map((item) => ({
    name: item.source.replace(/_/g, " "),
    amount: Number(item.amount),
    transactions: item.count,
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
        Revenue by Source
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748b", fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip
            formatter={(value: number | undefined) => value ? [`₦${value.toLocaleString()}`, "Amount"] : [`₦0`, "Amount"]}
            labelStyle={{ color: "#1f2937" }}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
