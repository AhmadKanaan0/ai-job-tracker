"use client";

import { LineChart, Line, ResponsiveContainer, BarChart, Bar } from "recharts";

const lineData = [
  { value: 30 },
  { value: 40 },
  { value: 35 },
  { value: 50 },
  { value: 45 },
  { value: 60 },
  { value: 55 },
];

const barData = [
  { value: 20 },
  { value: 35 },
  { value: 25 },
  { value: 40 },
  { value: 30 },
  { value: 45 },
  { value: 35 },
  { value: 50 },
];

export function MiniLineChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={lineData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(82 100% 55%)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MiniBarChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={barData}>
        <Bar dataKey="value" fill="hsl(var(--muted-foreground))" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
