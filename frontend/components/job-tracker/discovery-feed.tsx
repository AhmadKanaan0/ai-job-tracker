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
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Shield,
  Upload,
} from "lucide-react"

const initialFilterOptions = {
  role: ["Backend Engineer", "Frontend Engineer", "Full Stack Developer", "Data Scientist", "DevOps Engineer"],
  level: ["Entry Level", "Mid Level", "Senior Level", "Lead/Staff"],
  type: ["Full-time", "Part-time", "Contract", "Internship"],
  workplace: ["Remote", "Hybrid", "Onsite"]
}

const sourceOptions = [
  // JSON API sources
  { label: "We Work Remotely",      value: "weworkremotely" },
  { label: "Remotive",              value: "remotive" },
  { label: "RemoteOK",              value: "remoteok" },
  { label: "Himalayas",             value: "himalayas" },
  { label: "Working Nomads",        value: "workingnomads" },
  { label: "HN Who's Hiring",       value: "hackernews" },
  { label: "YC Work at a Startup",  value: "workatastartup" },
  { label: "LinkedIn",              value: "linkedin" },
  { label: "Indeed",                value: "indeed" },
  // ATS boards
  { label: "Greenhouse",            value: "greenhouse" },
  { label: "Lever",                 value: "lever" },
  { label: "Ashby",                 value: "ashby" },
  { label: "Workable",              value: "workable" },
  // HTML-scraped boards
  { label: "ai-jobs.net",           value: "aijobsnet" },
  { label: "EU Remote Jobs",        value: "euremotejobs" },
  { label: "Nodesk",                value: "nodesk" },
  { label: "Truly Remote",          value: "trulyremote" },
  { label: "Forward Deploy",        value: "fwddeploy" },
  { label: "Welcome to the Jungle", value: "welcometothejungle" },
  { label: "TrueUp",                value: "trueup" },
  { label: "Remote Rocketship",     value: "remoterocketship" },
  { label: "DevRel Job",            value: "devreljob" },
  // Spain
  { label: "Getmanfred",            value: "getmanfred" },
  { label: "Tecnoempleo",           value: "tecnoempleo" },
  { label: "JobFluent",             value: "jobfluent" },
]

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

import { useJobs, useSearchJobs, useImportJobs } from "@/hooks/use-jobs"
import { useTrackedJobs } from "@/hooks/use-tracker"
import { useActiveCV } from "@/hooks/use-cv"
import { useAuth } from "@/lib/auth-context"
import { useCheckLegitimacy } from "@/hooks/use-analysis"
import { useEffect, useMemo, useRef } from "react"
import { toast } from "sonner"
import type { PostingLegitimacy } from "@/lib/types"

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
  const { data: activeCv } = useActiveCV()
  const { user } = useAuth()
  const searchMutation = useSearchJobs()
  const checkLegitimacy = useCheckLegitimacy()
  const hasAutoSearched = useRef(false)
  const [isProfileSearch, setIsProfileSearch] = useState(false)
  const [legitimacyMap, setLegitimacyMap] = useState<Record<number, PostingLegitimacy>>({})
  const [checkingLegitimacy, setCheckingLegitimacy] = useState<Record<number, boolean>>({})
  const [showHidden, setShowHidden] = useState(false)

  const isSearching = searchMutation.isPending
  const importMutation = useImportJobs()

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

  // Auto-search on mount using user preferences — search bar stays empty
  useEffect(() => {
    if (!isLoading && user && !hasAutoSearched.current) {
      hasAutoSearched.current = true
      setIsProfileSearch(true)

      // Build a rich query from user profile without populating the search bar
      const roles = user.desired_roles || []
      const skills = user.skills || []
      const experiences = user.experiences || []

      // Extract job titles from past experience
      const experienceTitles: string[] = []
      for (const exp of experiences.slice(0, 3)) {
        if (exp.jobTitle) experienceTitles.push(exp.jobTitle)
      }

      // Compute approximate years of experience
      let totalMonths = 0
      for (const exp of experiences) {
        const start = exp.startDate ? new Date(exp.startDate) : null
        const end = exp.currentlyWorking ? new Date() : exp.endDate ? new Date(exp.endDate) : null
        if (start && end) {
          totalMonths += Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
        }
      }
      const yearsOfExperience = Math.round(totalMonths / 12)

      // Build primary query: focus on desired role titles first
      const primaryRole = roles[0] || experienceTitles[0] || "Software Engineer"
      
      // Combine: primary role + experience titles + top skills for relevance
      const queryParts = [primaryRole]
      // Add similar role titles from experience
      for (const title of experienceTitles) {
        if (title.toLowerCase() !== primaryRole.toLowerCase()) {
          queryParts.push(title)
        }
      }
      // Add experience level hint
      if (yearsOfExperience > 0) {
        if (yearsOfExperience >= 8) queryParts.push("senior staff lead")
        else if (yearsOfExperience >= 5) queryParts.push("senior")
        else if (yearsOfExperience >= 2) queryParts.push("mid-level")
        else queryParts.push("junior entry-level")
      }
      // Add top skills for better matching
      if (skills.length > 0) {
        queryParts.push(...skills.slice(0, 3))
      }

      const richQuery = queryParts.join(" ")

      // Search silently — don't populate the search bar
      // Search silently — don't populate the search bar
      searchMutation.mutate({ 
        query: richQuery, 
        location: user.preferred_location || undefined,
        remote_only: user.open_to_remote ?? false,
        limit: 40 
      }, {
        onError: (err: any) => {
          const isApiLimit = err.status === 401 || err.status === 402 || err.status === 429;
          toast.error(err.message || "Failed to search jobs", {
            duration: isApiLimit ? 10000 : 4000,
            style: isApiLimit ? { border: '1px solid #ff4444', backgroundColor: '#ff444410' } : undefined
          });
        }
      })
    }
  }, [isLoading, user])

  // NOTE: AI scoring is done on-demand when the user opens a job detail page.
  // This saves API quota and prevents rate limiting on the discovery feed.

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      setIsProfileSearch(false)
      searchMutation.mutate({ 
        query: searchQuery, 
        limit: 40,
        location: activeFilters.location?.[0] || undefined
      }, {
        onError: (err: any) => {
          const isApiLimit = err.status === 401 || err.status === 402 || err.status === 429;
          toast.error(err.message || "Failed to search jobs", {
            duration: isApiLimit ? 10000 : 4000,
            style: isApiLimit ? { border: '1px solid #ff4444', backgroundColor: '#ff444410' } : undefined
          });
        }
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
    const all = jobsList || []

    // Tab-level pre-filter
    let result = all.filter(job => {
      const isHidden = hiddenJobs.includes(job.id)
      const isTracked = trackedJobs.some(tj => tj.job.id === job.id)
      const isSaved = savedJobs.includes(job.id)
      const isATS = ["greenhouse", "lever", "ashby"].includes(job.source || "")

      if (activeTab === "liked")    return isSaved && !isHidden
      if (activeTab === "applied")  return isTracked
      if (activeTab === "external") return isATS && !isHidden && !isTracked

      // "recommended" — hide tracked and hidden unless showHidden overrides hidden
      if (isTracked) return false
      if (isHidden && !showHidden) return false
      return true
    })

    // Apply dropdown filters
    for (const [key, selected] of Object.entries(activeFilters)) {
      if (!selected || selected.length === 0) continue
      result = result.filter(job => {
        if (key === "location") return selected.some(loc => job.location?.toLowerCase().includes(loc.toLowerCase()))
        if (key === "role")     return selected.some(role => job.title?.toLowerCase().includes(role.toLowerCase()))
        if (key === "level")    return selected.some(level => job.experience_level?.toLowerCase().includes(level.toLowerCase()))
        if (key === "type")     return selected.some(type => job.job_type?.toLowerCase().includes(type.toLowerCase()))
        if (key === "workplace") return selected.some(wp => job.remote?.toLowerCase() === wp.toLowerCase())
        if (key === "source")   return selected.includes(job.source || "")
        if (key === "datePosted") {
          if (selected[0] === "all") return true
          const diff = (Date.now() - new Date(job.posted_at || job.scraped_at).getTime()) / 3_600_000
          if (selected[0] === "24h" && diff > 24)    return false
          if (selected[0] === "7d"  && diff > 168)   return false
          if (selected[0] === "30d" && diff > 720)   return false
          return true
        }
        if (key === "experience") {
          const text = ((job.experience_level || "") + " " + (job.description || "")).toLowerCase()
          return selected.some(exp => {
            const num = parseInt(exp.split("-")[0])
            return text.includes(`${num} year`) || text.includes(`${num}+ year`) || text.includes(exp.toLowerCase())
          })
        }
        return true
      })
    }

    // Sort
    if (sortBy === "match")  result.sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
    if (sortBy === "recent") result.sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())

    return result
  }, [jobsList, hiddenJobs, trackedJobs, savedJobs, activeFilters, sortBy, activeTab, showHidden])

  const handleCheckLegitimacy = async (jobId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCheckingLegitimacy(prev => ({ ...prev, [jobId]: true }))
    try {
      const updated = await checkLegitimacy.mutateAsync(jobId)
      if (updated.posting_legitimacy) {
        setLegitimacyMap(prev => ({ ...prev, [jobId]: updated.posting_legitimacy! }))
      }
    } catch {
      toast.error("Legitimacy check failed")
    } finally {
      setCheckingLegitimacy(prev => ({ ...prev, [jobId]: false }))
    }
  }

  const LegitimacyBadge = ({ jobId, verdict }: { jobId: number; verdict: PostingLegitimacy | null | undefined }) => {
    const effective = legitimacyMap[jobId] || verdict
    if (!effective) return null
    const map = {
      high_confidence:       { icon: ShieldCheck, label: "Verified",  cls: "text-green-400 border-green-500/30 bg-green-500/10" },
      proceed_with_caution:  { icon: ShieldAlert, label: "Caution",   cls: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
      suspicious:            { icon: ShieldX,     label: "Suspicious", cls: "text-red-400 border-red-500/30 bg-red-500/10" },
    }
    const { icon: Icon, label, cls } = map[effective]
    return (
      <Badge variant="outline" className={cn("text-[10px] gap-1", cls)}>
        <Icon className="w-3 h-3" /> {label}
      </Badge>
    )
  }

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
              Applied <Badge variant="secondary" className="ml-2 bg-muted">{trackedJobs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="external" className="px-6 data-[state=active]:bg-background">
              ATS Boards <Badge variant="secondary" className="ml-2 bg-muted">{(jobsList || []).filter(j => ["greenhouse","lever","ashby"].includes(j.source || "")).length}</Badge>
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

        {/* Import JSON / CSV */}
        <input
          id="job-import-input"
          type="file"
          accept=".json,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            importMutation.mutate(file, {
              onSuccess: (imported) => toast.success(`Imported ${imported.length} jobs`),
              onError: (err: any) => toast.error(err.message || "Import failed"),
            })
            e.target.value = ""
          }}
        />
        <Button
          variant="outline"
          className="border-border/50 bg-muted/30 shrink-0"
          onClick={() => document.getElementById("job-import-input")?.click()}
          disabled={importMutation.isPending}
        >
          {importMutation.isPending
            ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
            : <Upload className="w-4 h-4 mr-2" />}
          Import
        </Button>
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

        <Button
          variant="outline"
          onClick={() => setShowHidden(p => !p)}
          className={cn(
            "border-border/50 bg-muted/30 rounded-xl",
            showHidden && "border-primary bg-primary/10"
          )}
        >
          <Ban className="w-4 h-4 mr-2" />
          Hidden {hiddenJobs.length > 0 && <Badge variant="secondary" className="ml-1 bg-muted">{hiddenJobs.length}</Badge>}
        </Button>

        {/* Source filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "border-border/50 bg-muted/30 hover:bg-muted/50 rounded-xl",
                activeFilters.source?.length && "border-primary bg-primary/10"
              )}
            >
              <Globe className="w-4 h-4 mr-2" />
              Source
              {activeFilters.source?.length ? <Badge className="ml-2 bg-primary text-primary-foreground text-xs">+{activeFilters.source.length}</Badge> : null}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover border-border min-w-[200px]">
            {sourceOptions.map(opt => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                className="cursor-pointer"
                checked={activeFilters.source?.includes(opt.value)}
                onCheckedChange={() => toggleFilter("source", opt.value)}
                onSelect={(e) => e.preventDefault()}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
            {activeFilters.source?.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-center justify-center text-xs text-muted-foreground"
                  onSelect={() => setActiveFilters(prev => ({ ...prev, source: [] }))}
                >
                  Clear Filter
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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
          <div className="p-12 text-center animate-pulse">
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              <p className="text-muted-foreground text-lg">
                {isProfileSearch 
                  ? "Matching jobs to your profile preferences..." 
                  : `Searching for "${searchQuery}" across top job portals...`}
              </p>
              {isProfileSearch && (
                <p className="text-sm text-muted-foreground/60">
                  Based on your desired roles, skills, and experience
                </p>
              )}
            </div>
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
                        <LegitimacyBadge jobId={job.id} verdict={job.posting_legitimacy} />
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
                      <DropdownMenuItem
                        onClick={(e) => handleCheckLegitimacy(job.id, e)}
                        disabled={checkingLegitimacy[job.id]}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {checkingLegitimacy[job.id] ? "Checking..." : "Check Legitimacy"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(job.url); toast.success("Link copied to clipboard") }}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Copy Link
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
                    <Button
                      variant="outline"
                      className="border-border/50"
                      onClick={(e) => { e.stopPropagation(); router.push("/dashboard/discovery/" + job.id) }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      ANALYZE
                    </Button>
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={(e) => { e.stopPropagation(); window.open(job.url, "_blank", "noopener,noreferrer") }}
                    >
                      APPLY NOW
                    </Button>
                  </div>
                </div>
              </div>

              {/* Match Score Sidebar */}
              <div className="w-48 bg-gradient-to-b from-[#0a3d3d] to-[#0a2828] p-6 flex flex-col items-center justify-center border-l border-primary/20">
                {job.match_score ? (
                  <MatchScoreGauge 
                    score={job.match_score} 
                    size="sm" 
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary/40" />
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 leading-tight">Click to<br/>analyze fit</span>
                  </div>
                )}
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
