"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ExecutiveBreakdownChartProps {
  shareholders: Array<{
    role: string;
    percentage: number;
    User?: { name: string | null } | null;
    totalEarned?: number;
  }>;
}

export default function ExecutiveBreakdownChart({ shareholders }: ExecutiveBreakdownChartProps) {
  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#6366f1", "#14b8a6"];

  const data = shareholders.map((sh) => ({
    name: sh.role.replace(/_/g, " "),
    value: Number(sh.percentage),
    assigned: sh.User?.name || "Unassigned",
    earned: Number((sh as any).totalEarned || 0),
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
        Executive Pool Breakdown (30%)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            label={({ value }) => `${value}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(((value: number | undefined, name: string | undefined, props: any) => [
              value ? `${value}% - ${props.payload.assigned}` : "0%",
              "Share",
            ]) as any)}
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
            formatter={(value) => (
              <span className="text-sm text-slate-700 dark:text-slate-200">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
