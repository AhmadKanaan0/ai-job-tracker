"use client"

import { useRouter } from "next/navigation"
import { useAnalysisHistory } from "@/hooks/use-analysis"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BarChart2,
  Brain,
  Search,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useState } from "react"

function scoreColor(score: number | null | undefined): string {
  if (!score) return "#888"
  if (score >= 90) return "#DFFF00"
  if (score >= 75) return "#00D4FF"
  if (score >= 55) return "#A020F0"
  return "#888"
}

export default function ReportsPage() {
  const router = useRouter()
  const { data: analyses = [], isLoading } = useAnalysisHistory()
  const [search, setSearch] = useState("")

  const filtered = analyses.filter(a => {
    const q = search.toLowerCase()
    return !q ||
      (a.job_title || "").toLowerCase().includes(q) ||
      (a.company || "").toLowerCase().includes(q)
  })

  if (isLoading) return (
    <div className="p-12 text-center text-muted-foreground animate-pulse">Loading reports...</div>
  )

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-balance">Reports</h1>
        <p className="text-muted-foreground">Full AI evaluation reports for every analyzed job</p>
      </header>

      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search company or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-border/50"
          />
        </div>

        {filtered.length === 0 && !isLoading && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Brain className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              {analyses.length === 0
                ? "No reports yet. Analyze a job from the Discovery feed or Analyzer page."
                : "No reports match your search."}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map(analysis => {
            const matchedCount = analysis.matched_skills?.length || 0
            const missingCount = analysis.missing_skills?.length || 0
            const skillsTotal = matchedCount + missingCount
            const skillsPct = skillsTotal > 0 ? Math.round((matchedCount / skillsTotal) * 100) : null
            const hasDiff = !!analysis.cv_customization_plan

            return (
              <div
                key={analysis.id}
                className="glass-card rounded-2xl p-5 hover:border-primary/20 transition-all cursor-pointer group"
                onClick={() => router.push(`/dashboard/reports/${analysis.job_id}/${analysis.cv_id}`)}
              >
                <div className="flex items-start gap-5">
                  {/* Score */}
                  <div className="w-16 text-center flex-shrink-0">
                    <span
                      className="text-2xl font-bold font-mono"
                      style={{ color: scoreColor(analysis.match_score) }}
                    >
                      {analysis.match_score ? `${Math.round(analysis.match_score)}` : "—"}
                    </span>
                    <div className="text-[10px] text-muted-foreground">match</div>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                          {analysis.job_title || `Job #${analysis.job_id}`}
                        </h3>
                        <p className="text-xs text-muted-foreground">{analysis.company || "Unknown company"}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasDiff && (
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                            CV Diff
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] border-border/40 text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(analysis.created_at), "MMM d")}
                        </Badge>
                      </div>
                    </div>

                    {analysis.role_summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                        {analysis.role_summary}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {skillsPct !== null && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          {skillsPct}% skills match
                        </span>
                      )}
                      {matchedCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-green-400/80">
                          <CheckCircle className="w-3 h-3" />
                          {matchedCount} matched
                        </span>
                      )}
                      {missingCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-400/80">
                          <AlertCircle className="w-3 h-3" />
                          {missingCount} gaps
                        </span>
                      )}
                      {analysis.job_url && (
                        <a
                          href={analysis.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground ml-auto"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Original
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Open arrow */}
                  <div className="self-center">
                    <BarChart2 className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
