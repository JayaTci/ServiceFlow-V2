"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTheme } from "next-themes";
import type { CountByField } from "@shared/types";

const COLORS = [
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
];

interface SimpleBarChartProps {
  data: CountByField[];
  color?: string;
}

// Renders a compact horizontal bar chart for count-by-field datasets.
export function SimpleBarChart({ data, color }: SimpleBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const cursorColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: tickColor }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: tickColor }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip cursor={{ fill: cursorColor }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
          {data.map((_, i) => (
            <Cell key={i} fill={color ?? COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
