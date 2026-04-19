"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Job, jobs } from "@/lib/data/jobs"
import { MatchScoreGauge, MiniMatchGauge } from "@/components/job-tracker/match-gauges"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  MapPin, 
  Clock, 
  Building2, 
  Heart, 
  Ban,
  MoreHorizontal,
  Sparkles,
  Briefcase,
  DollarSign,
  Users,
  Globe,
  ChevronDown,
  X,
  ExternalLink,
  Share2,
  Flag,
  FileText,
  ThumbsUp,
  Zap,
  CheckCircle,
  Target
} from "lucide-react"



const filterOptions = {
  location: ["United States", "San Francisco", "New York", "Remote"],
  role: ["Backend Engineer", "Frontend Engineer", "Full Stack Developer"],
  level: ["Entry Level", "Mid Level", "Senior Level", "Lead/Staff"],
  type: ["Full-time", "Part-time", "Contract"],
  workplace: ["Remote", "Hybrid", "Onsite"]
}


export function DiscoveryFeed() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("recommended")
    const [savedJobs, setSavedJobs] = useState<number[]>([])
  const [hiddenJobs, setHiddenJobs] = useState<number[]>([])
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [sortBy, setSortBy] = useState("recommended")

  const toggleSave = (jobId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSavedJobs(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    )
  }

  const hideJob = (jobId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setHiddenJobs(prev => [...prev, jobId])
  }

  const visibleJobs = jobs.filter(job => !hiddenJobs.includes(job.id))

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 h-12 p-1">
            <TabsTrigger value="recommended" className="px-6 data-[state=active]:bg-background">
              Recommended
            </TabsTrigger>
            <TabsTrigger value="liked" className="px-6 data-[state=active]:bg-background">
              Liked <Badge variant="secondary" className="ml-2 bg-muted">{savedJobs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="applied" className="px-6 data-[state=active]:bg-background">
              Applied <Badge variant="secondary" className="ml-2 bg-muted">0</Badge>
            </TabsTrigger>
            <TabsTrigger value="external" className="px-6 data-[state=active]:bg-background">
              External <Badge variant="secondary" className="ml-2 bg-muted">0</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-md ml-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search by title or company" className="pl-10 bg-muted/50 border-border/50" />
        </div>
      </div>

      {/* Filter Badges */}
      <div className="flex flex-wrap items-center gap-3">
        {Object.entries(filterOptions).map(([key, options]) => (
          <DropdownMenu key={key}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={`border-border/50 bg-muted/30 hover:bg-muted/50 ${activeFilters[key]?.length ? 'border-primary bg-primary/10' : ''}`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
                {activeFilters[key]?.length ? <Badge className="ml-2 bg-primary text-primary-foreground text-xs">+{activeFilters[key].length}</Badge> : null}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border">
              {options.map(option => (
                <DropdownMenuItem key={option} className="cursor-pointer">
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
        
        <Button variant="outline" className="border-border/50 bg-muted/30">
          Date Posted
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
        
        <Button variant="outline" className="border-border/50 bg-muted/30">
          Years of Experience
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>

        <Button variant="outline" className="border-border/50 bg-muted/30">
          <span className="flex items-center gap-2">
            Hidden Jobs
          </span>
        </Button>

        <Button variant="outline" className="border-primary text-primary">
          <MoreHorizontal className="w-4 h-4 mr-2" />
          All Filters
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] bg-muted/30 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="match">Match Score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {visibleJobs.map(job => (
          <div 
            key={job.id}
            className="glass-card rounded-2xl overflow-hidden hover:border-primary/20 transition-all cursor-pointer"
            onClick={() => router.push("/dashboard/discovery/" + job.id)}
          >
            <div className="flex">
              {/* Main Content */}
              <div className="flex-1 p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    {/* Company Logo */}
                    <div className="w-16 h-16 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-8 h-8 text-secondary" />
                    </div>
                    
                    <div>
                      {/* Tags */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="bg-muted text-xs font-normal">
                          {job.posted}
                        </Badge>
                        {job.isEarlyApplicant && (
                          <Badge className="bg-primary/20 text-primary text-xs">
                            Be an early applicant
                          </Badge>
                        )}
                      </div>
                      
                      {/* Title & Company */}
                      <h3 className="text-xl font-semibold hover:text-primary transition-colors">
                        {job.role}
                      </h3>
                      <p className="text-muted-foreground">
                        {job.company} / <span className="text-muted-foreground/70">{job.industry.join(" · ")}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                        <Flag className="w-4 h-4 mr-2" />
                        Report Issue
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {job.jobType}
                  </span>
                  {job.salary && (
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      {job.salary}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    {job.locationType}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    {job.experience}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {job.applicants}
                  </span>
                  
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => hideJob(job.id, e)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Ban className="w-5 h-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => toggleSave(job.id, e)}
                      className={savedJobs.includes(job.id) ? "text-red-500" : "text-muted-foreground hover:text-foreground"}
                    >
                      <Heart className={`w-5 h-5 ${savedJobs.includes(job.id) ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="outline" className="border-border/50">
                      <Sparkles className="w-4 h-4 mr-2" />
                      ASK ORION
                    </Button>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      APPLY NOW
                    </Button>
                  </div>
                </div>
              </div>

              {/* Match Score Sidebar */}
              <div className="w-48 bg-gradient-to-b from-[#0a3d3d] to-[#0a2828] p-6 flex flex-col items-center justify-center border-l border-primary/20">
                <MatchScoreGauge score={job.matchScore} size="sm" />
                {job.noH1B && (
                  <Badge variant="outline" className="mt-3 border-muted-foreground/30 text-muted-foreground text-xs">
                    No H1B
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

          </div>
  )
}
