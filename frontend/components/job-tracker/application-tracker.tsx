"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  MoreHorizontal, 
  ExternalLink, 
  Search, 
  ChevronDown,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  SlidersHorizontal
} from "lucide-react"

import { useTrackedJobs, useUpdateTracker, useRemoveFromTracker } from "@/hooks/use-tracker"
import type { TrackedJob } from "@/lib/types"
import { format } from "date-fns"
import { toast } from "sonner"

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  saved: { label: "Saved", className: "bg-muted text-muted-foreground border-muted", icon: <Clock className="w-3 h-3" /> },
  applied: { label: "Applied", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <CheckCircle className="w-3 h-3" /> },
  phone_screen: { label: "Phone Screen", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Briefcase className="w-3 h-3" /> },
  interview: { label: "Interview", className: "bg-secondary/20 text-secondary border-secondary/30", icon: <Briefcase className="w-3 h-3" /> },
  take_home: { label: "Take Home", className: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: <Briefcase className="w-3 h-3" /> },
  final_round: { label: "Final Round", className: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: <Briefcase className="w-3 h-3" /> },
  offer: { label: "Offer", className: "bg-primary text-primary-foreground border-primary", icon: <CheckCircle className="w-3 h-3" /> },
  accepted: { label: "Accepted", className: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive/80 border-destructive/30", icon: <XCircle className="w-3 h-3" /> },
  ghosted: { label: "Ghosted", className: "bg-muted/50 text-muted-foreground/50 border-muted", icon: <XCircle className="w-3 h-3" /> },
  withdrawn: { label: "Withdrawn", className: "bg-muted text-muted-foreground border-muted", icon: <XCircle className="w-3 h-3" /> },
}

const allStatuses = [
  "saved",
  "applied",
  "phone_screen",
  "interview",
  "take_home",
  "final_round",
  "offer",
  "accepted",
  "rejected",
  "ghosted",
  "withdrawn",
]
const locations = ["All", "Remote", "Hybrid", "Onsite"]
const PAGE_SIZES = [5, 10, 20, 50]

type SortField = "date" | "match" | "company" | "status" | "salary"
type SortDir = "asc" | "desc"

export function ApplicationTracker() {
  const { data: applications = [], isLoading } = useTrackedJobs()
  const updateTracker = useUpdateTracker()
  const removeTracker = useRemoveFromTracker()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | "all">("all")
  const [locationFilter, setLocationFilter] = useState("All")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [selectedJob, setSelectedJob] = useState<TrackedJob | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [visibleColumns, setVisibleColumns] = useState({
    company: true,
    location: true,
    salary: true,
    date: true,
    match: true,
    status: true,
    nextAction: true
  })

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await updateTracker.mutateAsync({ id, status: newStatus })
      toast.success(`Status updated to ${statusConfig[newStatus]?.label || newStatus}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    }
  }

  const deleteSelected = async () => {
    try {
      await Promise.all(selectedRows.map(id => removeTracker.mutateAsync(id)))
      setSelectedRows([])
      toast.success("Applications deleted")
    } catch (err: any) {
      toast.error("Failed to delete some applications")
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const filteredAndSorted = useMemo(() => {
    let result = applications.filter(app => {
      const matchesSearch = 
        app.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.job.company.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || app.status === statusFilter
      const matchesLocation = locationFilter === "All" || app.job.remote === locationFilter
      return matchesSearch && matchesStatus && matchesLocation
    })

    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "match":
          comparison = (a.match_score || 0) - (b.match_score || 0)
          break
        case "company":
          comparison = a.job.company.localeCompare(b.job.company)
          break
        case "status":
          comparison = allStatuses.indexOf(a.status) - allStatuses.indexOf(b.status)
          break
        case "salary":
          comparison = (a.job.salary_min || 0) - (b.job.salary_min || 0)
          break
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      return sortDir === "asc" ? comparison : -comparison
    })

    return result
  }, [applications, searchQuery, statusFilter, locationFilter, sortField, sortDir])

  const totalPages = Math.ceil(filteredAndSorted.length / pageSize)
  const paginatedData = filteredAndSorted.slice((page - 1) * pageSize, page * pageSize)

  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(paginatedData.map(app => app.id))
    }
  }

  const toggleSelectRow = (id: number) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applications.length }
    allStatuses.forEach(s => {
      counts[s] = applications.filter(a => a.status === s).length
    })
    return counts
  }, [applications])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground/50" />
    return sortDir === "asc" ? <ArrowUp className="w-4 h-4 ml-1 text-primary" /> : <ArrowDown className="w-4 h-4 ml-1 text-primary" />
  }

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading tracked applications...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search by job title or company..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              className="pl-10 bg-muted/50 border-border/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Location Filter */}
          <Select value={locationFilter} onValueChange={(v) => { setLocationFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[150px] bg-muted/50 border-border/50">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-border/50">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {Object.entries(visibleColumns).map(([key, value]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={value}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, [key]: checked})}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter("all"); setPage(1) }}
            className={statusFilter === "all" ? "bg-primary text-primary-foreground" : "border-border/50"}
          >
            All ({statusCounts.all})
          </Button>
          {allStatuses.map(status => {
            const count = statusCounts[status] || 0
            if (count === 0 && statusFilter !== status) return null
            return (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => { setStatusFilter(status); setPage(1) }}
                className={statusFilter === status ? statusConfig[status]?.className : "border-border/50"}
              >
                {statusConfig[status]?.icon}
                <span className="ml-1">{statusConfig[status]?.label} ({count})</span>
              </Button>
            )
          })}
          
          {/* Bulk Actions */}
          {selectedRows.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedRows.length} selected</span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={deleteSelected}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                  onCheckedChange={toggleSelectAll}
                  className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </TableHead>
              <TableHead className="text-muted-foreground">
                <button onClick={() => handleSort("company")} className="flex items-center hover:text-foreground">
                  Job Title
                  <SortIcon field="company" />
                </button>
              </TableHead>
              {visibleColumns.company && (
                <TableHead className="text-muted-foreground">Company</TableHead>
              )}
              {visibleColumns.location && (
                <TableHead className="text-muted-foreground">Location</TableHead>
              )}
              {visibleColumns.salary && (
                <TableHead className="text-muted-foreground">
                  <button onClick={() => handleSort("salary")} className="flex items-center hover:text-foreground">
                    Salary
                    <SortIcon field="salary" />
                  </button>
                </TableHead>
              )}
              {visibleColumns.date && (
                <TableHead className="text-muted-foreground">
                  <button onClick={() => handleSort("date")} className="flex items-center hover:text-foreground">
                    Date Applied
                    <SortIcon field="date" />
                  </button>
                </TableHead>
              )}
              {visibleColumns.match && (
                <TableHead className="text-muted-foreground text-center">
                  <button onClick={() => handleSort("match")} className="flex items-center justify-center hover:text-foreground">
                    Match
                    <SortIcon field="match" />
                  </button>
                </TableHead>
              )}
              {visibleColumns.status && (
                <TableHead className="text-muted-foreground">
                  <button onClick={() => handleSort("status")} className="flex items-center hover:text-foreground">
                    Status
                    <SortIcon field="status" />
                  </button>
                </TableHead>
              )}
              {visibleColumns.nextAction && (
                <TableHead className="text-muted-foreground">Next Action</TableHead>
              )}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((app) => (
              <TableRow 
                key={app.id} 
                className={`border-border/50 hover:bg-muted/30 cursor-pointer ${selectedRows.includes(app.id) ? 'bg-primary/5' : ''}`}
                onClick={() => setSelectedJob(app)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={selectedRows.includes(app.id)}
                    onCheckedChange={() => toggleSelectRow(app.id)}
                    className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </TableCell>
                <TableCell className="font-medium">{app.job.title}</TableCell>
                {visibleColumns.company && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-secondary" />
                      </div>
                      {app.job.company}
                    </div>
                  </TableCell>
                )}
                {visibleColumns.location && (
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {app.job.location || app.job.remote || "Remote"}
                    </div>
                  </TableCell>
                )}
                {visibleColumns.salary && (
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1 text-xs">
                      <DollarSign className="w-3 h-3" />
                      {app.job.salary_min ? `${app.job.salary_currency}${app.job.salary_min / 1000}k - ${app.job.salary_max ? app.job.salary_max / 1000 : '?'}k` : "Not specified"}
                    </div>
                  </TableCell>
                )}
                {visibleColumns.date && (
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {app.applied_date ? format(new Date(app.applied_date), "MMM d, yyyy") : format(new Date(app.created_at), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                )}
                {visibleColumns.match && (
                  <TableCell className="text-center">
                    <span 
                      className="font-mono font-bold"
                      style={{ 
                        color: (app.match_score || 0) >= 90 ? '#DFFF00' : 
                               (app.match_score || 0) >= 80 ? '#00D4FF' : 
                               (app.match_score || 0) >= 70 ? '#A020F0' : '#888'
                      }}
                    >
                      {app.match_score ? `${app.match_score}%` : '-%'}
                    </span>
                  </TableCell>
                )}
                {visibleColumns.status && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                          <Badge className={`${statusConfig[app.status]?.className || 'bg-muted'} cursor-pointer`}>
                            {statusConfig[app.status]?.icon || <Clock className="w-3 h-3" />}
                            <span className="ml-1">{statusConfig[app.status]?.label || app.status}</span>
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {allStatuses.map(status => (
                          <DropdownMenuItem 
                            key={status}
                            onClick={() => updateStatus(app.id, status)}
                            className={app.status === status ? "bg-muted" : ""}
                          >
                            <span className={`flex items-center gap-2 ${app.status === status ? "font-medium" : ""}`}>
                              {statusConfig[status]?.icon}
                              {statusConfig[status]?.label}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
                {visibleColumns.nextAction && (
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {app.next_action || "None"}
                  </TableCell>
                )}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedJob(app)}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Application
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => removeTracker.mutate(app.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {paginatedData.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <p>No applications found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
              <SelectTrigger className="w-[70px] h-8 bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map(size => (
                  <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-4">
              {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredAndSorted.length)} of {filteredAndSorted.length}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Job Detail Modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          {selectedJob && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl">{selectedJob.job.title}</DialogTitle>
                    <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {selectedJob.job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedJob.job.location || selectedJob.job.remote || "Remote"}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {selectedJob.job.salary_min ? `${selectedJob.job.salary_currency}${selectedJob.job.salary_min / 1000}k - ${selectedJob.job.salary_max ? selectedJob.job.salary_max / 1000 : '?'}k` : "Not specified"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div 
                      className="text-3xl font-bold font-mono"
                      style={{ 
                        color: (selectedJob.match_score || 0) >= 90 ? '#DFFF00' : 
                               (selectedJob.match_score || 0) >= 80 ? '#00D4FF' : 
                               (selectedJob.match_score || 0) >= 70 ? '#A020F0' : '#888'
                      }}
                    >
                      {selectedJob.match_score ? `${selectedJob.match_score}%` : '-%'}
                    </div>
                    <p className="text-xs text-muted-foreground">Match Score</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div className="flex items-center gap-4">
                  <Badge className={statusConfig[selectedJob.status]?.className || 'bg-muted'}>
                    {statusConfig[selectedJob.status]?.icon || <Clock className="w-3 h-3" />}
                    <span className="ml-1">{statusConfig[selectedJob.status]?.label || selectedJob.status}</span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Applied on {selectedJob.applied_date ? format(new Date(selectedJob.applied_date), "MMM d, yyyy") : format(new Date(selectedJob.created_at), "MMM d, yyyy")}
                  </span>
                </div>

                <div className="p-4 bg-muted/30 rounded-xl">
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Next Action</h4>
                  <p>{selectedJob.next_action || "No upcoming actions"}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">About the Role</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedJob.job.description}</p>
                </div>

                {selectedJob.job.requirements && selectedJob.job.requirements.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Requirements</h3>
                    <ul className="space-y-2">
                      {selectedJob.job.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-3 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedJob.job.responsibilities && selectedJob.job.responsibilities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Responsibilities</h3>
                    <ul className="space-y-2">
                      {selectedJob.job.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-3 text-muted-foreground">
                          <span className="text-secondary font-bold">•</span>
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                    <a href={selectedJob.job.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Original Posting
                    </a>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        Update Status
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {allStatuses.map(status => (
                        <DropdownMenuItem 
                          key={status}
                          onClick={() => {
                            updateStatus(selectedJob.id, status)
                            setSelectedJob({...selectedJob, status})
                          }}
                        >
                          {statusConfig[status]?.icon}
                          <span className="ml-2">{statusConfig[status]?.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
