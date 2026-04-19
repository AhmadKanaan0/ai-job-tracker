"use client";

import Link from "next/link";
import { useState, use } from "react";
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

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const jobId = parseInt(unwrappedParams.id);
  const displayJob = jobs.find(j => j.id === jobId) || jobs[0];

  const [resumeOpen, setResumeOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Drawers */}
      <ResumeDrawer open={resumeOpen} onOpenChange={setResumeOpen} />
      <CoverLetterDrawer open={coverOpen} onOpenChange={setCoverOpen} />

      <div className="flex">
        {/* ====== MAIN CONTENT ====== */}
        <div className="flex-1 min-w-0">
          
          {/* Top Action Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/discovery">
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
              </Link>
              <span className="text-sm text-muted-foreground">{displayJob.applicants}</span>
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
                  <span className="text-sm text-muted-foreground">· {displayJob.posted}</span>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold mb-4">{displayJob.role}</h1>

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {displayJob.location}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {displayJob.jobType}</span>
                  {displayJob.salary && <span className="flex items-center gap-1">💰 {displayJob.salary}</span>}
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {displayJob.experience}</span>
                </div>
              </div>

              {/* Match Score */}
              <div className="flex flex-col items-center flex-shrink-0">
                <MatchScoreGauge score={displayJob.matchScore} size="md" />
                <div className="mt-3 flex gap-4">
                  {[
                    { label: "Exp. Level", val: "88%" },
                    { label: "Skill", val: "60%" },
                    { label: "Industry Exp.", val: "39%" },
                  ].map(g => (
                    <div key={g.label} className="text-center">
                      <div className="w-10 h-10 mx-auto rounded-full border-2 border-primary/40 flex items-center justify-center mb-0.5">
                        <span className="text-xs font-bold text-primary">{g.val}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground leading-tight block">{g.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-foreground/85 leading-relaxed mb-4">
              <span className="font-semibold">{displayJob.company}</span> is reimagining its industry by providing advanced solutions. They are seeking a <span className="font-semibold underline">{displayJob.role}</span> to own product areas end-to-end, drive AI strategy, and shape engineering culture within a small, impactful team.
            </p>

            {/* Industry Tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {displayJob.industry.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs font-normal border-border/50 bg-muted/20 py-0.5 px-2">{tag}</Badge>
              ))}
            </div>
            {displayJob.noH1B && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
                🚫 No H1B <HelpCircle className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Insider Connection */}
          <div className="mx-6 mb-6 border border-border/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold flex items-center text-base"><Sparkles className="w-4 h-4 mr-2 text-primary" />Insider Connection @{displayJob.company}</h3>
              <Badge className="bg-primary/20 text-primary border border-primary/30 text-xs">2 email credits available today</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Discover valuable connections within the company who might provide insights and potential referrals.</p>
            <p className="text-sm text-muted-foreground mb-3"><span className="font-semibold underline">Get 3x more responses when you reach out via email instead of LinkedIn.</span></p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Paste any LinkedIn profile URL to find work emails instantly." className="bg-muted/20 border-border/50 h-10 pl-10 pr-28 text-sm" />
              <Button className="absolute right-1 top-1 h-8 bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-3 rounded-md">Find Email</Button>
            </div>
          </div>

          {/* Responsibilities */}
          <div className="px-6 mb-6">
            <h3 className="text-base font-bold flex items-center mb-4"><BriefcaseBusiness className="w-5 h-5 mr-2 text-primary" />Responsibilities</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start"><span className="text-primary mr-2 mt-0.5">•</span><span><strong className="text-foreground">End-to-End Ownership:</strong> Work across the full stack to develop new features, maintain existing codebase, and ensure high availability</span></li>
              <li className="flex items-start"><span className="text-primary mr-2 mt-0.5">•</span><span><strong className="text-foreground">Infrastructure & DevOps:</strong> Manage cloud services, improve CI/CD pipelines, and oversee IaC provisioning</span></li>
              <li className="flex items-start"><span className="text-primary mr-2 mt-0.5">•</span><span><strong className="text-foreground">Technical Strategy:</strong> Research solutions, create PoCs, and keep technology currency up to date</span></li>
              <li className="flex items-start"><span className="text-primary mr-2 mt-0.5">•</span><span><strong className="text-foreground">Collaboration:</strong> Communicate frequently with business stakeholders to translate requirements into deliverables</span></li>
            </ul>
          </div>

          {/* Qualifications */}
          <div className="px-6 pb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center"><Target className="w-5 h-5 mr-2 text-primary" />Qualification</h3>
              <span className="text-xs text-muted-foreground flex items-center"><ThumbsUp className="w-3 h-3 mr-1" /> Represents the skills you have</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Find out how your skills align with this job&apos;s requirements.</p>
            <div className="flex flex-wrap gap-1.5">
              {["React", "TypeScript", "NodeJS", "PostgreSQL", "AWS"].map(s => (
                <Badge key={s} className="bg-primary/15 text-primary border border-primary/25 py-1 px-2.5 text-xs"><ThumbsUp className="w-3 h-3 mr-1" /> {s}</Badge>
              ))}
              {["SCSS", "JavaScript", "Python", "Android Development", "Kotlin"].map(s => (
                <Badge key={s} variant="outline" className="bg-muted/20 text-muted-foreground border-border/50 py-1 px-2.5 text-xs font-normal">{s}</Badge>
              ))}
            </div>
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
            <div className="rounded-xl p-4 border border-border/50 cursor-pointer hover:bg-muted/20 transition-all">
              <ThumbsUp className="w-5 h-5 text-muted-foreground mb-2" />
              <h4 className="font-bold text-sm mb-0.5">Analyze How Well You Fit</h4>
              <p className="text-xs text-muted-foreground">Understand your strength & weakness</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
