"use client"

import { use } from "react"
import Link from "next/link"
import { useAnalysis } from "@/hooks/use-analysis"
import { useJob } from "@/hooks/use-jobs"
import { ReportViewer } from "@/components/job-tracker/report-viewer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink } from "lucide-react"

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ job_id: string; cv_id: string }>
}) {
  const { job_id, cv_id } = use(params)
  const jobId = parseInt(job_id)
  const cvId = parseInt(cv_id)

  const { data: analysis, isLoading: analysisLoading } = useAnalysis(jobId, cvId)
  const { data: job, isLoading: jobLoading } = useJob(jobId)

  const isLoading = analysisLoading || jobLoading

  if (isLoading) return (
    <div className="p-12 text-center text-muted-foreground animate-pulse">Loading report...</div>
  )

  if (!analysis) return (
    <div className="p-12 text-center">
      <p className="text-destructive font-semibold">Report not found.</p>
      <Link href="/dashboard/reports" className="text-primary text-sm mt-2 block hover:underline">
        ← Back to Reports
      </Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Reports
          </Button>
        </Link>
        {job?.url && (
          <Button variant="outline" size="sm" className="border-border/50 gap-1.5" asChild>
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
              Original Posting
            </a>
          </Button>
        )}
      </div>

      <ReportViewer analysis={analysis} job={job} />
    </div>
  )
}
