"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Brain, Zap, CheckCircle, AlertCircle, Send, ArrowLeftRight } from "lucide-react"

import { useScrapeJob } from "@/hooks/use-jobs"
import { useFullAnalysis, useCvDiff } from "@/hooks/use-analysis"
import { useActiveCV } from "@/hooks/use-cv"
import { useAddToTracker, useTrackedJobs } from "@/hooks/use-tracker"
import { CVDiffViewer } from "@/components/job-tracker/cv-diff-viewer"
import { toast } from "sonner"
import type { Analysis, CvDiff } from "@/lib/types"
import { useRouter } from "next/navigation"

export function AIAnalyzer() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [analysisData, setAnalysisData] = useState<Analysis | null>(null)
  const [cvDiff, setCvDiff] = useState<CvDiff | null>(null)

  const { data: activeCv } = useActiveCV()
  const { data: trackedJobs = [] } = useTrackedJobs()
  const scrapeJob = useScrapeJob()
  const fullAnalysis = useFullAnalysis()
  const cvDiffMutation = useCvDiff()
  const addToTracker = useAddToTracker()

  const isAnalyzing = scrapeJob.isPending || fullAnalysis.isPending
  const isGeneratingDiff = cvDiffMutation.isPending
  const isTracked = analysisData && trackedJobs.some(tj => tj.job.id === analysisData.job_id)

  const handleAnalyze = async () => {
    if (!url) return
    if (!activeCv) {
      toast.error("Please upload and activate a CV first.")
      return
    }

    setCvDiff(null)
    try {
      const job = await scrapeJob.mutateAsync({ url })
      const analysis = await fullAnalysis.mutateAsync({ job_id: job.id, cv_id: activeCv.id })
      setAnalysisData(analysis)
      toast.success("Analysis complete!")
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze job")
    }
  }

  const handleGenerateDiff = async () => {
    if (!analysisData || !activeCv) return
    try {
      const result = await cvDiffMutation.mutateAsync({
        job_id: analysisData.job_id,
        cv_id: activeCv.id,
      })
      if (result.cv_customization_plan) {
        setCvDiff(result.cv_customization_plan)
        toast.success("CV diff generated!")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate CV diff")
    }
  }

  const handleSaveToTracker = async () => {
    if (!analysisData) return
    try {
      await addToTracker.mutateAsync({ job_id: analysisData.job_id })
      toast.success("Job added to tracker!")
    } catch (err: any) {
      toast.error(err.message || "Failed to add to tracker")
    }
  }

  const jobRequirements = analysisData ? [
    ...(analysisData.matched_skills || []).map(s => ({ skill: s, status: "match" as const })),
    ...(analysisData.missing_skills || []).map(s => ({ skill: s, status: "missing" as const }))
  ] : []

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex gap-4">
          <Input
            placeholder="Paste job post URL here..."
            className="flex-1 bg-muted/50 text-lg h-14"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 animate-pulse-glow"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Brain className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </div>

      {analysisData && (
        <>
          {/* Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job Intel */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-secondary" />
                Job Intelligence
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  {analysisData.role_summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {jobRequirements.map((req, i) => (
                    <Badge
                      key={i}
                      className={
                        req.status === "match"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      }
                    >
                      {req.status === "match" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {req.status === "missing" && <AlertCircle className="w-3 h-3 mr-1" />}
                      {req.skill}
                    </Badge>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-muted/30">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Overall Match</span>
                    <span className="text-primary font-bold">{analysisData.match_score}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${analysisData.match_score}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* CV Diff Panel */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-primary" />
                  CV Optimization Diff
                </h3>
                {!cvDiff && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-primary/40 text-primary hover:bg-primary/10"
                    onClick={handleGenerateDiff}
                    disabled={isGeneratingDiff}
                  >
                    {isGeneratingDiff ? (
                      <>
                        <Brain className="w-3 h-3 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ArrowLeftRight className="w-3 h-3 mr-1" />
                        Generate Diff
                      </>
                    )}
                  </Button>
                )}
              </div>

              {cvDiff ? (
                <CVDiffViewer diff={cvDiff} />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
                  <ArrowLeftRight className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Click <span className="text-primary font-medium">Generate Diff</span> to see exactly what to change in your CV for this role.
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Shows prioritised before/after edits per section — no guessing.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            {isTracked ? (
              <Button
                size="lg"
                variant="outline"
                className="px-12 py-6 text-lg border-primary text-primary hover:bg-primary/10"
                onClick={() => router.push("/dashboard/tracker")}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                In Your Tracker
              </Button>
            ) : (
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-6 text-lg animate-pulse-glow"
                onClick={handleSaveToTracker}
                disabled={isAnalyzing}
              >
                <Send className="w-5 h-5 mr-2" />
                {addToTracker.isPending ? "Saving..." : "Save to My Tracker"}
              </Button>
            )}
          </div>
        </>
      )}

      {!analysisData && !isAnalyzing && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">AI-Powered Job Analysis</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Paste a job posting URL above to analyze requirements and get a prioritised, section-by-section CV diff
          </p>
        </div>
      )}
    </div>
  )
}
