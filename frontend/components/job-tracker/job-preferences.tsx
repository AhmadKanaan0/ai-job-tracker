"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Zap, X, Plus } from "lucide-react"

interface JobPreferencesProps {
  onContinue: () => void
}

const suggestedRoles = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "DevOps Engineer", "Data Scientist", "Product Manager", "UX Designer"
]

export function JobPreferences({ onContinue }: JobPreferencesProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Full Stack Developer"])
  const [customRole, setCustomRole] = useState("")
  const [jobTypes, setJobTypes] = useState({
    fullTime: true,
    partTime: false,
    contract: false,
    internship: false
  })
  const [location, setLocation] = useState("")
  const [openToRemote, setOpenToRemote] = useState(true)
  const [needsVisa, setNeedsVisa] = useState(false)

  const addRole = (role: string) => {
    if (!selectedRoles.includes(role)) {
      setSelectedRoles([...selectedRoles, role])
    }
  }

  const removeRole = (role: string) => {
    setSelectedRoles(selectedRoles.filter(r => r !== role))
  }

  const handleCustomRole = () => {
    if (customRole.trim() && !selectedRoles.includes(customRole.trim())) {
      setSelectedRoles([...selectedRoles, customRole.trim()])
      setCustomRole("")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" fill="currentColor" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">Career Agent</span>
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <span className="text-sm text-muted-foreground">Your AI Job Copilot</span>
            </div>
          </div>
          <h1 className="text-3xl font-light text-foreground">
            To get started, <span className="font-bold">what type of role</span> are you looking for?
          </h1>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8 space-y-6">
          {/* Job Function / Roles */}
          <div className="space-y-3">
            <Label className="text-foreground">
              <span className="text-destructive">*</span> Job Function
            </Label>
            
            {/* Selected Roles */}
            {selectedRoles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedRoles.map(role => (
                  <Badge 
                    key={role} 
                    className="bg-primary/20 text-primary border-primary/30 px-3 py-1.5 text-sm"
                  >
                    {role}
                    <button 
                      onClick={() => removeRole(role)}
                      className="ml-2 hover:text-primary-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Custom Role Input */}
            <div className="flex gap-2">
              <Input 
                placeholder="Add a job function..."
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomRole()}
                className="bg-muted/50 border-border/50"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCustomRole}
                className="border-border/50"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Suggested Roles */}
            <div className="flex flex-wrap gap-2 pt-2">
              {suggestedRoles.filter(r => !selectedRoles.includes(r)).slice(0, 5).map(role => (
                <Badge 
                  key={role}
                  variant="outline"
                  className="cursor-pointer border-border/50 hover:border-primary hover:bg-primary/10 transition-colors"
                  onClick={() => addRole(role)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          {/* Job Type */}
          <div className="space-y-3">
            <Label className="text-foreground">
              <span className="text-destructive">*</span> Job Type
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "fullTime", label: "Full-time" },
                { key: "contract", label: "Contract" },
                { key: "partTime", label: "Part-time" },
                { key: "internship", label: "Internship" }
              ].map(({ key, label }) => (
                <label 
                  key={key}
                  className={`
                    flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all
                    ${jobTypes[key as keyof typeof jobTypes] 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border/50 hover:border-border'}
                  `}
                >
                  <Checkbox 
                    checked={jobTypes[key as keyof typeof jobTypes]}
                    onCheckedChange={(c) => setJobTypes({...jobTypes, [key]: c as boolean})}
                    className={jobTypes[key as keyof typeof jobTypes] 
                      ? 'border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground' 
                      : 'border-muted-foreground'}
                  />
                  <span className="text-foreground">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label className="text-foreground">
              <span className="text-destructive">*</span> Location
            </Label>
            <div className="flex gap-3">
              <Input 
                placeholder="City, State, or Country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-muted/50 border-border/50 flex-1"
              />
              <label className={`
                flex items-center gap-2 px-4 rounded-xl border cursor-pointer transition-all whitespace-nowrap
                ${openToRemote ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-border'}
              `}>
                <Checkbox 
                  checked={openToRemote}
                  onCheckedChange={(c) => setOpenToRemote(c as boolean)}
                  className={openToRemote 
                    ? 'border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground' 
                    : 'border-muted-foreground'}
                />
                <span className="text-foreground text-sm">Open to Remote</span>
              </label>
            </div>
          </div>

          {/* Work Authorization */}
          <div className="space-y-3">
            <Label className="text-foreground">Work Authorization</Label>
            <label className={`
              inline-flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all
              ${needsVisa ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-border'}
            `}>
              <Checkbox 
                checked={needsVisa}
                onCheckedChange={(c) => setNeedsVisa(c as boolean)}
                className={needsVisa 
                  ? 'border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground' 
                  : 'border-muted-foreground'}
              />
              <span className="text-foreground">H1B sponsorship needed</span>
            </label>
          </div>

          {/* Continue Button */}
          <Button 
            className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-medium rounded-full mt-4"
            onClick={onContinue}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
