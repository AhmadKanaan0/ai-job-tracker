"use client";

import { MoreHorizontal } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "Direct", value: 74.9, color: "hsl(82 100% 55%)" },
  { name: "Facebook", value: 58.8, color: "hsl(30 100% 60%)" },
  { name: "Organic Search", value: 73.7, color: "hsl(260 60% 60%)" },
  { name: "Instagram", value: 50.6, color: "hsl(180 60% 50%)" },
  { name: "Paid Search", value: 88.5, color: "hsl(340 70% 60%)" },
];

export function MarketingChannels() {
  return (
    <div className="rounded-2xl bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground">
          Top 5 Marketing Channels
        </h3>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative h-36 w-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground">Leads</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="mb-3 text-sm text-muted-foreground">Total Leads</div>
          {data.map((channel) => (
            <div key={channel.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: channel.color }}
                />
                <span className="text-muted-foreground">{channel.name}</span>
              </div>
              <span className="font-medium text-card-foreground">
                ${channel.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
