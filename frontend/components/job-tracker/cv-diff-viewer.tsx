"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X, Zap, TrendingUp, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CvDiff, CvChange } from "@/lib/types"

interface CVDiffViewerProps {
  diff: CvDiff
}

const PRIORITY_STYLES = {
  high:   "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low:    "bg-blue-500/15 text-blue-400 border-blue-500/30",
}

const TYPE_LABELS: Record<CvChange["type"], string> = {
  rewrite: "Rewrite",
  add:     "Add",
  remove:  "Remove",
  keyword: "Keyword",
}

export function CVDiffViewer({ diff }: CVDiffViewerProps) {
  const [accepted, setAccepted] = useState<Record<number, boolean>>({})
  const [rejected, setRejected] = useState<Record<number, boolean>>({})
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const accept = (i: number) => setAccepted(prev => ({ ...prev, [i]: true }))
  const reject = (i: number) => setRejected(prev => ({ ...prev, [i]: true }))
  const toggle = (i: number) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))

  const pending = diff.changes.filter((_, i) => !accepted[i] && !rejected[i]).length

  return (
    <div className="space-y-4">
      {/* Header summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {pending} change{pending !== 1 ? "s" : ""} pending ·{" "}
          {Object.keys(accepted).length} accepted ·{" "}
          {Object.keys(rejected).length} rejected
        </span>
        <span className="text-primary text-xs font-medium">{diff.ats_improvement}</span>
      </div>

      {/* Change cards */}
      <div className="space-y-2">
        {diff.changes.map((change, i) => {
          const isAccepted = !!accepted[i]
          const isRejected = !!rejected[i]
          const isExpanded = !!expanded[i]

          return (
            <div
              key={i}
              className={cn(
                "rounded-xl border transition-all",
                isAccepted && "border-green-500/30 bg-green-500/5 opacity-60",
                isRejected && "border-muted/30 bg-muted/10 opacity-40",
                !isAccepted && !isRejected && "border-border/50 bg-muted/20",
              )}
            >
              {/* Card header */}
              <div
                className="flex items-center gap-2 p-3 cursor-pointer select-none"
                onClick={() => toggle(i)}
              >
                <Badge variant="outline" className={cn("text-[10px] shrink-0", PRIORITY_STYLES[change.priority])}>
                  {change.priority}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-border/40 text-muted-foreground shrink-0">
                  {change.section}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-border/40 text-muted-foreground shrink-0">
                  {TYPE_LABELS[change.type]}
                </Badge>
                <span className="text-xs text-muted-foreground flex-1 truncate">{change.reason}</span>
                {isAccepted && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                {isRejected && <X className="w-4 h-4 text-muted-foreground shrink-0" />}
                {!isAccepted && !isRejected && (
                  isExpanded
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </div>

              {/* Expanded diff */}
              {isExpanded && !isRejected && (
                <div className="px-3 pb-3 space-y-2">
                  {change.original && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2">
                      <p className="text-[10px] text-red-400 font-mono uppercase tracking-wide mb-1">Before</p>
                      <p className="text-xs text-red-300/80 font-mono leading-relaxed whitespace-pre-wrap">{change.original}</p>
                    </div>
                  )}
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-2">
                    <p className="text-[10px] text-green-400 font-mono uppercase tracking-wide mb-1">After</p>
                    <p className="text-xs text-green-300/80 font-mono leading-relaxed whitespace-pre-wrap">{change.suggested}</p>
                  </div>

                  {!isAccepted && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-green-500/40 text-green-400 hover:bg-green-500/10 flex-1"
                        onClick={() => accept(i)}
                      >
                        <Check className="w-3 h-3 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-border/40 text-muted-foreground hover:bg-muted/20 flex-1"
                        onClick={() => reject(i)}
                      >
                        <X className="w-3 h-3 mr-1" /> Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick wins */}
      {diff.quick_wins?.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
          <p className="text-xs font-semibold text-primary flex items-center gap-1">
            <Zap className="w-3 h-3" /> Quick Wins
          </p>
          <ul className="space-y-1">
            {diff.quick_wins.map((win, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <TrendingUp className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                {win}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
