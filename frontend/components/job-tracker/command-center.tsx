"use client"

import { KPICards } from "./kpi-cards"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowRight, Sparkles, Briefcase, TrendingUp } from "lucide-react"
import { useTrackerStats, useTrackedJobs } from "@/hooks/use-tracker"
import { useAuth } from "@/lib/auth-context"
import { useMemo } from "react"
import Link from "next/link"

const PIPELINE_ORDER = [
  { key: "saved", label: "Saved", color: "#888888" },
  { key: "applied", label: "Applied", color: "#00D4FF" },
  { key: "screening", label: "Screening", color: "#A020F0" },
  { key: "interview", label: "Interview", color: "#DFFF00" },
  { key: "final_round", label: "Final Round", color: "#FFD700" },
  { key: "offer", label: "Offer", color: "#00FF88" },
  { key: "rejected", label: "Rejected", color: "#ff4444" },
  { key: "withdrawn", label: "Withdrawn", color: "#666666" },
]

export function CommandCenter() {
  const { data: stats } = useTrackerStats()
  const { data: trackedJobs = [] } = useTrackedJobs()
  const { user } = useAuth()

  // Compute pipeline stages from real data
  const pipelineStages = useMemo(() => {
    if (!stats?.by_status) return []
    return PIPELINE_ORDER
      .filter(s => (stats.by_status[s.key] || 0) > 0 || ["applied", "screening", "interview", "offer"].includes(s.key))
      .map(s => ({
        name: s.label,
        count: stats.by_status[s.key] || 0,
        color: s.color,
      }))
  }, [stats])

  const maxCount = Math.max(1, ...pipelineStages.map(s => s.count))

  // Recent activity from tracked jobs  
  const recentActivity = useMemo(() => {
    return trackedJobs.slice(0, 6).map(tj => ({
      company: tj.job.company,
      role: tj.job.title,
      time: getTimeAgo(tj.updated_at || tj.created_at),
      status: tj.status.charAt(0).toUpperCase() + tj.status.slice(1).replace("_", " "),
    }))
  }, [trackedJobs])

  // Compute match score average from tracked jobs with scores
  const matchScoreAvg = useMemo(() => {
    const scored = trackedJobs.filter(tj => tj.match_score != null && tj.match_score > 0)
    if (scored.length === 0) return 0
    return Math.round(scored.reduce((sum, tj) => sum + (tj.match_score || 0), 0) / scored.length)
  }, [trackedJobs])

  // Compute profile strength from user data completeness
  const profileStrength = useMemo(() => {
    if (!user) return 0
    let score = 0
    if (user.first_name) score += 10
    if (user.last_name) score += 10
    if (user.email) score += 10
    if (user.phone) score += 10
    if (user.city || user.country) score += 10
    if (user.skills && user.skills.length > 0) score += 15
    if (user.experiences && user.experiences.length > 0) score += 15
    if (user.educations && user.educations.length > 0) score += 10
    if (user.desired_roles && user.desired_roles.length > 0) score += 5
    if (user.has_cv) score += 5
    return Math.min(100, score)
  }, [user])

  const interviewCount = (stats?.by_status?.interview || 0) + (stats?.by_status?.final_round || 0)

  return (
    <div className="space-y-6">
      <KPICards
        totalApplications={stats?.total || 0}
        activeInterviews={interviewCount}
        matchScoreAvg={matchScoreAvg}
        profileStrength={profileStrength}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Application Pipeline
            </h3>
            {stats?.total ? (
              <Badge variant="outline" className="border-border/50 text-muted-foreground text-xs">
                {stats.total} total
              </Badge>
            ) : null}
          </div>
          {pipelineStages.length > 0 ? (
            <div className="space-y-4">
              {pipelineStages.map((stage, i) => (
                <div key={stage.name} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-muted-foreground">{stage.name}</div>
                  <div className="flex-1">
                    <Progress 
                      value={(stage.count / maxCount) * 100} 
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm">No applications tracked yet.</p>
              <Link href="/dashboard/discovery" className="text-primary text-sm mt-1 inline-block hover:underline">
                Discover jobs →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Recent Activity
            </h3>
            {recentActivity.length > 0 && (
              <Link href="/dashboard/tracker" className="text-xs text-primary hover:underline">
                View all
              </Link>
            )}
          </div>
          {recentActivity.length > 0 ? (
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
                        activity.status.toLowerCase().includes("interview") || activity.status.toLowerCase().includes("final")
                          ? "border-primary/30 text-primary bg-primary/10" 
                          : activity.status.toLowerCase() === "screening"
                          ? "border-secondary/30 text-secondary bg-secondary/10"
                          : activity.status.toLowerCase() === "offer"
                          ? "border-green-500/30 text-green-500 bg-green-500/10"
                          : activity.status.toLowerCase() === "rejected"
                          ? "border-red-400/30 text-red-400 bg-red-400/10"
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm">No recent activity yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Track jobs to see your progress here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return `${Math.floor(diffDays / 7)}w ago`
}
