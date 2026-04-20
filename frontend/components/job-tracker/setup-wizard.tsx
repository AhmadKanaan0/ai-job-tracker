"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  Plus,
  Trash2,
  Upload,
  FileText,
  Check
} from "lucide-react"

// interface removed

interface Education {
  id: number
  schoolName: string
  major: string
  degreeType: string
  gpa: string
  startDate: string
  endDate: string
  currentlyStudying: boolean
}

interface WorkExperience {
  id: number
  jobTitle: string
  company: string
  jobType: string
  location: string
  startDate: string
  endDate: string
  currentlyWorking: boolean
  summary: string
  descriptions: string[]
}

const steps = [
  { number: 1, label: "Personal" },
  { number: 2, label: "Education" },
  { number: 3, label: "Work Experience" },
  { number: 4, label: "Skills" },
  { number: 5, label: "Equal Employment" },
]

const suggestedSkills = [
  "Docker", "Azure", "Google Cloud", "AWS", "Kubernetes", "Spring Boot", "Node.js",
  "Express", "NestJS", "Laravel", "Django", "React", "Next.js", "React Native",
  "TypeScript", "MongoDB", "PostgreSQL", "Redis", "pandas", "scikit-learn", "NumPy",
  "Matplotlib", "Data Visualization", "UI/UX Design", "Python", "Java", "Go"
]

const aiMessages = {
  1: "Great! Let's get started with your basic info.",
  2: "Next, please review and confirm your education history.",
  3: "Now let's add your work experience. The more detail, the better!",
  4: "Now let's focus on your skills! The more complete your skillset, the better we can match you with the perfect job opportunities.",
  5: "Last step! Share your equal employment info for a faster application process."
}

export function SetupWizard() {
  const router = useRouter()
  const { user, updateProfile, isAuthenticated, isLoading: authLoading } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/auth")
  }, [authLoading, isAuthenticated, router])

  const onComplete = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await updateProfile({
        first_name: personal.firstName || undefined,
        last_name: personal.lastName || undefined,
        phone: personal.phone || undefined,
        country: personal.country || undefined,
        city: personal.city || undefined,
        county: personal.county || undefined,
        postal_code: personal.postalCode || undefined,
        address_line: personal.addressLine || undefined,
        educations: educations.map(({ id, ...rest }) => rest),
        experiences: experiences.map(({ id, ...rest }) => rest),
        skills,
        has_disability: equalEmployment.hasDisability || undefined,
        gender: equalEmployment.gender || undefined,
      })
      router.push("/dashboard")
    } catch (err) {
      setSaveError((err as Error).message || "Failed to save profile")
      setIsSaving(false)
    }
  }
  const [step, setStep] = useState(1)
  
  // Personal Info
  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    county: "",
    postalCode: "",
    addressLine: ""
  })

  // Education
  const [educations, setEducations] = useState<Education[]>([
    { id: 1, schoolName: "", major: "", degreeType: "", gpa: "", startDate: "", endDate: "", currentlyStudying: false }
  ])

  // Work Experience
  const [experiences, setExperiences] = useState<WorkExperience[]>([
    { id: 1, jobTitle: "", company: "", jobType: "Full-time", location: "", startDate: "", endDate: "", currentlyWorking: false, summary: "", descriptions: [""] }
  ])

  // Skills
  const [skills, setSkills] = useState<string[]>(["React", "TypeScript", "Node.js", "Docker", "PostgreSQL"])
  const [newSkill, setNewSkill] = useState("")

  // Equal Employment
  const [equalEmployment, setEqualEmployment] = useState({
    hasDisability: "",
    gender: ""
  })

  // Sync state when user is loaded (only for initial load or if fields are empty)
  const [hasSynced, setHasSynced] = useState(false)

  useEffect(() => {
    if (user && !hasSynced) {
      setPersonal(prev => ({
        ...prev,
        firstName: prev.firstName || user.first_name || "",
        lastName: prev.lastName || user.last_name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
        country: prev.country || user.country || "",
        city: prev.city || user.city || "",
        county: prev.county || user.county || "",
        postalCode: prev.postalCode || user.postal_code || "",
        addressLine: prev.addressLine || user.address_line || ""
      }))

      if (user.educations?.length && educations.every(e => !e.schoolName)) {
        setEducations(user.educations.map((e, i) => ({ id: i + 1, ...e })))
      }

      if (user.experiences?.length && experiences.every(e => !e.jobTitle)) {
        setExperiences(user.experiences.map((e, i) => ({ id: i + 1, jobType: "Full-time", ...e })))
      }

      if (user.skills?.length && skills.length <= 5 && skills.includes("React")) {
        // Only replace default skills
        setSkills(user.skills)
      }
      
      setHasSynced(true)
    }
  }, [user, hasSynced, educations, experiences, skills])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  // Resume upload
  const [resumeUploaded, setResumeUploaded] = useState(false)

  const addEducation = () => {
    setEducations([...educations, { 
      id: Date.now(), 
      schoolName: "", 
      major: "", 
      degreeType: "", 
      gpa: "", 
      startDate: "", 
      endDate: "", 
      currentlyStudying: false 
    }])
  }

  const removeEducation = (id: number) => {
    if (educations.length > 1) {
      setEducations(educations.filter(e => e.id !== id))
    }
  }

  const updateEducation = (id: number, field: keyof Education, value: string | boolean) => {
    setEducations(educations.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const addExperience = () => {
    setExperiences([...experiences, { 
      id: Date.now(), 
      jobTitle: "", 
      company: "", 
      jobType: "Full-time", 
      location: "", 
      startDate: "", 
      endDate: "", 
      currentlyWorking: false, 
      summary: "", 
      descriptions: [""] 
    }])
  }

  const removeExperience = (id: number) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter(e => e.id !== id))
    }
  }

  const updateExperience = (id: number, field: keyof WorkExperience, value: string | boolean | string[]) => {
    setExperiences(experiences.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const addDescription = (expId: number) => {
    setExperiences(experiences.map(e => 
      e.id === expId ? { ...e, descriptions: [...e.descriptions, ""] } : e
    ))
  }

  const updateDescription = (expId: number, index: number, value: string) => {
    setExperiences(experiences.map(e => 
      e.id === expId ? { 
        ...e, 
        descriptions: e.descriptions.map((d, i) => i === index ? value : d) 
      } : e
    ))
  }

  const removeDescription = (expId: number, index: number) => {
    setExperiences(experiences.map(e => 
      e.id === expId && e.descriptions.length > 1 ? { 
        ...e, 
        descriptions: e.descriptions.filter((_, i) => i !== index) 
      } : e
    ))
  }

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill])
      setNewSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill))
  }

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 glass-card border-b-0 py-4 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${step >= s.number 
                      ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(223,255,0,0.4)]' 
                      : 'bg-muted text-muted-foreground border border-border/50'
                    }
                  `}>
                    {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                  </div>
                  <span className={`text-sm font-medium ${step >= s.number ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 lg:w-24 h-0.5 mx-3 ${step > s.number ? 'bg-primary shadow-[0_0_10px_rgba(223,255,0,0.3)]' : 'bg-border/50'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* AI Assistant Message */}
        <div className="flex items-start gap-3 mb-8">
          <div className="w-12 h-12 rounded-full glass-card border-border/50 flex items-center justify-center flex-shrink-0">
            <div className="text-xl">{":)"}</div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tl-none px-5 py-3 max-w-xl">
            <p className="text-foreground">{aiMessages[step as keyof typeof aiMessages]}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="glass-card rounded-2xl shadow-lg border border-border/50 p-6 lg:p-8">
          
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground"><span className="text-destructive">*</span>First Name</Label>
                  <Input 
                    value={personal.firstName}
                    onChange={(e) => setPersonal({...personal, firstName: e.target.value})}
                    className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground"><span className="text-destructive">*</span>Last Name</Label>
                  <Input 
                    value={personal.lastName}
                    onChange={(e) => setPersonal({...personal, lastName: e.target.value})}
                    className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground"><span className="text-destructive">*</span>Email</Label>
                  <Input 
                    type="email"
                    value={personal.email}
                    onChange={(e) => setPersonal({...personal, email: e.target.value})}
                    className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary"
                    placeholder="john.doe@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground"><span className="text-destructive">*</span>Phone</Label>
                  <Input 
                    value={personal.phone}
                    onChange={(e) => setPersonal({...personal, phone: e.target.value})}
                    className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground">Country/Region</Label>
                  <Select value={personal.country} onValueChange={(v) => setPersonal({...personal, country: v})}>
                    <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                      <SelectItem value="de">Germany</SelectItem>
                      <SelectItem value="fr">France</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">City</Label>
                  <Input 
                    value={personal.city}
                    onChange={(e) => setPersonal({...personal, city: e.target.value})}
                    className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary"
                    placeholder="San Francisco"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground">County</Label>
                  <Input 
                    value={personal.county}
                    onChange={(e) => setPersonal({...personal, county: e.target.value})}
                    className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Postal Code</Label>
                  <Input 
                    value={personal.postalCode}
                    onChange={(e) => setPersonal({...personal, postalCode: e.target.value})}
                    className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Address Line</Label>
                <Input 
                  value={personal.addressLine}
                  onChange={(e) => setPersonal({...personal, addressLine: e.target.value})}
                  className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary"
                  placeholder="123 Main Street"
                />
              </div>
            </div>
          )}

          {/* Step 2: Education */}
          {step === 2 && (
            <div className="space-y-6">
              {educations.map((edu, index) => (
                <div key={edu.id} className="border border-border/50 rounded-xl p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Education {index + 1}</h3>
                    {educations.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeEducation(edu.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground"><span className="text-destructive">*</span>School Name</Label>
                      <Select 
                        value={edu.schoolName} 
                        onValueChange={(v) => updateEducation(edu.id, 'schoolName', v)}
                      >
                        <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary">
                          <SelectValue placeholder="Select or type school name" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mit">Massachusetts Institute of Technology</SelectItem>
                          <SelectItem value="stanford">Stanford University</SelectItem>
                          <SelectItem value="berkeley">UC Berkeley</SelectItem>
                          <SelectItem value="harvard">Harvard University</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground"><span className="text-destructive">*</span>Major</Label>
                        <Select 
                          value={edu.major} 
                          onValueChange={(v) => updateEducation(edu.id, 'major', v)}
                        >
                          <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary">
                            <SelectValue placeholder="Select major" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cs">Computer Science</SelectItem>
                            <SelectItem value="ee">Electrical Engineering</SelectItem>
                            <SelectItem value="se">Software Engineering</SelectItem>
                            <SelectItem value="ds">Data Science</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground"><span className="text-destructive">*</span>Degree Type</Label>
                        <Select 
                          value={edu.degreeType} 
                          onValueChange={(v) => updateEducation(edu.id, 'degreeType', v)}
                        >
                          <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary">
                            <SelectValue placeholder="Select degree" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bachelor">Bachelor</SelectItem>
                            <SelectItem value="master">Master</SelectItem>
                            <SelectItem value="phd">PhD</SelectItem>
                            <SelectItem value="associate">Associate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">GPA</Label>
                        <Input 
                          value={edu.gpa}
                          onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                          className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary"
                          placeholder="3.8"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">Start Date</Label>
                        <Select 
                          value={edu.startDate} 
                          onValueChange={(v) => updateEducation(edu.id, 'startDate', v)}
                        >
                          <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary">
                            <SelectValue placeholder="Select start date" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => 2026 - i).map(year => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">End Date</Label>
                        <Select 
                          value={edu.endDate} 
                          onValueChange={(v) => updateEducation(edu.id, 'endDate', v)}
                          disabled={edu.currentlyStudying}
                        >
                          <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary">
                            <SelectValue placeholder="Select end date" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => 2030 - i).map(year => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 mt-2">
                          <Checkbox 
                            id={`currently-studying-${edu.id}`}
                            checked={edu.currentlyStudying}
                            onCheckedChange={(c) => updateEducation(edu.id, 'currentlyStudying', c as boolean)}
                          />
                          <label htmlFor={`currently-studying-${edu.id}`} className="text-sm text-foreground">
                            I currently study here
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button 
                variant="outline" 
                onClick={addEducation}
                className="w-full border-dashed border-border/50 text-foreground hover:bg-muted/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>
            </div>
          )}

          {/* Step 3: Work Experience */}
          {step === 3 && (
            <div className="space-y-6">
              {experiences.map((exp, index) => (
                <div key={exp.id} className="border border-border/50 rounded-xl p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Experience {index + 1}</h3>
                    {experiences.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeExperience(exp.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground"><span className="text-destructive">*</span>Job Title</Label>
                      <Select 
                        value={exp.jobTitle} 
                        onValueChange={(v) => updateExperience(exp.id, 'jobTitle', v)}
                      >
                        <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary">
                          <SelectValue placeholder="Select job title" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="frontend">Frontend Developer</SelectItem>
                          <SelectItem value="backend">Backend Developer</SelectItem>
                          <SelectItem value="fullstack">Full Stack Developer</SelectItem>
                          <SelectItem value="software">Software Engineer</SelectItem>
                          <SelectItem value="senior">Senior Software Engineer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground"><span className="text-destructive">*</span>Company</Label>
                      <Input 
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                        className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary"
                        placeholder="Company name"
                      />
                      <p className="text-xs text-muted-foreground">Tips: Pick the company from above for better accuracy</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground"><span className="text-destructive">*</span>Job Type</Label>
                        <Select 
                          value={exp.jobType} 
                          onValueChange={(v) => updateExperience(exp.id, 'jobType', v)}
                        >
                          <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Internship">Internship</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Location</Label>
                        <Select 
                          value={exp.location} 
                          onValueChange={(v) => updateExperience(exp.id, 'location', v)}
                        >
                          <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="remote">Remote</SelectItem>
                            <SelectItem value="sf">San Francisco, CA</SelectItem>
                            <SelectItem value="nyc">New York, NY</SelectItem>
                            <SelectItem value="seattle">Seattle, WA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">Start Date</Label>
                        <Select 
                          value={exp.startDate} 
                          onValueChange={(v) => updateExperience(exp.id, 'startDate', v)}
                        >
                          <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary">
                            <SelectValue placeholder="Select start date" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 15 }, (_, i) => `${2026 - i}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`).map(date => (
                              <SelectItem key={date} value={date}>{date}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">End Date</Label>
                        <Select 
                          value={exp.endDate} 
                          onValueChange={(v) => updateExperience(exp.id, 'endDate', v)}
                          disabled={exp.currentlyWorking}
                        >
                          <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary">
                            <SelectValue placeholder="Select end date" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => `${2026 - i}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`).map(date => (
                              <SelectItem key={date} value={date}>{date}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 mt-2">
                          <Checkbox 
                            id={`currently-working-${exp.id}`}
                            checked={exp.currentlyWorking}
                            onCheckedChange={(c) => updateExperience(exp.id, 'currentlyWorking', c as boolean)}
                          />
                          <label htmlFor={`currently-working-${exp.id}`} className="text-sm text-foreground">
                            I currently work here
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Experience Summary</Label>
                      <Textarea 
                        value={exp.summary}
                        onChange={(e) => updateExperience(exp.id, 'summary', e.target.value)}
                        className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary min-h-[80px]"
                        placeholder="Brief summary of your role and responsibilities..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Job Description</Label>
                      <div className="space-y-2">
                        {exp.descriptions.map((desc, descIndex) => (
                          <div key={descIndex} className="flex items-start gap-2">
                            <span className="text-muted-foreground mt-2.5">•</span>
                            <Textarea 
                              value={desc}
                              onChange={(e) => updateDescription(exp.id, descIndex, e.target.value)}
                              className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary min-h-[60px] flex-1"
                              placeholder="Describe an accomplishment or responsibility..."
                            />
                            {exp.descriptions.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeDescription(exp.id, descIndex)}
                                className="text-muted-foreground hover:text-destructive mt-1"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => addDescription(exp.id)}
                        className="text-primary hover:text-primary/80"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add bullet point
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button 
                variant="outline" 
                onClick={addExperience}
                className="w-full border-dashed border-border/50 text-foreground hover:bg-muted/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Work Experience
              </Button>
            </div>
          )}

          {/* Step 4: Skills */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-foreground text-lg font-semibold">Skills</Label>
                <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-xl min-h-[120px]">
                  {skills.map(skill => (
                    <Badge 
                      key={skill} 
                      variant="secondary"
                      className="glass-card border-border/50 text-foreground hover:bg-muted/50 cursor-pointer px-3 py-1.5 text-sm"
                      onClick={() => removeSkill(skill)}
                    >
                      {skill}
                      <X className="w-3 h-3 ml-2" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input 
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                    placeholder="Add skill..."
                    className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50 focus:border-primary"
                  />
                  <Button onClick={addSkill} className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(223,255,0,0.4)] transition-all">
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Suggested Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedSkills.filter(s => !skills.includes(s)).slice(0, 15).map(skill => (
                    <Badge 
                      key={skill} 
                      variant="outline"
                      className="border-border/50 text-muted-foreground hover:bg-[#00D9A5]/10 hover:text-primary hover:border-primary shadow-[0_0_15px_rgba(223,255,0,0.2)]/30 cursor-pointer px-3 py-1.5"
                      onClick={() => setSkills([...skills, skill])}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Equal Employment */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-border/50 rounded-xl p-5">
                  <Label className="text-foreground block mb-3">
                    <span className="text-destructive">*</span>Do You Have A Disability?
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant={equalEmployment.hasDisability === 'yes' ? 'default' : 'outline'}
                      onClick={() => setEqualEmployment({...equalEmployment, hasDisability: 'yes'})}
                      className={equalEmployment.hasDisability === 'yes' ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(223,255,0,0.3)]' : ''}
                    >
                      Yes
                    </Button>
                    <Button 
                      variant={equalEmployment.hasDisability === 'no' ? 'default' : 'outline'}
                      onClick={() => setEqualEmployment({...equalEmployment, hasDisability: 'no'})}
                      className={equalEmployment.hasDisability === 'no' ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(223,255,0,0.3)]' : ''}
                    >
                      No
                    </Button>
                    <Button 
                      variant={equalEmployment.hasDisability === 'decline' ? 'default' : 'outline'}
                      onClick={() => setEqualEmployment({...equalEmployment, hasDisability: 'decline'})}
                      className={equalEmployment.hasDisability === 'decline' ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(223,255,0,0.3)]' : ''}
                    >
                      Decline to state
                    </Button>
                  </div>
                </div>

                <div className="border border-border/50 rounded-xl p-5">
                  <Label className="text-foreground block mb-3">
                    <span className="text-destructive">*</span>What Is Your Gender?
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant={equalEmployment.gender === 'male' ? 'default' : 'outline'}
                      onClick={() => setEqualEmployment({...equalEmployment, gender: 'male'})}
                      className={equalEmployment.gender === 'male' ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(223,255,0,0.3)]' : ''}
                    >
                      Male
                    </Button>
                    <Button 
                      variant={equalEmployment.gender === 'female' ? 'default' : 'outline'}
                      onClick={() => setEqualEmployment({...equalEmployment, gender: 'female'})}
                      className={equalEmployment.gender === 'female' ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(223,255,0,0.3)]' : ''}
                    >
                      Female
                    </Button>
                    <Button 
                      variant={equalEmployment.gender === 'nonbinary' ? 'default' : 'outline'}
                      onClick={() => setEqualEmployment({...equalEmployment, gender: 'nonbinary'})}
                      className={equalEmployment.gender === 'nonbinary' ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(223,255,0,0.3)]' : ''}
                    >
                      Non-Binary
                    </Button>
                    <Button 
                      variant={equalEmployment.gender === 'decline' ? 'default' : 'outline'}
                      onClick={() => setEqualEmployment({...equalEmployment, gender: 'decline'})}
                      className={equalEmployment.gender === 'decline' ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(223,255,0,0.3)]' : ''}
                    >
                      Decline to state
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-center mt-8">
          {step > 1 && (
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="mr-4 text-foreground"
            >
              Back
            </Button>
          )}
          <Button 
            onClick={handleNext}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(223,255,0,0.4)] transition-all px-12 py-6 text-lg rounded-full"
          >
            {isSaving ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving...</>
            ) : (
              step === 5 ? 'Start Matching' : 'Next'
            )}
          </Button>
          {saveError && (
            <p className="text-destructive text-sm mt-3">{saveError}</p>
          )}
        </div>
      </div>
    </div>
  )
}
