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
  AlertCircle, XCircle, Building2, FileText, ChevronDown, Info
} from "lucide-react"

interface ResumeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALL_SKILLS = [
  "SCSS", "JavaScript", "Python", "DynamoDB",
  "AWS CDK", "Elasticsearch", "Solr", "OpenSearch",
  "Android Development", "Kotlin", "Shopify Integration"
]

const MATCHED_SKILLS = ["React", "TypeScript", "NodeJS", "NestJS", "PostgreSQL", "Redis", "AWS"]
const UNMATCHED_SKILLS = ["SCSS", "JavaScript", "Python", "DynamoDB", "AWS CDK", "Elasticsearch", "Solr", "OpenSearch", "Android Development", "Kotlin", "Shopify Integration"]

export function ResumeDrawer({ open, onOpenChange }: ResumeDrawerProps) {
  const [step, setStep] = useState(1)

  const handleClose = (val: boolean) => {
    if (!val) setStep(1)
    onOpenChange(val)
  }

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
              <Badge className="bg-primary/20 text-primary border border-primary/30 text-xs font-medium">
                2 credits available today
              </Badge>
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
              <span className="hidden sm:inline">Review Your New Resume</span>
            </div>
          </div>
        </div>

        {/* ========== STEP 1: See Your Difference ========== */}
        {step === 1 && (
          <div className="p-6 pb-28 space-y-6">
            {/* Match Score Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Resume is a Low Match for This Job</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="w-4 h-4 text-primary" />
                  Resumes under 6.0 are likely to be filtered out — we&apos;ll help you fix it fast.
                </div>
              </div>
              {/* Score Gauge */}
              <div className="flex flex-col items-center flex-shrink-0 ml-4">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="none" className="text-border/30" />
                    <circle cx="40" cy="40" r="34" stroke="#ff6b35" strokeWidth="6" fill="none" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - 5.5 / 10)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: "#ff6b35" }}>5.5</span>
                  </div>
                </div>
                <span className="text-xs font-semibold mt-1" style={{ color: "#ff6b35" }}>Poor</span>
              </div>
            </div>

            {/* Overview Row */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <div className="bg-muted/20 px-5 py-3 text-sm font-medium text-muted-foreground border-b border-border/50">Overview</div>
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-secondary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">MaRe Head Spa System</p>
                    <p className="font-semibold text-sm">Senior Software Engineer (Fu...</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center border border-border/50"><FileText className="w-5 h-5 text-muted-foreground" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Your resume</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">Ahmad Kanaan</p>
                      <span className="text-xs text-primary flex items-center gap-1 cursor-pointer">Select <ChevronDown className="w-3 h-3" /></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Rows */}
            <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/50">
              {/* Job Title */}
              <div className="flex items-center px-5 py-4 gap-4">
                <span className="text-sm font-medium w-36 flex-shrink-0 flex items-center gap-1.5">Job Title <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" /></span>
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm flex-1">Senior Software Engineer (Full Stack)</span>
                <span className="text-sm text-muted-foreground">Full Stack Developer</span>
              </div>

              {/* Industry Experience */}
              <div className="flex items-start px-5 py-4 gap-4">
                <span className="text-sm font-medium w-36 flex-shrink-0 mt-0.5">Industry Experience</span>
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {["Healthcare", "Wellness", "Medical Services", "Health", "Fitness Services"].map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs font-normal border-border/50 bg-muted/20">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* Job Keywords */}
              <div className="flex items-start px-5 py-4 gap-4">
                <span className="text-sm font-medium w-36 flex-shrink-0 mt-0.5">Job Keywords (7/18)</span>
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {MATCHED_SKILLS.map(s => (
                    <Badge key={s} className="bg-primary/15 text-primary border border-primary/25 text-xs font-normal">
                      <CheckCircle2 className="w-3 h-3 mr-1" />{s}
                    </Badge>
                  ))}
                  {UNMATCHED_SKILLS.slice(0, 4).map(s => (
                    <Badge key={s} variant="outline" className="text-xs font-normal border-border/50 bg-muted/20">{s}</Badge>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="flex items-start px-5 py-4 gap-4">
                <span className="text-sm font-medium w-36 flex-shrink-0 mt-0.5">Summary</span>
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground flex-1">Your resume lacks a summary section, which is essential for quickly highlighting your relevant skills and experiences to recruiters.</p>
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
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-md flex items-center justify-center shadow-[0_0_8px_rgba(223,255,0,0.3)]"><CheckCircle2 className="w-4 h-4" /></div>
                    <span className="font-medium">Summary</span>
                  </div>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-md flex items-center justify-center shadow-[0_0_8px_rgba(223,255,0,0.3)]"><CheckCircle2 className="w-4 h-4" /></div>
                    <span className="font-medium">Skills</span>
                  </div>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-md flex items-center justify-center shadow-[0_0_8px_rgba(223,255,0,0.3)]"><CheckCircle2 className="w-4 h-4" /></div>
                      <span className="font-medium">Work Experience</span>
                    </div>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="pl-9 space-y-3">
                    <label className="flex items-center gap-3 text-sm cursor-pointer">
                      <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_4px_rgba(223,255,0,0.5)]"></div>
                      </div>
                      <span className="text-primary font-medium">Quick Edit</span>
                      <span className="text-muted-foreground">(First 2 key experiences)</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                      <Circle className="w-4 h-4 flex-shrink-0" />
                      <span>Full Edit (All experiences with longer processing time)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Keywords */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">2. Add missing skill keywords <span className="text-muted-foreground font-normal">(0/11)</span></h3>
                <button className="text-sm text-foreground underline underline-offset-2 hover:text-primary transition-colors">Select all</button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {ALL_SKILLS.map(skill => (
                  <label key={skill} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-muted/20 border border-border/50 hover:border-primary/40 hover:bg-muted/40 cursor-pointer transition-all text-sm select-none">
                    <Checkbox className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                    <span>{skill}</span>
                  </label>
                ))}
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

        {/* ========== STEP 3: Review ========== */}
        {step === 3 && (
          <div className="p-6 pb-28 flex flex-col items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Your New Resume is Ready!</h2>
              <p className="text-muted-foreground max-w-md">We&apos;ve optimized your resume to better match this position. Download it below or apply directly.</p>
            </div>
          </div>
        )}

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-4 flex justify-center items-center gap-3">
          {step > 1 && (
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full border-border/50" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} className="h-11 px-8 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-[0_0_12px_rgba(223,255,0,0.25)] hover:shadow-[0_0_20px_rgba(223,255,0,0.4)] transition-all">
              {step === 1 ? "Continue" : "Generate My New Resume"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button className="h-11 px-8 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-[0_0_12px_rgba(223,255,0,0.25)] hover:shadow-[0_0_20px_rgba(223,255,0,0.4)] transition-all">
              Download Resume
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
