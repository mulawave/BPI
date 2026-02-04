"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays } from "date-fns";

interface RevenueTrendChartProps {
  data: Array<{
    date: Date;
    total: number;
    companyReserve: number;
    executivePool: number;
    strategicPools: number;
  }>;
}

export default function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "MMM dd"),
    total: Number(item.total),
    company: Number(item.companyReserve),
    executive: Number(item.executivePool),
    strategic: Number(item.strategicPools),
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
        Revenue Trend (Last 30 Days)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip
            formatter={(((value: number | undefined) => value ? [`₦${value.toLocaleString()}`, ""] : [`₦0`, ""]) as any)}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Total Revenue"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="company"
            stroke="#10b981"
            strokeWidth={2}
            name="Company (50%)"
            dot={{ r: 3 }}
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="executive"
            stroke="#8b5cf6"
            strokeWidth={2}
            name="Executive (30%)"
            dot={{ r: 3 }}
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="strategic"
            stroke="#f97316"
            strokeWidth={2}
            name="Strategic (20%)"
            dot={{ r: 3 }}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
