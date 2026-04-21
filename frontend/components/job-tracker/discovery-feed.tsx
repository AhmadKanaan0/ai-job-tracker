"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MatchScoreGauge } from "@/components/job-tracker/match-gauges"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
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
  Share2,
  Flag,
  Check,
} from "lucide-react"

const initialFilterOptions = {
  role: ["Backend Engineer", "Frontend Engineer", "Full Stack Developer", "Data Scientist", "DevOps Engineer"],
  level: ["Entry Level", "Mid Level", "Senior Level", "Lead/Staff"],
  type: ["Full-time", "Part-time", "Contract", "Internship"],
  workplace: ["Remote", "Hybrid", "Onsite"]
}

const dateOptions = [
  { label: "Past 24 hours", value: "24h" },
  { label: "Past Week", value: "7d" },
  { label: "Past Month", value: "30d" },
  { label: "Any time", value: "all" },
]

const experienceOptions = [
  { label: "0-2 years", value: "0-2" },
  { label: "2-5 years", value: "2-5" },
  { label: "5-8 years", value: "5-8" },
  { label: "8+ years", value: "8+" },
]

import { useJobs, useSearchJobs } from "@/hooks/use-jobs"
import { useTrackedJobs } from "@/hooks/use-tracker"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useMemo, useRef } from "react"
import { toast } from "sonner"

export function DiscoveryFeed() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("recommended")
  const [savedJobs, setSavedJobs] = useState<number[]>([])
  const [hiddenJobs, setHiddenJobs] = useState<number[]>([])
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [sortBy, setSortBy] = useState("recommended")
  const [countries, setCountries] = useState<string[]>([])
  const [isLoadingCountries, setIsLoadingCountries] = useState(true)

  const { data: jobsList, isLoading } = useJobs()
  const { data: trackedJobs = [] } = useTrackedJobs()
  const { user } = useAuth()
  const searchMutation = useSearchJobs()
  const hasAutoSearched = useRef(false)

  const isSearching = searchMutation.isPending

  // Fetch countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name")
        if (!response.ok) throw new Error("Failed to fetch countries")
        const data = await response.json()
        const sortedCountries = data
          .map((c: any) => c.name.common)
          .sort((a: string, b: string) => a.localeCompare(b))
        setCountries(sortedCountries)
      } catch (err) {
        console.error("Error fetching countries:", err)
        setCountries(["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "India", "China", "Japan"])
      } finally {
        setIsLoadingCountries(false)
      }
    }
    fetchCountries()
  }, [])

  useEffect(() => {
    if (!isLoading && (!jobsList || jobsList.length === 0) && user && !hasAutoSearched.current) {
      hasAutoSearched.current = true
      const preferredRole = user.desired_roles?.[0] || "Software Engineer"
      const preferredLoc = user.preferred_location || undefined
      
      setSearchQuery(preferredRole)
      searchMutation.mutate({ 
        query: preferredRole, 
        location: preferredLoc,
        limit: 20 
      })
    }
  }, [isLoading, jobsList, user])

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      searchMutation.mutate({ 
        query: searchQuery, 
        limit: 20,
        location: activeFilters.location?.[0] || undefined
      })
    }
  }

  const toggleFilter = (key: string, value: string) => {
    setActiveFilters(prev => {
      const current = prev[key] || []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [key]: updated }
    })
  }

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

  const sortedJobs = useMemo(() => {
    let result = (jobsList || []).filter(job => {
      const isHidden = hiddenJobs.includes(job.id)
      const isTracked = trackedJobs.some(tj => tj.job.id === job.id)
      if (isHidden || isTracked) return false

      // Apply filters
      for (const [key, selected] of Object.entries(activeFilters)) {
        if (selected.length === 0) continue

        if (key === "location") {
          if (!selected.some(loc => job.location?.toLowerCase().includes(loc.toLowerCase()))) return false
        }
        if (key === "role") {
          if (!selected.some(role => job.title?.toLowerCase().includes(role.toLowerCase()))) return false
        }
        if (key === "level") {
          if (!selected.some(level => job.experience_level?.toLowerCase().includes(level.toLowerCase()))) return false
        }
        if (key === "type") {
          if (!selected.some(type => job.job_type?.toLowerCase().includes(type.toLowerCase()))) return false
        }
        if (key === "workplace") {
          if (!selected.some(wp => job.remote?.toLowerCase() === wp.toLowerCase())) return false
        }
        if (key === "datePosted") {
          if (selected[0] === "all") continue
          const now = new Date()
          const jobDate = new Date(job.posted_at || job.scraped_at)
          const diff = (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60) // hours
          if (selected[0] === "24h" && diff > 24) return false
          if (selected[0] === "7d" && diff > 24 * 7) return false
          if (selected[0] === "30d" && diff > 24 * 30) return false
        }
        if (key === "experience") {
          const text = ((job.experience_level || "") + " " + (job.description || "")).toLowerCase()
          // Check for strings like "2+ years", "5 years", etc.
          if (!selected.some(exp => {
            const num = parseInt(exp.split("-")[0])
            return text.includes(`${num} year`) || text.includes(`${num}+ year`) || text.includes(exp.toLowerCase())
          })) return false
        }
      }

      return true
    })

    // Sort
    if (sortBy === "match") {
      result.sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
    } else if (sortBy === "recent") {
      result.sort((a, b) => new Date(b.scraped_at || b.scraped_at).getTime() - new Date(a.scraped_at || a.scraped_at).getTime())
    }

    return result
  }, [jobsList, hiddenJobs, trackedJobs, activeFilters, sortBy])

  if (isLoading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Scanning the market for opportunities...</div>

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

        <form onSubmit={handleSearch} className="relative flex-1 max-w-md ml-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search by title or company" 
            className="pl-10 bg-muted/50 border-border/50" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </form>
      </div>

      {/* Filter Badges */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Location Popover (Searchable) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "border-border/50 bg-muted/30 hover:bg-muted/50 rounded-xl",
                activeFilters.location?.length && "border-primary bg-primary/10"
              )}
            >
              <MapPin className="w-4 h-4 mr-2" />
              {activeFilters.location?.length 
                ? activeFilters.location[0] + (activeFilters.location.length > 1 ? ` +${activeFilters.location.length - 1}` : "")
                : "Location"}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl" align="start">
            <Command className="bg-transparent">
              <CommandInput placeholder="Search location..." className="h-10" />
              <CommandList className="max-h-[300px]">
                {isLoadingCountries ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No location found.</CommandEmpty>
                    <CommandGroup heading="Countries">
                      {countries.map((country) => (
                        <CommandItem
                          key={country}
                          onSelect={() => toggleFilter("location", country)}
                          className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-primary/10"
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 text-primary",
                              activeFilters.location?.includes(country) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {country}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {Object.entries(initialFilterOptions).map(([key, options]) => (
          <DropdownMenu key={key}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "border-border/50 bg-muted/30 hover:bg-muted/50 rounded-xl",
                  activeFilters[key]?.length && "border-primary bg-primary/10"
                )}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
                {activeFilters[key]?.length ? <Badge className="ml-2 bg-primary text-primary-foreground text-xs">+{activeFilters[key].length}</Badge> : null}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border min-w-[180px]">
              {options.map(option => (
                <DropdownMenuCheckboxItem 
                  key={option} 
                  className="cursor-pointer"
                  checked={activeFilters[key]?.includes(option)}
                  onCheckedChange={() => toggleFilter(key, option)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {option}
                </DropdownMenuCheckboxItem>
              ))}
              {activeFilters[key]?.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-center justify-center text-xs text-muted-foreground"
                    onSelect={() => setActiveFilters(prev => ({ ...prev, [key]: [] }))}
                  >
                    Clear Filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
        
        {/* Date Posted Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "border-border/50 bg-muted/30 hover:bg-muted/50 rounded-xl",
                activeFilters.datePosted?.length && activeFilters.datePosted[0] !== "all" && "border-primary bg-primary/10"
              )}
            >
              <Clock className="w-4 h-4 mr-2" />
              {activeFilters.datePosted?.length && activeFilters.datePosted[0] !== "all"
                ? dateOptions.find(o => o.value === activeFilters.datePosted![0])?.label 
                : "Date Posted"}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover border-border w-48">
            {dateOptions.map(option => (
              <DropdownMenuCheckboxItem 
                key={option.value} 
                className="cursor-pointer"
                checked={activeFilters.datePosted?.includes(option.value)}
                onCheckedChange={() => setActiveFilters(prev => ({ ...prev, datePosted: [option.value] }))}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Experience Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "border-border/50 bg-muted/30 hover:bg-muted/50 rounded-xl",
                activeFilters.experience?.length && "border-primary bg-primary/10"
              )}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              {activeFilters.experience?.length 
                ? activeFilters.experience[0] + (activeFilters.experience.length > 1 ? ` +${activeFilters.experience.length - 1}` : "")
                : "Experience"}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover border-border w-48">
            {experienceOptions.map(option => (
              <DropdownMenuCheckboxItem 
                key={option.value} 
                className="cursor-pointer"
                checked={activeFilters.experience?.includes(option.value)}
                onCheckedChange={() => toggleFilter("experience", option.value)}
                onSelect={(e) => e.preventDefault()}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
            {activeFilters.experience?.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-center justify-center text-xs text-muted-foreground"
                  onSelect={() => setActiveFilters(prev => ({ ...prev, experience: [] }))}
                >
                  Clear Filter
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" className="border-border/50 bg-muted/30 rounded-xl">
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
        {isSearching && sortedJobs.length === 0 && (
          <div className="p-12 text-center text-muted-foreground animate-pulse">
            Searching for "{searchQuery}" across top job portals...
          </div>
        )}
        
        {sortedJobs.map(job => (
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
                          {job.posted_at || "Just now"}
                        </Badge>
                        {job.is_early_applicant && (
                          <Badge className="bg-primary/20 text-primary text-xs">
                            Be an early applicant
                          </Badge>
                        )}
                      </div>
                      
                      {/* Title & Company */}
                      <h3 className="text-xl font-semibold hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {job.company} / <span className="text-muted-foreground/70">{(job.tags || []).join(" · ")}</span>
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
                    {job.location || "Remote"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {job.job_type || "Full-time"}
                  </span>
                  {job.salary_max && job.salary_min !== null && (
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      {job.salary_currency}{(job.salary_min || 0) / 1000}k - {job.salary_max / 1000}k
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    {job.remote || "Hybrid"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    {job.experience_level || "Not specified"}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {job.applicants_count || "0 applicants"}
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
                <MatchScoreGauge score={job.match_score || 0} size="sm" />
                {job.no_h1b && (
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
