"use client"

import { KPICards } from "./kpi-cards"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowRight } from "lucide-react"

const pipelineStages = [
  { name: "Applied", count: 47, color: "#00D4FF" },
  { name: "Screening", count: 12, color: "#A020F0" },
  { name: "Interview", count: 8, color: "#DFFF00" },
  { name: "Offer", count: 2, color: "#00FF88" },
]

const recentActivity = [
  { company: "Stripe", role: "Senior Frontend Engineer", time: "2 hours ago", status: "Applied" },
  { company: "Vercel", role: "Full Stack Developer", time: "4 hours ago", status: "Applied" },
  { company: "Linear", role: "Software Engineer", time: "1 day ago", status: "Screening" },
  { company: "Notion", role: "Frontend Engineer", time: "2 days ago", status: "Interview" },
  { company: "Figma", role: "React Developer", time: "3 days ago", status: "Applied" },
]

export function CommandCenter() {
  return (
    <div className="space-y-6">
      <KPICards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Application Pipeline</h3>
          <div className="space-y-4">
            {pipelineStages.map((stage, i) => (
              <div key={stage.name} className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">{stage.name}</div>
                <div className="flex-1">
                  <Progress 
                    value={(stage.count / 47) * 100} 
                    className="h-3"
                    style={{ 
                      // @ts-expect-error CSS custom property
                      '--progress-background': stage.color 
                    }}
                  />
                </div>
                <div className="w-12 text-right font-mono text-sm" style={{ color: stage.color }}>
                  {stage.count}
                </div>
                {i < pipelineStages.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{activity.role}</p>
                  <p className="text-sm text-muted-foreground">{activity.company}</p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant="outline"
                    className={
                      activity.status === "Interview" 
                        ? "border-primary/30 text-primary bg-primary/10" 
                        : activity.status === "Screening"
                        ? "border-secondary/30 text-secondary bg-secondary/10"
                        : "border-accent/30 text-accent bg-accent/10"
                    }
                  >
                    {activity.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
