"use client";

import Link from "next/link";
import { useState, use, useEffect } from "react";
import { jobs } from "@/lib/data/jobs";
import { MatchScoreGauge } from "@/components/job-tracker/match-gauges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  MapPin, 
  Clock, 
  Briefcase, 
  Share2, 
  Flag, 
  ExternalLink,
  Search,
  Sparkles,
  Mail,
  ThumbsUp,
  Target,
  ArrowLeft,
  BriefcaseBusiness,
  X,
  Heart,
  Ban,
  HelpCircle
} from "lucide-react";
import { ResumeDrawer } from "@/components/job-tracker/resume-drawer";
import { CoverLetterDrawer } from "@/components/job-tracker/cover-letter-drawer";

import { useJob, useOptimizeJob } from "@/hooks/use-jobs";
import { useActiveCV } from "@/hooks/use-cv";
import { useAnalysis, useFullAnalysis } from "@/hooks/use-analysis";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const jobId = parseInt(unwrappedParams.id);
  
  const { data: job, isLoading: jobLoading } = useJob(jobId);
  const { data: activeCv } = useActiveCV();
  
  const { data: analysis, isLoading: analysisLoading } = useAnalysis(jobId, activeCv?.id || 0);
  const fullAnalysis = useFullAnalysis();
  const optimizeJob = useOptimizeJob();

  const [resumeOpen, setResumeOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);

  const isAnalyzing = fullAnalysis.isPending;
  const isOptimizing = optimizeJob.isPending;

  // Auto-optimize description if missing
  useEffect(() => {
    if (job && !job.formatted_description && !optimizeJob.isPending) {
      optimizeJob.mutate(jobId);
    }
  }, [job, jobId, optimizeJob.isPending]);

  const handleAnalyzeFit = async () => {
    if (!activeCv) {
      toast.error("Please upload and activate a CV first.");
      return;
    }
    try {
      await fullAnalysis.mutateAsync({ job_id: jobId, cv_id: activeCv.id });
      toast.success("Analysis complete!");
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze job fit");
    }
  };

  if (jobLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading job details...</div>;
  if (!job) return <div className="p-8 text-center text-destructive font-semibold">Job not found or failed to load.</div>;

  const displayJob = job;

  return (
    <div className="w-full">
      {/* Drawers */}
      {activeCv && (
        <>
          <ResumeDrawer 
            open={resumeOpen} 
            onOpenChange={setResumeOpen} 
            jobId={jobId}
            cvId={activeCv.id}
          />
          <CoverLetterDrawer 
            open={coverOpen} 
            onOpenChange={setCoverOpen} 
            jobId={jobId}
            cvId={activeCv.id}
          />
        </>
      )}

      <div className="flex">
        {/* ====== MAIN CONTENT ====== */}
        <div className="flex-1 min-w-0">
          
          {/* Top Action Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/discovery">
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
              </Link>
              <span className="text-sm text-muted-foreground">{displayJob.applicants_count || "0 applicants"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <Ban className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <Heart className="w-4 h-4" />
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm font-semibold rounded-md shadow-[0_0_10px_rgba(223,255,0,0.2)]">
                APPLY NOW
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Tabs Row + Actions */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-border/30">
            <div className="flex items-center gap-1">
              <button className="text-sm font-semibold border-b-2 border-foreground pb-2 pt-2 px-2">Overview</button>
              <button className="text-sm text-muted-foreground pb-2 pt-2 px-2 hover:text-foreground transition-colors">Company</button>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <button className="flex items-center gap-1.5 hover:text-foreground transition-colors"><Share2 className="w-3.5 h-3.5" /> Share</button>
              <button className="flex items-center gap-1.5 hover:text-foreground transition-colors"><Flag className="w-3.5 h-3.5" /> Report Issue</button>
              <button className="flex items-center gap-1.5 hover:text-foreground transition-colors"><ExternalLink className="w-3.5 h-3.5" /> Original Job Post</button>
            </div>
          </div>

          {/* Job Header */}
          <div className="px-6 pt-6">
            <div className="flex justify-between items-start gap-6 mb-5">
              <div className="flex-1">
                {/* Company + Date */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-sm">{displayJob.company}</span>
                  <span className="text-sm text-muted-foreground">· {displayJob.posted_at || "Just now"}</span>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold mb-4">{displayJob.title}</h1>

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {displayJob.location || "Remote"}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {displayJob.job_type || "Full-time"}</span>
                  {displayJob.salary_max && displayJob.salary_min !== null && (
                    <span className="flex items-center gap-1">
                      💰 {displayJob.salary_currency}{(displayJob.salary_min || 0) / 1000}k - {displayJob.salary_max / 1000}k
                    </span>
                  )}
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {displayJob.experience_level || "Not specified"}</span>
                </div>
              </div>

              {/* Match Score */}
              <div className="flex flex-col items-center flex-shrink-0">
                <MatchScoreGauge score={analysis?.match_score || 0} size="md" />
                {analysis && (
                  <div className="mt-3 flex gap-4">
                    {[
                      { label: "ATS Score", val: `${analysis.ats_score || 0}%` },
                      { label: "Skills", val: `${Math.round(((analysis.matched_skills?.length || 0) / ((analysis.matched_skills?.length || 0) + (analysis.missing_skills?.length || 0) || 1)) * 100)}%` },
                    ].map(g => (
                      <div key={g.label} className="text-center">
                        <div className="w-10 h-10 mx-auto rounded-full border-2 border-primary/40 flex items-center justify-center mb-0.5">
                          <span className="text-xs font-bold text-primary">{g.val}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground leading-tight block">{g.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="text-sm text-foreground/85 leading-relaxed mb-8 prose prose-invert max-w-none">
              {isOptimizing ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-muted/30 rounded w-3/4" />
                  <div className="h-4 bg-muted/30 rounded w-full" />
                  <div className="h-4 bg-muted/30 rounded w-5/6" />
                  <div className="flex items-center gap-2 text-primary/60 text-xs font-bold uppercase tracking-widest mt-4">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    AI is organizing this description...
                  </div>
                </div>
              ) : displayJob.formatted_description ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayJob.formatted_description}
                </ReactMarkdown>
              ) : (
                <div className="whitespace-pre-wrap">
                  {displayJob.description || (
                    <p>
                      <span className="font-semibold">{displayJob.company}</span> is reimagining its industry by providing advanced solutions. They are seeking a <span className="font-semibold underline">{displayJob.title}</span> to own product areas end-to-end, drive AI strategy, and shape engineering culture within a small, impactful team.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Industry Tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(displayJob.tags || []).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs font-normal border-border/50 bg-muted/20 py-0.5 px-2">{tag}</Badge>
              ))}
            </div>
            {displayJob.no_h1b && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
                🚫 No H1B <HelpCircle className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>

        {/* ====== AI TOOLS SIDEBAR ====== */}
        <div className="w-[240px] flex-shrink-0 border-l border-border/50 p-4 hidden lg:block">
          <h3 className="text-sm font-bold mb-3">AI Tools</h3>

          <div className="flex flex-col gap-3">
            {/* Customize Resume */}
            <div
              onClick={() => setResumeOpen(true)}
              className="rounded-xl p-4 bg-gradient-to-br from-primary/15 to-transparent border border-primary/30 cursor-pointer hover:shadow-[0_0_12px_rgba(223,255,0,0.15)] transition-all group"
            >
              <Sparkles className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-sm mb-0.5">Customize Your Resume</h4>
              <p className="text-xs text-foreground/70">Maximize your interview chances</p>
            </div>

            {/* View Cover Letter */}
            <div
              onClick={() => setCoverOpen(true)}
              className="rounded-xl p-4 border border-border/50 cursor-pointer hover:bg-muted/20 transition-all"
            >
              <Mail className="w-5 h-5 text-muted-foreground mb-2" />
              <h4 className="font-bold text-sm mb-0.5">View Cover Letter</h4>
              <p className="text-xs text-muted-foreground">Updated Apr 17, 2026</p>
            </div>

            {/* Analyze Fit */}
            <div 
              onClick={handleAnalyzeFit}
              className={`rounded-xl p-4 border border-border/50 cursor-pointer hover:bg-muted/20 transition-all ${isAnalyzing ? 'animate-pulse' : ''}`}
            >
              <ThumbsUp className={`w-5 h-5 mb-2 ${isAnalyzing ? 'text-primary animate-bounce' : 'text-muted-foreground'}`} />
              <h4 className="font-bold text-sm mb-0.5">{isAnalyzing ? "Analyzing..." : "Analyze How Well You Fit"}</h4>
              <p className="text-xs text-muted-foreground">Understand your strength & weakness</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
