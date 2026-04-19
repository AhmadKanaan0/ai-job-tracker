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
  { name: "Sun", value: 18, highlight: false },
  { name: "Mon", value: 22, highlight: false },
  { name: "Tue", value: 15, highlight: false },
  { name: "Wed", value: 35, highlight: true },
  { name: "Thu", value: 28, highlight: false },
  { name: "Fri", value: 20, highlight: false },
  { name: "Sat", value: 12, highlight: false },
];

export function PatientLeadsChart() {
  return (
    <div className="rounded-2xl bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground">
          Patient Leads By Day
        </h3>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-primary">257,413</span>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis hide />
            <Bar dataKey="value" radius={[6, 6, 6, 6]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.highlight ? "hsl(82 100% 55%)" : "hsl(260 60% 60%)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
