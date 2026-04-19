"use client";

import { Award, Calendar, TrendingUp } from "lucide-react";

const agents = [
  {
    metric: "New Leads Answered",
    name: "Kelsey",
    value: "27%",
    icon: Award,
  },
  {
    metric: "Most Appts Booked",
    name: "Marsha",
    value: "22%",
    icon: Calendar,
  },
  {
    metric: "Highest Conv. Rate",
    name: "Marsha",
    value: "88%",
    icon: TrendingUp,
  },
];

export function TopAgents() {
  return (
    <div className="rounded-2xl bg-card p-5">
      <h3 className="mb-4 font-semibold text-card-foreground">
        Top Performing Agents
      </h3>

      <div className="space-y-4">
        {agents.map((agent) => (
          <div
            key={agent.metric}
            className="flex items-center gap-3 rounded-xl bg-muted p-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card">
              <agent.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-card-foreground">
                {agent.metric}
              </div>
              <div className="text-xs text-muted-foreground">{agent.name}</div>
            </div>
            <div className="text-sm font-semibold text-primary">
              {agent.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
