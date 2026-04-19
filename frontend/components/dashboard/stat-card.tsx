"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  chart?: React.ReactNode;
  highlighted?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  icon,
  chart,
  highlighted = false,
}: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-5",
        highlighted
          ? "bg-primary text-primary-foreground"
          : "bg-card text-card-foreground"
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            highlighted ? "bg-primary-foreground/20" : "bg-muted"
          )}
        >
          {icon}
        </div>
        <span
          className={cn(
            "text-xs font-medium",
            highlighted ? "text-primary-foreground/80" : "text-muted-foreground"
          )}
        >
          {title}
        </span>
      </div>

      <div className="mt-4">
        <div className="text-2xl font-bold">{value}</div>
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-xs",
            highlighted ? "text-primary-foreground/80" : "text-muted-foreground"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-primary" />
          ) : (
            <TrendingDown className="h-3 w-3 text-destructive" />
          )}
          <span className={isPositive ? "text-primary" : "text-destructive"}>
            {Math.abs(change)}%
          </span>
          <span>This month</span>
        </div>
      </div>

      {chart && (
        <div className="absolute bottom-0 right-0 h-16 w-24 opacity-80">
          {chart}
        </div>
      )}
    </div>
  );
}
