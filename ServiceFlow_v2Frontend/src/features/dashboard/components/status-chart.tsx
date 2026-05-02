"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { CountByField } from "@shared/types";

const COLORS = ["#f59e0b", "#3b82f6", "#22c55e", "#6b7280", "#ef4444"];

interface StatusChartProps {
  data: CountByField[];
}

// Renders the status distribution donut chart.
export function StatusChart({ data }: StatusChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={85}
          dataKey="count"
          nameKey="label"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
