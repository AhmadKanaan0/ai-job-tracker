"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft, ArrowRight, HelpCircle, CheckCircle2, Circle,
  AlertCircle, XCircle, Building2, FileText, ChevronDown, Info, Zap,
  ArrowUpRight, Lightbulb, ChevronUp
} from "lucide-react"

interface ResumeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  cvId: number;
  jobTitle?: string;
  company?: string;
}

import { useFullAnalysis, useFixCV } from "@/hooks/use-analysis";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import type { Analysis } from "@/lib/types";

interface CVChange {
  section: string;
  before: string;
  after: string;
  reason: string;
}

export function ResumeDrawer({ open, onOpenChange, jobId, cvId, jobTitle, company }: ResumeDrawerProps) {
  const [step, setStep] = useState(1)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [showFullCV, setShowFullCV] = useState(false)
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({ summary: true, skills: true, experience: true })
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())
  const [experienceMode, setExperienceMode] = useState<'quick' | 'full'>('quick')
  const { user } = useAuth()

  const fullAnalysisMutation = useFullAnalysis()
  const fixCvMutation = useFixCV()

  const handleClose = async (val: boolean) => {
    if (val && !analysis) {
      try {
        const result = await fullAnalysisMutation.mutateAsync({
          job_id: jobId,
          cv_id: cvId
        })
        setAnalysis(result)
      } catch (error: any) {
        console.error(error)
        const isApiLimit = error.status === 401 || error.status === 402 || error.status === 429;
        toast.error(error.message || "Failed to analyze resume", {
          duration: isApiLimit ? 10000 : 4000,
          style: isApiLimit ? { border: '1px solid #ff4444', backgroundColor: '#ff444410' } : undefined
        });
      }
    }
    if (!val) setStep(1)
    onOpenChange(val)
  }

  const handleFixCv = async () => {
    try {
      const result = await fixCvMutation.mutateAsync({
        job_id: jobId,
        cv_id: cvId
      })
      setAnalysis(result)
      setStep(3)
      toast.success("Resume optimized!")
    } catch (error: any) {
      console.error(error)
      const isApiLimit = error.status === 401 || error.status === 402 || error.status === 429;
      toast.error(error.message || "Failed to analyze resume", {
        duration: isApiLimit ? 10000 : 4000,
        style: isApiLimit ? { border: '1px solid #ff4444', backgroundColor: '#ff444410' } : undefined
      });
    }
  }

  // Extract rich change data from personalization_tips
  const changeData = analysis?.personalization_tips as {
    changes?: CVChange[];
    quick_wins?: string[];
    ats_improvement?: string;
    changes_made?: string[];
  } | null

  const changes: CVChange[] = changeData?.changes || []
  const quickWins: string[] = changeData?.quick_wins || []
  const atsImprovement: string = changeData?.ats_improvement || ""

  // Derive display name from user
  const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || "Your Resume" : "Your Resume"

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="!w-full !max-w-full sm:!max-w-[920px] overflow-y-auto bg-background p-0 border-l border-border/50"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-6 pt-6 pb-5">
          <SheetHeader className="p-0 mb-6">
            <SheetTitle className="text-xl font-bold flex items-center gap-3 flex-wrap">
              Generate Your Custom Resume
            </SheetTitle>
          </SheetHeader>

          {/* Step Timeline */}
          <div className="flex items-center gap-3 text-sm">
            <div className={`flex items-center gap-2 font-semibold ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(223,255,0,0.4)]" : "bg-muted text-muted-foreground border border-border/50"}`}>1</div>
              <span className="hidden sm:inline">See Your Difference</span>
            </div>
            <div className={`flex-1 h-px ${step >= 2 ? "bg-primary/50" : "bg-border"}`}></div>
            <div className={`flex items-center gap-2 font-semibold ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border/50"}`}>2</div>
              <span className="hidden sm:inline">Align Your Resume</span>
            </div>
            <div className={`flex-1 h-px ${step >= 3 ? "bg-primary/50" : "bg-border"}`}></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border/50"}`}>3</div>
              <span className="hidden sm:inline">Review Changes</span>
            </div>
          </div>
        </div>

        {/* ========== STEP 1: See Your Difference ========== */}
        {step === 1 && (
          <div className="p-6 pb-28 space-y-6">
            {/* Match Score Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {fullAnalysisMutation.isPending 
                    ? "Analyzing your fit..." 
                    : analysis?.match_score && analysis.match_score < 60 
                    ? "Your Resume is a Low Match for This Job"
                    : "Your Resume is a Strong Match!"}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="w-4 h-4 text-primary" />
                  {analysis?.match_score && analysis.match_score < 60 
                    ? "Resumes under 6.0 are likely to be filtered out — we'll help you fix it fast."
                    : "Great job! Your profile aligns well with this position."}
                </div>
              </div>
              {/* Score Gauge */}
              <div className="flex flex-col items-center flex-shrink-0 ml-4">
                <div className="relative w-20 h-20">
                  {fullAnalysisMutation.isPending ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="none" className="text-border/30" />
                        <circle cx="40" cy="40" r="34" stroke={analysis?.match_score && analysis.match_score > 70 ? "#22c55e" : "#ff6b35"} strokeWidth="6" fill="none" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 34}`}
                          strokeDashoffset={`${2 * Math.PI * 34 * (1 - (analysis?.match_score || 0) / 100)}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold" style={{ color: analysis?.match_score && analysis.match_score > 70 ? "#22c55e" : "#ff6b35" }}>
                          {(analysis?.match_score || 0) / 10}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <span className="text-xs font-semibold mt-1" style={{ color: analysis?.match_score && analysis.match_score > 70 ? "#22c55e" : "#ff6b35" }}>
                  {fullAnalysisMutation.isPending ? "Calculating..." : analysis?.match_score && analysis.match_score > 70 ? "Good" : "Poor"}
                </span>
              </div>
            </div>

            {/* Overview Row — uses real data */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <div className="bg-muted/20 px-5 py-3 text-sm font-medium text-muted-foreground border-b border-border/50">Overview</div>
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-secondary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{company || "Company"}</p>
                    <p className="font-semibold text-sm">{jobTitle || "Job Position"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center border border-border/50"><FileText className="w-5 h-5 text-muted-foreground" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Your resume</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{displayName}</p>
                      <span className="text-xs text-primary flex items-center gap-1 cursor-pointer">Select <ChevronDown className="w-3 h-3" /></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Rows */}
            <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/50">
              {/* Role Summary */}
              <div className="flex items-start px-5 py-4 gap-4">
                <span className="text-sm font-medium w-36 flex-shrink-0 mt-0.5">Role Summary</span>
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground flex-1">{analysis?.role_summary || "Analysis in progress..."}</p>
              </div>

              {/* Strategy */}
              <div className="flex items-start px-5 py-4 gap-4">
                <span className="text-sm font-medium w-36 flex-shrink-0 mt-0.5">Strategy</span>
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-muted-foreground">
                  {analysis?.level_strategy || "Analysis in progress..."}
                </div>
              </div>

              {/* Job Keywords */}
              <div className="flex items-start px-5 py-4 gap-4">
                <span className="text-sm font-medium w-36 flex-shrink-0 mt-0.5">Keywords Match</span>
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {(analysis?.matched_skills || []).map((s: string) => (
                    <Badge key={s} className="bg-primary/15 text-primary border border-primary/25 text-xs font-normal">
                      <CheckCircle2 className="w-3 h-3 mr-1" />{s}
                    </Badge>
                  ))}
                  {(analysis?.missing_skills || []).slice(0, 8).map((s: string) => (
                    <Badge key={s} variant="outline" className="text-xs font-normal border-border/50 bg-muted/20">{s}</Badge>
                  ))}
                </div>
              </div>

              {/* ATS Score */}
              <div className="flex items-center px-5 py-4 gap-4">
                <span className="text-sm font-medium w-36 flex-shrink-0 flex items-center gap-1.5">ATS Score <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" /></span>
                {(analysis?.ats_score || 0) > 70 ? (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <span className="text-sm flex-1 font-mono font-bold" style={{ color: (analysis?.ats_score || 0) > 70 ? "#22c55e" : "#ff6b35" }}>
                  {analysis?.ats_score ? `${analysis.ats_score}/100` : "—"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========== STEP 2: Align Your Resume ========== */}
        {step === 2 && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 pb-28">
            {/* LEFT: Sections */}
            <div>
              <h3 className="text-lg font-bold mb-5">1. Choose sections to enhance</h3>
              <div className="space-y-3">
                {(['summary', 'skills', 'experience'] as const).map((section) => {
                  const label = section === 'experience' ? 'Work Experience' : section.charAt(0).toUpperCase() + section.slice(1);
                  const isSelected = selectedSections[section];
                  return (
                    <div key={section}>
                      <div
                        onClick={() => setSelectedSections(prev => ({ ...prev, [section]: !prev[section] }))}
                        className={`flex items-center justify-between p-4 rounded-xl bg-muted/20 border transition-colors cursor-pointer ${
                          isSelected ? 'border-primary/40' : 'border-border/50 hover:border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground shadow-[0_0_8px_rgba(223,255,0,0.3)]'
                              : 'bg-muted border border-border/50 text-muted-foreground'
                          }`}>
                            {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                          </div>
                          <span className={`font-medium ${isSelected ? '' : 'text-muted-foreground'}`}>{label}</span>
                        </div>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </div>
                      {section === 'experience' && isSelected && (
                        <div className="pl-9 space-y-3 mt-3 ml-4">
                          <label className="flex items-center gap-3 text-sm cursor-pointer" onClick={() => setExperienceMode('quick')}>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${experienceMode === 'quick' ? 'border-primary' : 'border-muted-foreground'}`}>
                              {experienceMode === 'quick' && <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_4px_rgba(223,255,0,0.5)]"></div>}
                            </div>
                            <span className={experienceMode === 'quick' ? 'text-primary font-medium' : 'text-muted-foreground'}>Quick Edit</span>
                            <span className="text-muted-foreground">(First 2 key experiences)</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm cursor-pointer" onClick={() => setExperienceMode('full')}>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${experienceMode === 'full' ? 'border-primary' : 'border-muted-foreground'}`}>
                              {experienceMode === 'full' && <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_4px_rgba(223,255,0,0.5)]"></div>}
                            </div>
                            <span className={experienceMode === 'full' ? 'text-primary font-medium' : 'text-muted-foreground'}>Full Edit</span>
                            <span className="text-muted-foreground">(All experiences)</span>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Keywords */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">2. Add missing skill keywords <span className="text-muted-foreground font-normal">({selectedKeywords.size}/{analysis?.missing_skills?.length || 0})</span></h3>
                <button
                  onClick={() => {
                    const all = analysis?.missing_skills || [];
                    if (selectedKeywords.size === all.length) {
                      setSelectedKeywords(new Set());
                    } else {
                      setSelectedKeywords(new Set(all));
                    }
                  }}
                  className="text-sm text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                >
                  {selectedKeywords.size === (analysis?.missing_skills?.length || 0) ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {(analysis?.missing_skills || []).map((skill: string) => {
                  const isChecked = selectedKeywords.has(skill);
                  return (
                    <label
                      key={skill}
                      onClick={() => {
                        setSelectedKeywords(prev => {
                          const next = new Set(prev);
                          if (next.has(skill)) next.delete(skill);
                          else next.add(skill);
                          return next;
                        });
                      }}
                      className={`flex items-center gap-2 py-2 px-3 rounded-lg border cursor-pointer transition-all text-sm select-none ${
                        isChecked
                          ? 'bg-primary/10 border-primary/40 text-foreground'
                          : 'bg-muted/20 border-border/50 hover:border-primary/40 hover:bg-muted/40'
                      }`}
                    >
                      <Checkbox checked={isChecked} className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                      <span>{skill}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-6">
                <div className="flex items-center gap-2 p-3 px-4 rounded-lg bg-muted/30 border border-dashed border-border/50 text-muted-foreground text-sm">
                  <span>Add Keywords</span>
                  <HelpCircle className="w-4 h-4 ml-auto" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== STEP 3: Review Changes & Suggestions ========== */}
        {step === 3 && (
          <div className="p-6 pb-28 space-y-6">
            {/* ATS Improvement Banner */}
            {atsImprovement && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <ArrowUpRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-primary mb-1">ATS Score Improvement</h4>
                  <p className="text-sm text-foreground/80">{atsImprovement}</p>
                </div>
              </div>
            )}

            {/* Quick Wins */}
            {quickWins.length > 0 && (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <div className="bg-muted/20 px-5 py-3 text-sm font-medium flex items-center gap-2 border-b border-border/50">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Quick Wins — Do These Manually
                </div>
                <div className="divide-y divide-border/30">
                  {quickWins.map((win, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3">
                      <Checkbox className="mt-0.5 border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                      <span className="text-sm text-foreground/90">{win}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section-by-Section Changes */}
            {changes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Changes Made ({changes.length})
                </h3>
                {changes.map((change, i) => (
                  <div key={i} className="rounded-xl border border-border/50 overflow-hidden">
                    <div className="bg-muted/20 px-5 py-3 flex items-center justify-between border-b border-border/50">
                      <span className="text-sm font-semibold">{change.section}</span>
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">{change.reason.length > 60 ? change.reason.slice(0, 60) + "..." : change.reason}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/30">
                      {/* Before */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Before</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{change.before}</p>
                      </div>
                      {/* After */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">After</span>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">{change.after}</p>
                      </div>
                    </div>
                    <div className="px-5 py-2 bg-muted/10 border-t border-border/30">
                      <p className="text-xs text-muted-foreground italic">{change.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fallback for old format (changes_made as string array) */}
            {changes.length === 0 && changeData?.changes_made && (changeData.changes_made as string[]).length > 0 && (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <div className="bg-muted/20 px-5 py-3 text-sm font-medium border-b border-border/50">Changes Made</div>
                <div className="divide-y divide-border/30">
                  {(changeData.changes_made as string[]).map((change: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/90">{change}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Optimized CV (Collapsible) */}
            {analysis?.fixed_cv_text && (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <button 
                  onClick={() => setShowFullCV(!showFullCV)}
                  className="w-full bg-muted/20 px-5 py-3 text-sm font-medium flex items-center justify-between border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    View Full Optimized CV
                  </span>
                  {showFullCV ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showFullCV && (
                  <div className="p-6 font-mono text-xs whitespace-pre-wrap max-h-[500px] overflow-y-auto bg-card">
                    {analysis.fixed_cv_text}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-4 flex justify-center items-center gap-3">
          {step > 1 && (
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full border-border/50" onClick={() => setStep((s: number) => s - 1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          {step < 3 ? (
            <Button 
              onClick={() => step === 1 ? setStep(2) : handleFixCv()} 
              disabled={fullAnalysisMutation.isPending || fixCvMutation.isPending}
              className="h-11 px-8 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-[0_0_12px_rgba(223,255,0,0.25)] hover:shadow-[0_0_20px_rgba(223,255,0,0.4)] transition-all"
            >
              {fullAnalysisMutation.isPending || fixCvMutation.isPending ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {step === 1 ? "Continue" : "Generate My New Resume"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button className="h-11 px-8 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-[0_0_12px_rgba(223,255,0,0.25)] hover:shadow-[0_0_20px_rgba(223,255,0,0.4)] transition-all">
              Download Optimized CV
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
