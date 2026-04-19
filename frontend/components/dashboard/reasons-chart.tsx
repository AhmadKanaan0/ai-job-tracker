"use client";

import { MoreHorizontal } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

const data = [
  { name: "Sat", value1: 19.2, value2: 15.4 },
  { name: "Sun", value1: 15.4, value2: 24.6 },
  { name: "Mon", value1: 24.6, value2: 12.5 },
  { name: "Tue", value1: 12.5, value2: 19.2 },
  { name: "Wed", value1: 34.6, value2: 28.3 },
  { name: "Thu", value1: 28.3, value2: 22.1 },
];

export function ReasonsChart() {
  return (
    <div className="rounded-2xl bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground">
          Reasons Not Booked
        </h3>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="25%">
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Bar dataKey="value1" radius={[4, 4, 4, 4]} fill="hsl(260 60% 60%)" />
            <Bar dataKey="value2" radius={[4, 4, 4, 4]} fill="hsl(82 100% 55%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
