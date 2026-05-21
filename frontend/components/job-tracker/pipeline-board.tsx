"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  FileText,
  BarChart2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  ExternalLink,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  Briefcase,
  TrendingUp,
  Target,
  Layers,
} from "lucide-react"
import { useTrackedJobs, useUpdateTracker } from "@/hooks/use-tracker"
import { useAnalysisHistory } from "@/hooks/use-analysis"
import { useActiveCV } from "@/hooks/use-cv"
import type { TrackedJob, Analysis } from "@/lib/types"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  saved:       { label: "Saved",        color: "bg-muted/50 text-muted-foreground",           dot: "bg-muted-foreground" },
  applied:     { label: "Applied",      color: "bg-blue-500/20 text-blue-400",                dot: "bg-blue-400" },
  phone_screen:{ label: "Phone Screen", color: "bg-yellow-500/20 text-yellow-400",            dot: "bg-yellow-400" },
  interview:   { label: "Interview",    color: "bg-emerald-500/20 text-emerald-400",          dot: "bg-emerald-400" },
  take_home:   { label: "Take Home",    color: "bg-purple-500/20 text-purple-400",            dot: "bg-purple-400" },
  final_round: { label: "Final Round",  color: "bg-orange-500/20 text-orange-400",            dot: "bg-orange-400" },
  offer:       { label: "Offer",        color: "bg-primary/20 text-primary",                  dot: "bg-primary" },
  accepted:    { label: "Accepted",     color: "bg-green-500/20 text-green-400",              dot: "bg-green-400" },
  rejected:    { label: "Rejected",     color: "bg-destructive/20 text-destructive/80",       dot: "bg-destructive/60" },
  ghosted:     { label: "Ghosted",      color: "bg-muted/30 text-muted-foreground/50",        dot: "bg-muted-foreground/30" },
  withdrawn:   { label: "Withdrawn",    color: "bg-muted/50 text-muted-foreground",           dot: "bg-muted-foreground/50" },
}

const ALL_STATUSES = Object.keys(statusConfig)

const SCORE_TIERS = [
  { label: "Excellent", min: 90, color: "#DFFF00" },
  { label: "Good",      min: 75, color: "#00D4FF" },
  { label: "Fair",      min: 55, color: "#A020F0" },
  { label: "Low",       min: 0,  color: "#888" },
]

function scoreColor(score: number | null | undefined): string {
  if (!score) return "#888"
  for (const tier of SCORE_TIERS) {
    if (score >= tier.min) return tier.color
  }
  return "#888"
}

type SortField = "score" | "company" | "role" | "status" | "date"
type SortDir = "asc" | "desc"

export function PipelineBoard() {
  const router = useRouter()
  const { data: trackedJobs = [], isLoading } = useTrackedJobs()
  const { data: analyses = [] } = useAnalysisHistory()
  const { data: activeCV } = useActiveCV()
  const updateTracker = useUpdateTracker()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [cvJob, setCvJob] = useState<TrackedJob | null>(null)

  // Build a map of job_id → analysis for quick lookup
  const analysisMap = useMemo(() => {
    const m: Record<number, Analysis> = {}
    for (const a of analyses) {
      if (!m[a.job_id] || new Date(a.created_at) > new Date(m[a.job_id].created_at)) {
        m[a.job_id] = a
      }
    }
    return m
  }, [analyses])

  const enriched = useMemo(() => trackedJobs.map(tj => ({
    ...tj,
    analysis: analysisMap[tj.job.id] || null,
  })), [trackedJobs, analysisMap])

  // Stats
  const total = enriched.length
  const highFit = enriched.filter(e => (e.match_score || 0) >= 80).length
  const avgScore = total > 0
    ? Math.round(enriched.reduce((sum, e) => sum + (e.match_score || 0), 0) / total)
    : 0
  const inProgress = enriched.filter(e =>
    ["applied", "phone_screen", "interview", "take_home", "final_round"].includes(e.status)
  ).length

  // Status distribution
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const e of enriched) c[e.status] = (c[e.status] || 0) + 1
    return c
  }, [enriched])

  // Score distribution
  const scoreTierCounts = useMemo(() => {
    const tiers = SCORE_TIERS.map(t => ({ ...t, count: 0 }))
    for (const e of enriched) {
      const score = e.match_score || 0
      for (const tier of tiers) {
        if (score >= tier.min) { tier.count++; break }
      }
    }
    return tiers
  }, [enriched])

  // Filter + sort
  const rows = useMemo(() => {
    let r = enriched.filter(e => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        e.job.title.toLowerCase().includes(q) ||
        e.job.company.toLowerCase().includes(q)
      const matchStatus = statusFilter === "all" || e.status === statusFilter
      return matchSearch && matchStatus
    })

    r.sort((a, b) => {
      let cmp = 0
      if (sortField === "score") cmp = (a.match_score || 0) - (b.match_score || 0)
      else if (sortField === "company") cmp = a.job.company.localeCompare(b.job.company)
      else if (sortField === "role") cmp = a.job.title.localeCompare(b.job.title)
      else if (sortField === "status") cmp = ALL_STATUSES.indexOf(a.status) - ALL_STATUSES.indexOf(b.status)
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortDir === "asc" ? cmp : -cmp
    })

    return r
  }, [enriched, search, statusFilter, sortField, sortDir])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("desc") }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 ml-1 text-primary" /> : <ArrowDown className="w-3 h-3 ml-1 text-primary" />
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      await updateTracker.mutateAsync({ id, status })
    } catch { toast.error("Failed to update status") }
  }

  if (isLoading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading pipeline...</div>

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tracked",  value: total,    icon: Layers,    color: "text-muted-foreground" },
          { label: "High Fit (≥80%)",value: highFit,  icon: Target,    color: "text-primary" },
          { label: "In Progress",    value: inProgress,icon: TrendingUp,color: "text-blue-400" },
          { label: "Avg Match Score",value: `${avgScore}%`, icon: BarChart2, color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={cn("w-4 h-4", s.color)} />
            </div>
            <div className={cn("text-3xl font-bold", s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Status Distribution */}
      {total > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Status Distribution</h3>
          <div className="flex h-3 rounded-full overflow-hidden gap-px">
            {ALL_STATUSES.map(s => {
              const count = statusCounts[s] || 0
              if (!count) return null
              const pct = (count / total) * 100
              return (
                <div
                  key={s}
                  className={cn("transition-all", statusConfig[s]?.dot.replace("bg-", "bg-"))}
                  style={{ width: `${pct}%` }}
                  title={`${statusConfig[s]?.label}: ${count}`}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {ALL_STATUSES.filter(s => statusCounts[s]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-opacity",
                  statusFilter !== "all" && statusFilter !== s && "opacity-30"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", statusConfig[s]?.dot)} />
                <span className="text-muted-foreground">{statusConfig[s]?.label}</span>
                <span className="font-mono text-muted-foreground/60">({statusCounts[s]})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Score Distribution */}
      {total > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Score Distribution</h3>
          <div className="flex gap-3">
            {scoreTierCounts.map(tier => (
              <div key={tier.label} className="flex-1 text-center">
                <div
                  className="text-2xl font-bold font-mono mb-1"
                  style={{ color: tier.color }}
                >
                  {tier.count}
                </div>
                <div className="text-xs text-muted-foreground">{tier.label}</div>
                <div className="text-[10px] text-muted-foreground/50">
                  {tier.label === "Low" ? `<${SCORE_TIERS[SCORE_TIERS.length - 2].min}%` : `≥${tier.min}%`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search company or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-border/50 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-muted/50 border-border/50 h-9">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ALL_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{statusConfig[s]?.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{rows.length} results</span>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[80px]">
                <button onClick={() => toggleSort("score")} className="flex items-center text-xs text-muted-foreground hover:text-foreground">
                  Score <SortIcon field="score" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("company")} className="flex items-center text-xs text-muted-foreground hover:text-foreground">
                  Company <SortIcon field="company" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("role")} className="flex items-center text-xs text-muted-foreground hover:text-foreground">
                  Role <SortIcon field="role" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("status")} className="flex items-center text-xs text-muted-foreground hover:text-foreground">
                  Status <SortIcon field="status" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("date")} className="flex items-center text-xs text-muted-foreground hover:text-foreground">
                  Date <SortIcon field="date" />
                </button>
              </TableHead>
              <TableHead className="text-xs text-muted-foreground">Notes</TableHead>
              <TableHead className="w-[80px] text-xs text-muted-foreground text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => {
              const analysis = row.analysis
              const reportUrl = analysis ? `/dashboard/reports/${analysis.job_id}/${analysis.cv_id}` : null

              return (
                <TableRow key={row.id} className="border-border/50 hover:bg-muted/20">
                  {/* Score */}
                  <TableCell>
                    <span
                      className="font-mono font-bold text-sm"
                      style={{ color: scoreColor(row.match_score) }}
                    >
                      {row.match_score ? `${Math.round(row.match_score)}%` : "—"}
                    </span>
                  </TableCell>

                  {/* Company */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-secondary">
                          {row.job.company[0]}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{row.job.company}</span>
                    </div>
                  </TableCell>

                  {/* Role */}
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {row.job.title}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1.5 group">
                          <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig[row.status]?.dot)} />
                          <span className={cn("text-xs px-2 py-0.5 rounded-full", statusConfig[row.status]?.color)}>
                            {statusConfig[row.status]?.label}
                          </span>
                          <ChevronDown className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-popover border-border" align="start">
                        {ALL_STATUSES.map(s => (
                          <DropdownMenuItem key={s} onClick={() => updateStatus(row.id, s)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full mr-2", statusConfig[s]?.dot)} />
                            {statusConfig[s]?.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(row.applied_date || row.created_at), "MMM d")}
                  </TableCell>

                  {/* Notes */}
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                    {row.notes || <span className="italic opacity-40">—</span>}
                  </TableCell>

                  {/* Actions: CV + Report */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="View CV"
                        onClick={() => setCvJob(row)}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                      {reportUrl ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          title="View Report"
                          onClick={() => router.push(reportUrl)}
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground/30 cursor-not-allowed"
                          title="No report yet — analyze from Discovery"
                          disabled
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {rows.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            {total === 0
              ? "No tracked applications yet — save jobs from the Discovery feed."
              : "No results matching your filters."}
          </div>
        )}
      </div>

      {/* CV Viewer Modal */}
      <Dialog open={!!cvJob} onOpenChange={() => setCvJob(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-card border-border">
          {cvJob && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Active CV
                  <span className="text-sm font-normal text-muted-foreground ml-2">— for {cvJob.job.company}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">
                {activeCV?.file_url ? (
                  <div className="rounded-xl overflow-hidden border border-border/50">
                    <iframe
                      src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/${activeCV.file_url}`}
                      className="w-full h-[60vh]"
                      title="CV Preview"
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No CV file available. Upload one in CV Manager.</p>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t border-border/50">
                {activeCV && (
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/${activeCV.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Open Full
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
