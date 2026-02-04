"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface RevenueSplitChartProps {
  companyReserve: number;
  executivePool: number;
  strategicPools: number;
}

export default function RevenueSplitChart({ companyReserve, executivePool, strategicPools }: RevenueSplitChartProps) {
  const data = [
    { name: "Company Reserve (50%)", value: companyReserve, percentage: 50 },
    { name: "Executive Pool (30%)", value: executivePool, percentage: 30 },
    { name: "Strategic Pools (20%)", value: strategicPools, percentage: 20 },
  ];

  const COLORS = ["#3b82f6", "#8b5cf6", "#f97316"];

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
        Revenue Allocation (50/30/20)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) => value ? `₦${value.toLocaleString()}` : `₦0`}
            contentStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-sm text-slate-700 dark:text-slate-200">
                {value}: ₦{entry.payload.value.toLocaleString()}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
