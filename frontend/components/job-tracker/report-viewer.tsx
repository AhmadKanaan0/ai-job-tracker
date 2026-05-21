"use client"

import { Badge } from "@/components/ui/badge"
import { CVDiffViewer } from "@/components/job-tracker/cv-diff-viewer"
import {
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Brain,
  Target,
  MessageSquare,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Lightbulb,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Analysis, Job } from "@/lib/types"

interface ReportViewerProps {
  analysis: Analysis
  job?: Job | null
}

function ScoreBadge({ score }: { score: number | null }) {
  if (!score) return <span className="text-muted-foreground font-mono">—</span>
  const color =
    score >= 90 ? "#DFFF00" :
    score >= 75 ? "#00D4FF" :
    score >= 55 ? "#A020F0" : "#888"
  return (
    <span className="font-mono text-4xl font-bold" style={{ color }}>
      {Math.round(score)}%
    </span>
  )
}

function Section({ title, icon: Icon, children, className }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("glass-card rounded-2xl p-6 space-y-4", className)}>
      <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </h2>
      {children}
    </div>
  )
}

function LegitimacyIcon({ verdict }: { verdict?: string | null }) {
  if (!verdict) return null
  const map: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    high_confidence:      { icon: ShieldCheck, color: "text-green-400",  label: "High Confidence" },
    proceed_with_caution: { icon: ShieldAlert, color: "text-yellow-400", label: "Proceed with Caution" },
    suspicious:           { icon: ShieldX,     color: "text-red-400",    label: "Suspicious" },
  }
  const cfg = map[verdict]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span className={cn("flex items-center gap-1 text-sm", cfg.color)}>
      <Icon className="w-4 h-4" />
      {cfg.label}
    </span>
  )
}

export function ReportViewer({ analysis, job }: ReportViewerProps) {
  const matchedSkills = analysis.matched_skills || []
  const missingSkills = analysis.missing_skills || []
  const skillsTotal = matchedSkills.length + missingSkills.length
  const skillsPct = skillsTotal > 0 ? Math.round((matchedSkills.length / skillsTotal) * 100) : 0

  const interviewQuestions: { question: string; tip: string }[] =
    Array.isArray(analysis.interview_questions) ? analysis.interview_questions : []

  const atsIssues = analysis.ats_issues as {
    formatting_issues?: string[]
    missing_keywords?: string[]
  } | null

  const personalizationTips = Array.isArray(analysis.personalization_tips)
    ? analysis.personalization_tips as string[]
    : []

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-muted-foreground text-sm">
                {analysis.company || job?.company}
              </span>
              {job?.posting_legitimacy && (
                <LegitimacyIcon verdict={job.posting_legitimacy} />
              )}
            </div>
            <h1 className="text-2xl font-bold mb-3">
              {analysis.job_title || job?.title || `Job #${analysis.job_id}`}
            </h1>
            {analysis.role_summary && (
              <p className="text-muted-foreground leading-relaxed text-sm max-w-2xl">
                {analysis.role_summary}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <ScoreBadge score={analysis.match_score} />
            <p className="text-xs text-muted-foreground mt-1">Match Score</p>
            <div className="mt-3 text-center">
              <div className="text-lg font-bold" style={{ color: "#00D4FF" }}>{skillsPct}%</div>
              <div className="text-[10px] text-muted-foreground">Skills</div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <Section title="B — Match with CV" icon={Target}>
        <div className="space-y-3">
          {matchedSkills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Matched</p>
              <div className="flex flex-wrap gap-2">
                {matchedSkills.map((skill, i) => (
                  <Badge key={i} className="bg-green-500/15 text-green-400 border-green-500/30 text-xs gap-1">
                    <CheckCircle className="w-3 h-3" />{skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {missingSkills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Gaps</p>
              <div className="flex flex-wrap gap-2">
                {missingSkills.map((skill, i) => (
                  <Badge key={i} className="bg-orange-500/15 text-orange-400 border-orange-500/30 text-xs gap-1">
                    <AlertCircle className="w-3 h-3" />{skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Level Strategy */}
      {analysis.level_strategy && (
        <Section title="C — Level and Strategy" icon={TrendingUp}>
          <p className="text-sm text-muted-foreground leading-relaxed">{analysis.level_strategy}</p>
        </Section>
      )}

      {/* CV Customization Plan */}
      {analysis.cv_customization_plan && (
        <Section title="E — CV Customization Plan" icon={Star}>
          <CVDiffViewer diff={analysis.cv_customization_plan} />
        </Section>
      )}

      {/* Personalization Tips */}
      {personalizationTips.length > 0 && (
        <Section title="Personalization Tips" icon={Lightbulb}>
          <ul className="space-y-2">
            {personalizationTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5 shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ATS Issues */}
      {atsIssues && (atsIssues.formatting_issues?.length || atsIssues.missing_keywords?.length) ? (
        <Section title="ATS Compatibility" icon={Shield}>
          <div className="space-y-3">
            {atsIssues.formatting_issues && atsIssues.formatting_issues.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Formatting Issues</p>
                <ul className="space-y-1">
                  {atsIssues.formatting_issues.map((issue, i) => (
                    <li key={i} className="text-sm text-yellow-400/80 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {atsIssues.missing_keywords && atsIssues.missing_keywords.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Missing Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {atsIssues.missing_keywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-yellow-500/30 text-yellow-400/80">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      ) : null}

      {/* Interview Questions */}
      {interviewQuestions.length > 0 && (
        <Section title="F — Interview Preparation" icon={MessageSquare}>
          <div className="space-y-4">
            {interviewQuestions.map((q, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-muted/10 p-4">
                <p className="text-sm font-medium mb-2 flex items-start gap-2">
                  <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {q.question}
                </p>
                {q.tip && (
                  <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                    <span className="text-primary font-medium">Tip: </span>{q.tip}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Legitimacy signals */}
      {job?.legitimacy_signals && (
        <Section title="G — Posting Legitimacy" icon={ShieldCheck}>
          <p className="text-sm text-muted-foreground">{job.legitimacy_signals.summary}</p>
          <div className="space-y-1.5 mt-2">
            {job.legitimacy_signals.signals?.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  s.severity === "high" ? "bg-red-400" :
                  s.severity === "medium" ? "bg-yellow-400" : "bg-green-400"
                )} />
                <span className="text-muted-foreground">{s.signal}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
