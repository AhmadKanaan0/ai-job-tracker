"use client"

import { useState } from "react"
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
  Save,
  User,
  GraduationCap,
  Briefcase,
  Sparkles,
  Scale,
  CheckCircle2
} from "lucide-react"

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

const SECTIONS = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "experience", label: "Work Experience", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "equalEmployment", label: "Equal Employment", icon: Scale },
]

const suggestedSkills = [
  "Docker", "Azure", "Google Cloud", "AWS", "Kubernetes", "Spring Boot", "Node.js",
  "Express", "NestJS", "Laravel", "Django", "React", "Next.js", "React Native",
  "TypeScript", "MongoDB", "PostgreSQL", "Redis", "pandas", "scikit-learn", "NumPy",
  "Matplotlib", "Data Visualization", "UI/UX Design", "Python", "Java", "Go"
]

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState("personal")
  const [isSaved, setIsSaved] = useState(false)

  // -- STATE MIGRATED FROM SETUP WIZARD --
  const [personal, setPersonal] = useState({
    firstName: "Ahmad",
    lastName: "Kanaan",
    email: "ahmad.w.kanaan@gmail.com",
    phone: "+961 81 849 055",
    country: "lb",
    city: "Tripoli",
    county: "",
    postalCode: "",
    addressLine: ""
  })

  const [educations, setEducations] = useState<Education[]>([
    { id: 1, schoolName: "other", major: "se", degreeType: "bachelor", gpa: "3.8", startDate: "2019", endDate: "2023", currentlyStudying: false }
  ])

  const [experiences, setExperiences] = useState<WorkExperience[]>([
    { 
      id: 1, 
      jobTitle: "fullstack", 
      company: "Sword Group", 
      jobType: "Full-time", 
      location: "remote", 
      startDate: "2024-01", 
      endDate: "2026-04", 
      currentlyWorking: true, 
      summary: "Delivered enterprise-grade applications built with React and Spring Boot.", 
      descriptions: ["Optimizing PostgreSQL-backed systems for performance and stability.", "Integrating OpenAI to automate backend class generation"] 
    }
  ])

  const [skills, setSkills] = useState<string[]>(["React", "TypeScript", "NodeJS", "NestJS", "PostgreSQL", "Redis", "AWS"])
  const [newSkill, setNewSkill] = useState("")

  const [equalEmployment, setEqualEmployment] = useState({
    authorizedToWork: "yes",
    requireSponsorship: "no",
    hasDisability: "",
    isVeteran: "",
    gender: "",
    lgbtq: ""
  })

  // -- STATE HANDLERS --
  const addEducation = () => {
    setEducations([...educations, { 
      id: Date.now(), schoolName: "", major: "", degreeType: "", gpa: "", startDate: "", endDate: "", currentlyStudying: false 
    }])
  }

  const removeEducation = (id: number) => {
    if (educations.length > 1) setEducations(educations.filter(e => e.id !== id))
  }

  const updateEducation = (id: number, field: keyof Education, value: string | boolean) => {
    setEducations(educations.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const addExperience = () => {
    setExperiences([...experiences, { 
      id: Date.now(), jobTitle: "", company: "", jobType: "Full-time", location: "", startDate: "", endDate: "", currentlyWorking: false, summary: "", descriptions: [""] 
    }])
  }

  const removeExperience = (id: number) => {
    if (experiences.length > 1) setExperiences(experiences.filter(e => e.id !== id))
  }

  const updateExperience = (id: number, field: keyof WorkExperience, value: string | boolean | string[]) => {
    setExperiences(experiences.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const addDescription = (expId: number) => {
    setExperiences(experiences.map(e => e.id === expId ? { ...e, descriptions: [...e.descriptions, ""] } : e))
  }

  const updateDescription = (expId: number, index: number, value: string) => {
    setExperiences(experiences.map(e => e.id === expId ? { ...e, descriptions: e.descriptions.map((d, i) => i === index ? value : d) } : e))
  }

  const removeDescription = (expId: number, index: number) => {
    setExperiences(experiences.map(e => e.id === expId && e.descriptions.length > 1 ? { ...e, descriptions: e.descriptions.filter((_, i) => i !== index) } : e))
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

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-8 p-6 lg:p-8 glass-card rounded-3xl border border-border/50">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">Keep your information up to date to get the best matches.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                  ${isActive 
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(223,255,0,0.1)]' 
                    : 'hover:bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {section.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="glass-card rounded-2xl shadow-lg border border-border/50 p-6 lg:p-8 min-h-[500px]">
          
          {/* == SECTION: PERSONAL == */}
          {activeSection === "personal" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-6">Personal Info</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground"><span className="text-destructive">*</span>First Name</Label>
                  <Input 
                    value={personal.firstName}
                    onChange={(e) => setPersonal({...personal, firstName: e.target.value})}
                    className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground"><span className="text-destructive">*</span>Last Name</Label>
                  <Input 
                    value={personal.lastName}
                    onChange={(e) => setPersonal({...personal, lastName: e.target.value})}
                    className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50"
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
                    className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground"><span className="text-destructive">*</span>Phone</Label>
                  <Input 
                    value={personal.phone}
                    onChange={(e) => setPersonal({...personal, phone: e.target.value})}
                    className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground">Country/Region</Label>
                  <Select value={personal.country} onValueChange={(v) => setPersonal({...personal, country: v})}>
                    <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                      <SelectItem value="lb">Lebanon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">City</Label>
                  <Input 
                    value={personal.city}
                    onChange={(e) => setPersonal({...personal, city: e.target.value})}
                    className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Address Line</Label>
                <Input 
                  value={personal.addressLine}
                  onChange={(e) => setPersonal({...personal, addressLine: e.target.value})}
                  className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50"
                />
              </div>
            </div>
          )}

          {/* == SECTION: EDUCATION == */}
          {activeSection === "education" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-6">Education</h2>
              
              {educations.map((edu, index) => (
                <div key={edu.id} className="border border-border/50 bg-muted/10 rounded-xl p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Degree {index + 1}</h3>
                    {educations.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeEducation(edu.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground"><span className="text-destructive">*</span>School Name</Label>
                      <Select value={edu.schoolName} onValueChange={(v) => updateEducation(edu.id, 'schoolName', v)}>
                        <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50">
                          <SelectValue placeholder="Select institution" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mit">Massachusetts Institute of Technology</SelectItem>
                          <SelectItem value="stanford">Stanford University</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground"><span className="text-destructive">*</span>Major</Label>
                        <Select value={edu.major} onValueChange={(v) => updateEducation(edu.id, 'major', v)}>
                          <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50">
                            <SelectValue placeholder="Select major" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cs">Computer Science</SelectItem>
                            <SelectItem value="se">Software Engineering</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground"><span className="text-destructive">*</span>Degree Type</Label>
                        <Select value={edu.degreeType} onValueChange={(v) => updateEducation(edu.id, 'degreeType', v)}>
                          <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50">
                            <SelectValue placeholder="Select degree" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bachelor">Bachelor</SelectItem>
                            <SelectItem value="master">Master</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">GPA</Label>
                        <Input value={edu.gpa} onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)} className="bg-muted/30 border-border/50 hover:border-primary/50"/>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">Start Date</Label>
                        <Select value={edu.startDate} onValueChange={(v) => updateEducation(edu.id, 'startDate', v)}>
                          <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => 2026 - i).map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">End Date</Label>
                        <Select value={edu.endDate} onValueChange={(v) => updateEducation(edu.id, 'endDate', v)} disabled={edu.currentlyStudying}>
                          <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => 2030 - i).map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 mt-2">
                           <Checkbox checked={edu.currentlyStudying} onCheckedChange={(c) => updateEducation(edu.id, 'currentlyStudying', c as boolean)} />
                           <label className="text-sm text-foreground">I currently study here</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addEducation} className="w-full border-dashed border-border/50">
                <Plus className="w-4 h-4 mr-2" />Add Education
              </Button>
            </div>
          )}

          {/* == SECTION: EXPERIENCE == */}
          {activeSection === "experience" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-6">Work Experience</h2>
              
              {experiences.map((exp, index) => (
                <div key={exp.id} className="border border-border/50 bg-muted/10 rounded-xl p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Role {index + 1}</h3>
                    {experiences.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeExperience(exp.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground"><span className="text-destructive">*</span>Job Title</Label>
                      <Select value={exp.jobTitle} onValueChange={(v) => updateExperience(exp.id, 'jobTitle', v)}>
                        <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors focus:ring-primary/50">
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
                       <Input value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} className="bg-muted/30 border-border/50 hover:border-primary/50" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">Start Date</Label>
                        <Input type="month" value={exp.startDate} onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)} className="bg-muted/30 border-border/50 hover:border-primary/50"/>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">End Date</Label>
                        <Input type="month" value={exp.endDate} onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)} disabled={exp.currentlyWorking} className="bg-muted/30 border-border/50 hover:border-primary/50"/>
                        <div className="flex items-center gap-2 mt-2">
                           <Checkbox checked={exp.currentlyWorking} onCheckedChange={(c) => updateExperience(exp.id, 'currentlyWorking', c as boolean)} />
                           <label className="text-sm text-foreground">I currently work here</label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                       <Label className="text-foreground">Role Summary</Label>
                       <Textarea value={exp.summary} onChange={(e) => updateExperience(exp.id, 'summary', e.target.value)} className="bg-muted/30 border-border/50 hover:border-primary/50 min-h-[60px]" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Key Responsibilities & Accomplishments</Label>
                      <div className="space-y-2">
                        {exp.descriptions.map((desc, descIdx) => (
                           <div key={descIdx} className="flex gap-2">
                             <Textarea value={desc} onChange={(e) => updateDescription(exp.id, descIdx, e.target.value)} className="bg-muted/30 border-border/50 hover:border-primary/50 min-h-[40px] flex-1" />
                             {exp.descriptions.length > 1 && (
                               <Button variant="ghost" size="icon" onClick={() => removeDescription(exp.id, descIdx)} className="text-muted-foreground hover:text-destructive">
                                 <X className="w-4 h-4" />
                               </Button>
                             )}
                           </div>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => addDescription(exp.id)} className="text-primary hover:text-primary/80 px-0">
                         <Plus className="w-4 h-4 mr-1" />Add bullet point
                      </Button>
                    </div>

                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addExperience} className="w-full border-dashed border-border/50">
                <Plus className="w-4 h-4 mr-2" />Add Work Experience
              </Button>
            </div>
          )}

          {/* == SECTION: SKILLS == */}
          {activeSection === "skills" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-6">Technical Skills</h2>
              
              <div className="space-y-2">
                <Label className="text-foreground">Your Skills</Label>
                <div className="flex flex-wrap gap-2 p-4 bg-muted/10 border border-border/50 rounded-xl min-h-[120px]">
                  {skills.map(skill => (
                    <Badge key={skill} className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer px-3 py-1.5 text-sm font-medium" onClick={() => removeSkill(skill)}>
                      {skill} <X className="w-3 h-3 ml-2" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Input 
                    value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                    placeholder="Type a skill and hit enter..."
                    className="bg-muted/30 border-border/50 hover:border-primary/50 focus:ring-primary/50"
                  />
                  <Button onClick={addSkill} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_10px_rgba(223,255,0,0.2)]">Add</Button>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Label className="text-foreground text-sm font-semibold">Suggested for you</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedSkills.filter(s => !skills.includes(s)).slice(0, 15).map(skill => (
                    <Badge key={skill} variant="outline" className="border-border/50 text-muted-foreground hover:text-primary hover:border-primary cursor-pointer px-2.5 py-1" onClick={() => setSkills([...skills, skill])}>
                      <Plus className="w-3 h-3 mr-1" />{skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* == SECTION: EQUAL EMPLOYMENT == */}
          {activeSection === "equalEmployment" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-6">Equal Employment</h2>

              <div className="space-y-6">
                <div className="border border-border/50 bg-muted/10 rounded-xl p-5">
                  <Label className="text-foreground block mb-3 font-semibold">Are You Authorized To Work In The US?</Label>
                  <div className="flex gap-3">
                    <Button variant={equalEmployment.authorizedToWork === 'yes' ? 'default' : 'outline'} onClick={() => setEqualEmployment({...equalEmployment, authorizedToWork: 'yes'})} className={equalEmployment.authorizedToWork === 'yes' ? 'bg-primary text-primary-foreground' : ''}>Yes</Button>
                    <Button variant={equalEmployment.authorizedToWork === 'no' ? 'default' : 'outline'} onClick={() => setEqualEmployment({...equalEmployment, authorizedToWork: 'no'})} className={equalEmployment.authorizedToWork === 'no' ? 'bg-primary text-primary-foreground' : ''}>No</Button>
                  </div>
                </div>

                <div className="border border-border/50 bg-muted/10 rounded-xl p-5">
                  <Label className="text-foreground block mb-3 font-semibold">Will You Now Or In The Future Require Sponsorship?</Label>
                  <div className="flex gap-3">
                    <Button variant={equalEmployment.requireSponsorship === 'yes' ? 'default' : 'outline'} onClick={() => setEqualEmployment({...equalEmployment, requireSponsorship: 'yes'})} className={equalEmployment.requireSponsorship === 'yes' ? 'bg-primary text-primary-foreground' : ''}>Yes</Button>
                    <Button variant={equalEmployment.requireSponsorship === 'no' ? 'default' : 'outline'} onClick={() => setEqualEmployment({...equalEmployment, requireSponsorship: 'no'})} className={equalEmployment.requireSponsorship === 'no' ? 'bg-primary text-primary-foreground' : ''}>No</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur border-t border-border/50 py-4 px-6 md:pl-[280px]">
        <div className="max-w-6xl mx-auto flex justify-end items-center gap-4">
          {isSaved && <span className="text-primary text-sm font-semibold flex items-center gap-1 animate-in fade-in"><CheckCircle2 className="w-4 h-4" /> Changes saved</span>}
          <Button onClick={handleSave} className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-11 px-8 shadow-[0_0_15px_rgba(223,255,0,0.3)] hover:shadow-[0_0_20px_rgba(223,255,0,0.5)] transition-all">
            <Save className="w-4 h-4 mr-2" />
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  )
}
