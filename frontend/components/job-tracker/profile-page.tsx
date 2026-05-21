"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Trash2, 
  X,
  User,
  GraduationCap,
  Briefcase,
  Code,
  FileText,
  Loader2,
  Check,
  Pencil,
  ChevronsUpDown,
  Sparkles,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Hash,
  Home,
  CheckCircle2,
  Target
} from "lucide-react"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command"
import { Education, Experience } from "@/lib/types"

const educationSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  major: z.string().min(1, "Major is required"),
  degreeType: z.string().min(1, "Degree type is required"),
  gpa: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  currentlyStudying: z.boolean().default(false),
})

const experienceSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company is required"),
  jobType: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  currentlyWorking: z.boolean().default(false),
  summary: z.string().optional(),
  descriptions: z.array(z.string()).min(1, "At least one responsibility is required"),
})

type EducationFormValues = z.infer<typeof educationSchema>
type ExperienceFormValues = z.infer<typeof experienceSchema>

const techStacks = [
  "React", "Next.js", "TypeScript", "JavaScript", "Python", "Node.js", "Docker", "Kubernetes", "AWS", "Google Cloud", "Azure",
  "Tailwind CSS", "PostgreSQL", "MongoDB", "MySQL", "Redis", "GraphQL", "REST API", "Git", "CI/CD", "Testing", "Jest", "Cypress",
  "Java", "Spring Boot", "C#", ".NET", "Go", "Rust", "Swift", "Kotlin", "Flutter", "React Native", "Vue.js", "Angular", "Svelte",
  "Figma", "Redux", "Zustand", "Prisma", "Drizzle", "Firebase", "Supabase", "Machine Learning", "Data Science", "Artificial Intelligence",
  "OpenAI", "NLP", "Computer Vision", "PyTorch", "TensorFlow", "Pandas", "NumPy", "Scikit-Learn", "FastAPI", "Django", "Flask"
]

const commonRoles = [
  "Frontend Engineer", "Backend Engineer", "Full Stack Engineer", "Software Engineer", 
  "Product Manager", "UI/UX Designer", "Data Scientist", "DevOps Engineer", 
  "Mobile Developer", "iOS Developer", "Android Developer", "QA Engineer", 
  "Engineering Manager", "Technical Lead", "Security Engineer", "Cloud Architect",
  "Machine Learning Engineer", "AI Researcher", "Data Analyst", "Product Designer"
]

export function ProfilePage() {
  const { user, updateProfile, isLoading: isAuthLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("personal")
  const [education, setEducation] = useState<Education[]>([])
  const [experience, setExperience] = useState<Experience[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [gender, setGender] = useState("")
  const [hasDisability, setHasDisability] = useState("")
  const [newSkill, setNewSkill] = useState("")
  const [skillSearch, setSkillSearch] = useState("")

  // Job Preferences State
  const [desiredRoles, setDesiredRoles] = useState<string[]>([])
  const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>([])
  const [preferredLocation, setPreferredLocation] = useState("")
  const [openToRemote, setOpenToRemote] = useState(true)
  const [needsVisa, setNeedsVisa] = useState(false)
  const [roleInput, setRoleInput] = useState("")
  
  const filteredTech = techStacks
    .filter(skill => 
      skill.toLowerCase().includes(skillSearch.toLowerCase()) && 
      !skills.includes(skill)
    )
    .slice(0, 5)

  const filteredRoles = commonRoles
    .filter(role => 
      role.toLowerCase().includes(roleInput.toLowerCase()) && 
      !desiredRoles.includes(role)
    )
    .slice(0, 5)
  
  // Edit modals (now drawers)
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [editingEducation, setEditingEducation] = useState<Education | null>(null)
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null)
  const [addingEducation, setAddingEducation] = useState(false)
  const [addingExperience, setAddingExperience] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form instances for drawers
  const educationForm = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      schoolName: "",
      major: "",
      degreeType: "",
      gpa: "",
      startDate: "",
      endDate: "",
      currentlyStudying: false,
    }
  })

  const experienceForm = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      jobTitle: "",
      company: "",
      jobType: "Full-time",
      location: "",
      startDate: "",
      endDate: "",
      currentlyWorking: false,
      summary: "",
      descriptions: [""],
    }
  })

  // Set form values when editing starts
  useEffect(() => {
    if (editingEducation) {
      educationForm.reset({
        schoolName: editingEducation.schoolName,
        major: editingEducation.major,
        degreeType: editingEducation.degreeType,
        gpa: editingEducation.gpa || "",
        startDate: editingEducation.startDate,
        endDate: editingEducation.endDate || "",
        currentlyStudying: editingEducation.currentlyStudying,
      })
    } else if (addingEducation) {
      educationForm.reset({
        schoolName: "",
        major: "",
        degreeType: "",
        gpa: "",
        startDate: "",
        endDate: "",
        currentlyStudying: false,
      })
    }
  }, [editingEducation, addingEducation])

  useEffect(() => {
    if (editingExperience) {
      experienceForm.reset({
        jobTitle: editingExperience.jobTitle,
        company: editingExperience.company,
        jobType: editingExperience.jobType || "Full-time",
        location: editingExperience.location || "",
        startDate: editingExperience.startDate,
        endDate: editingExperience.endDate || "",
        currentlyWorking: editingExperience.currentlyWorking,
        summary: editingExperience.summary || "",
        descriptions: editingExperience.descriptions?.length ? editingExperience.descriptions : [""],
      })
    } else if (addingExperience) {
      experienceForm.reset({
        jobTitle: "",
        company: "",
        jobType: "Full-time",
        location: "",
        startDate: "",
        endDate: "",
        currentlyWorking: false,
        summary: "",
        descriptions: [""],
      })
    }
  }, [editingExperience, addingExperience])
  const [countries, setCountries] = useState<string[]>([])
  const [isLoadingCountries, setIsLoadingCountries] = useState(true)

  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    postalCode: "",
    addressLine: "",
  })

  const [tempPersonal, setTempPersonal] = useState(personal)

  useEffect(() => {
    if (editingPersonal) {
      setTempPersonal(personal)
    }
  }, [editingPersonal])

  // Sync from user object
  useEffect(() => {
    if (user) {
      setPersonal({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        city: user.city || "",
        country: user.country || "",
        postalCode: user.postal_code || "",
        addressLine: user.address_line || "",
      })

      setEducation(
        user.educations?.length
          ? user.educations.map(e => ({
              schoolName: e.schoolName || "",
              major: e.major || "",
              degreeType: e.degreeType || "",
              gpa: e.gpa || "",
              startDate: e.startDate || "",
              endDate: e.endDate || "",
              currentlyStudying: !!e.currentlyStudying,
            }))
          : []
      )

      setExperience(
        user.experiences?.length
          ? user.experiences.map(e => ({
              jobTitle: e.jobTitle || "",
              company: e.company || "",
              jobType: e.jobType || "Full-time",
              location: e.location || "",
              startDate: e.startDate || "",
              endDate: e.endDate || "",
              currentlyWorking: !!e.currentlyWorking,
              summary: e.summary || "",
              descriptions: e.descriptions?.length ? e.descriptions : [],
            }))
          : []
      )

      setSkills(user.skills || [])
      setGender(user.gender || "")
      setHasDisability(user.has_disability || "")
      setDesiredRoles(user.desired_roles || [])
      setPreferredJobTypes(user.preferred_job_types || [])
      setPreferredLocation(user.preferred_location || "")
      setOpenToRemote(user.open_to_remote ?? true)
      setNeedsVisa(user.needs_visa ?? false)
    }
  }, [user])

  const [hasChanges, setHasChanges] = useState(false)

  // Track changes
  useEffect(() => {
    if (!user) return
    
    const isPersonalChanged = 
      personal.firstName !== (user.first_name || "") ||
      personal.lastName !== (user.last_name || "") ||
      personal.phone !== (user.phone || "") ||
      personal.city !== (user.city || "") ||
      personal.country !== (user.country || "") ||
      personal.postalCode !== (user.postal_code || "") ||
      personal.addressLine !== (user.address_line || "")

    const isEducationChanged = JSON.stringify(education) !== JSON.stringify(user.educations || [])
    const isExperienceChanged = JSON.stringify(experience) !== JSON.stringify(user.experiences || [])
    const isSkillsChanged = JSON.stringify(skills) !== JSON.stringify(user.skills || [])
    const isEqualityChanged = 
      gender !== (user.gender || "") || 
      hasDisability !== (user.has_disability || "")

    const isPreferencesChanged = 
      JSON.stringify(desiredRoles) !== JSON.stringify(user.desired_roles || []) ||
      JSON.stringify(preferredJobTypes) !== JSON.stringify(user.preferred_job_types || []) ||
      preferredLocation !== (user.preferred_location || "") ||
      openToRemote !== (user.open_to_remote ?? true) ||
      needsVisa !== (user.needs_visa ?? false)

    setHasChanges(isPersonalChanged || isEducationChanged || isExperienceChanged || isSkillsChanged || isEqualityChanged || isPreferencesChanged)
  }, [personal, education, experience, skills, gender, hasDisability, desiredRoles, preferredJobTypes, preferredLocation, openToRemote, needsVisa, user])

  const handleGlobalSave = async () => {
    setIsSaving(true)
    try {
      await updateProfile({
        first_name: personal.firstName,
        last_name: personal.lastName,
        phone: personal.phone,
        city: personal.city,
        country: personal.country,
        postal_code: personal.postalCode,
        address_line: personal.addressLine,
        educations: education,
        experiences: experience,
        skills: skills,
        gender: gender,
        has_disability: hasDisability,
        desired_roles: desiredRoles,
        preferred_job_types: preferredJobTypes,
        preferred_location: preferredLocation,
        open_to_remote: openToRemote,
        needs_visa: needsVisa
      })
      setHasChanges(false)
    } catch (err) {
      console.error("Failed to save profile:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    if (user) {
      setPersonal({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        city: user.city || "",
        country: user.country || "",
        postalCode: user.postal_code || "",
        addressLine: user.address_line || "",
      })
      setEducation(user.educations || [])
      setExperience(user.experiences || [])
      setSkills(user.skills || [])
      setGender(user.gender || "")
      setHasDisability(user.has_disability || "")
      setDesiredRoles(user.desired_roles || [])
      setPreferredJobTypes(user.preferred_job_types || [])
      setPreferredLocation(user.preferred_location || "")
      setOpenToRemote(user.open_to_remote ?? true)
      setNeedsVisa(user.needs_visa ?? false)
      setHasChanges(false)
    }
  }

  // Fetch countries list
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

  const savePersonal = () => {
    setPersonal(tempPersonal)
    setHasChanges(true)
    setEditingPersonal(false)
  }

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      const updated = [...skills, newSkill]
      setSkills(updated)
      setHasChanges(true)
      setNewSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill))
    setHasChanges(true)
  }

  const deleteEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const deleteExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  if (isAuthLoading && !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">Syncing Profile</h3>
          <p className="text-muted-foreground animate-pulse">Retrieving your professional details...</p>
        </div>
      </div>
    )
  }

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-[80vh] w-full flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <User className="w-8 h-8 text-primary/40" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-xl font-bold text-foreground animate-pulse">Initializing Profile</h3>
          <p className="text-muted-foreground text-sm">Preparing your career dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6 tracking-tight">PROFILE</h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/30 border border-border/50 mb-8 p-1 h-14 rounded-2xl">
            <TabsTrigger value="personal" className="h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
              <User className="w-4 h-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="education" className="h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
              <GraduationCap className="w-4 h-4 mr-2" />
              Education
            </TabsTrigger>
            <TabsTrigger value="experience" className="h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
              <Briefcase className="w-4 h-4 mr-2" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="skills" className="h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
              <Code className="w-4 h-4 mr-2" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="employment" className="h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
              <FileText className="w-4 h-4 mr-2" />
              Equal Employment
            </TabsTrigger>
            <TabsTrigger value="preferences" className="h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
              <Target className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Personal Tab */}
          <TabsContent value="personal" className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 flex-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                    <User className="w-4 h-4" />
                    Name
                  </div>
                  <p className="text-xl font-semibold text-foreground">{personal.firstName} {personal.lastName}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <p className="text-xl font-semibold text-foreground">{personal.email}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                    <Phone className="w-4 h-4" />
                    Phone
                  </div>
                  <p className="text-xl font-semibold text-foreground">{personal.phone || "Not set"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                    <MapPin className="w-4 h-4" />
                    Location
                  </div>
                  <p className="text-xl font-semibold text-foreground">{personal.city}{personal.country ? `, ${personal.country}` : ""}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                    <Hash className="w-4 h-4" />
                    Postal Code
                  </div>
                  <p className="text-xl font-semibold text-foreground">{personal.postalCode || "Not set"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                    <Home className="w-4 h-4" />
                    Address
                  </div>
                  <p className="text-xl font-semibold text-foreground">{personal.addressLine || "Not set"}</p>
                </div>
              </div>
              <Button 
                variant="default" 
                onClick={() => setEditingPersonal(true)} 
                className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Personal Info
              </Button>
            </div>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Education History</h3>
              <Button onClick={() => setAddingEducation(true)} className="bg-primary text-primary-foreground h-12 px-6 rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>
            </div>

            {education.length === 0 && (
              <div className="text-center py-16 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border/50">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No education added yet. Click "Add Education" to get started.</p>
              </div>
            )}

            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="bg-muted/10 border border-border/50 rounded-2xl p-6 relative group hover:bg-muted/20 transition-all hover:shadow-xl hover:shadow-black/5">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-5">
                      <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0 text-primary font-bold text-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-lg font-medium">
                            {edu.startDate} — {edu.endDate || (edu.currentlyStudying ? "Present" : "N/A")}
                          </Badge>
                          {edu.gpa && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1 rounded-lg font-medium">
                              GPA: {edu.gpa}
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-2xl font-bold tracking-tight">{edu.schoolName}</h4>
                        <p className="text-lg text-muted-foreground font-medium">{edu.degreeType} in {edu.major}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => setEditingEducation(edu)} className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary">
                        <Pencil className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteEducation(index)} className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Work Experience Tab */}
          <TabsContent value="experience" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Professional Experience</h3>
              <Button onClick={() => setAddingExperience(true)} className="bg-primary text-primary-foreground h-12 px-6 rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            </div>

            {experience.length === 0 && (
              <div className="text-center py-16 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border/50">
                <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No work experience added yet. Click "Add Experience" to get started.</p>
              </div>
            )}

            <div className="relative pl-4">
              {experience.length > 0 && (
                <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
              )}
              
              <div className="space-y-8">
                {experience.map((exp, index) => (
                  <div key={index} className="relative pl-12 group">
                    <div className="absolute left-0 top-3 w-5 h-5 rounded-full border-4 border-background bg-primary z-10 shadow-lg shadow-primary/20 group-hover:scale-125 transition-transform" />
                    
                    <div className="bg-muted/10 border border-border/50 rounded-2xl p-8 relative hover:bg-muted/20 transition-all hover:shadow-xl hover:shadow-black/5">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 px-3 py-1 rounded-lg font-medium">
                              {exp.startDate} → {exp.endDate || (exp.currentlyWorking ? "Present" : "N/A")}
                            </Badge>
                            {exp.jobType && (
                              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 px-3 py-1 rounded-lg font-medium">
                                {exp.jobType}
                              </Badge>
                            )}
                            {exp.location && (
                              <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border/50 px-3 py-1 rounded-lg font-medium">
                                <MapPin className="w-3 h-3 mr-1" />
                                {exp.location}
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-2xl font-bold tracking-tight">{exp.company}</h4>
                          <p className="text-xl font-medium text-primary mt-1">{exp.jobTitle}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => setEditingExperience(exp)} className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary">
                            <Pencil className="w-5 h-5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteExperience(index)} className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                      
                      {exp.summary && (
                        <p className="text-foreground/80 mb-6 italic border-l-4 border-primary/20 pl-5 py-2 bg-primary/5 rounded-r-xl leading-relaxed">
                          {exp.summary}
                        </p>
                      )}

                      {exp.descriptions.filter(d => d).length > 0 && (
                        <ul className="space-y-3">
                          {exp.descriptions.filter(d => d).map((desc, i) => (
                            <li key={i} className="flex items-start gap-3 text-muted-foreground">
                              <span className="text-primary mt-2">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-base leading-relaxed">{desc}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-8">
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold tracking-tight">Technical Expertise</h3>
                <p className="text-muted-foreground">Add and manage the skills that make you stand out.</p>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <Input 
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && skillSearch) {
                        e.preventDefault()
                        if (!skills.includes(skillSearch)) {
                          const updated = [...skills, skillSearch]
                          setSkills(updated)
                          setSkillSearch("")
                          setHasChanges(true)
                        }
                      }
                    }}
                    placeholder="Search or type a skill (e.g. React, Python)..."
                    className="bg-muted/40 h-14 rounded-2xl pl-12 border-border/50 focus:border-primary/50 transition-all text-lg shadow-sm"
                  />
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40 group-focus-within:text-primary transition-colors" />
                  
                  {/* Autocomplete Suggestions */}
                  {skillSearch && filteredTech.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-2 flex flex-col gap-1">
                        {filteredTech.map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => {
                              const updated = [...skills, skill]
                              setSkills(updated)
                              setSkillSearch("")
                              setHasChanges(true)
                            }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 rounded-xl transition-all text-left group/item"
                          >
                            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center group-hover/item:bg-primary/20 transition-colors">
                              <Plus className="w-4 h-4 text-muted-foreground group-hover/item:text-primary" />
                            </div>
                            <span className="font-medium">{skill}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground ml-2">Press Enter to add a custom skill or select from the list.</p>

                <div className="flex flex-wrap gap-3 p-8 bg-muted/10 rounded-[2.5rem] min-h-[140px] border border-border/50 shadow-inner">
                  {skills.length === 0 && (
                    <div className="w-full flex flex-col items-center justify-center py-8 text-muted-foreground opacity-30">
                      <Sparkles className="w-12 h-12 mb-3" />
                      <p className="text-lg">No skills added yet.</p>
                    </div>
                  )}
                  {skills.map(skill => (
                    <Badge 
                      key={skill} 
                      className="bg-primary/10 text-foreground border-primary/20 hover:bg-primary/20 cursor-default px-5 py-2.5 text-base rounded-2xl transition-all flex items-center group shadow-sm"
                    >
                      {skill}
                      <button 
                        onClick={() => removeSkill(skill)}
                        className="ml-3 p-1 hover:bg-destructive/10 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-8 space-y-6">
                <Label className="text-sm font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2 ml-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Suggested for you
                </Label>
                <div className="flex flex-wrap gap-2">
                  {techStacks
                    .filter(s => !skills.includes(s))
                    .slice(0, 24)
                    .map(skill => (
                      <Badge 
                        key={skill} 
                        variant="outline" 
                        className="px-5 py-2.5 cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-all rounded-2xl border-border/50 bg-background/40 backdrop-blur-sm font-medium text-base hover:scale-[1.05] active:scale-[0.95]"
                        onClick={() => {
                          const updated = [...skills, skill]
                          setSkills(updated)
                          setHasChanges(true)
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2 text-primary opacity-50" />
                        {skill}
                      </Badge>
                    ))
                  }
                </div>
              </div>

              <div className="pt-12 flex justify-end">
                <p className="text-sm text-muted-foreground italic">Your skills are saved to your draft. Use the global save button to persist.</p>
              </div>
            </div>
          </TabsContent>

          {/* Equal Employment Tab */}
          <TabsContent value="employment" className="space-y-8">
            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 mb-10 flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0 text-primary">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Equality & Identity</h4>
                <p className="text-muted-foreground leading-relaxed">
                  To comply with equal employment laws and speed up your applications, you can optionally provide your identity information. This is private and only used for autofilling job applications.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border border-border/50 rounded-3xl p-8 space-y-6 bg-muted/10 shadow-sm hover:shadow-md transition-shadow">
                <Label className="text-xl font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Gender Identity
                </Label>
                <Select 
                  value={gender} 
                  onValueChange={(val) => {
                    setGender(val)
                    setHasChanges(true)
                  }}
                >
                  <SelectTrigger className="bg-background/40 h-16 rounded-2xl border-border/50 transition-all text-lg font-medium focus:ring-primary/20">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50 rounded-2xl p-2">
                    <SelectItem value="male" className="rounded-xl h-12 text-base">Male</SelectItem>
                    <SelectItem value="female" className="rounded-xl h-12 text-base">Female</SelectItem>
                    <SelectItem value="non-binary" className="rounded-xl h-12 text-base">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say" className="rounded-xl h-12 text-base">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border border-border/50 rounded-3xl p-8 space-y-6 bg-muted/10 shadow-sm hover:shadow-md transition-shadow">
                <Label className="text-xl font-bold flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Disability Status
                </Label>
                <Select 
                  value={hasDisability} 
                  onValueChange={(val) => {
                    setHasDisability(val)
                    setHasChanges(true)
                  }}
                >
                  <SelectTrigger className="bg-background/40 h-16 rounded-2xl border-border/50 transition-all text-lg font-medium focus:ring-primary/20">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50 rounded-2xl p-2">
                    <SelectItem value="yes" className="rounded-xl h-12 text-base">Yes, I have a disability</SelectItem>
                    <SelectItem value="no" className="rounded-xl h-12 text-base">No, I don't have a disability</SelectItem>
                    <SelectItem value="prefer-not-to-say" className="rounded-xl h-12 text-base">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-12 flex justify-end">
              <p className="text-sm text-muted-foreground italic">Your identity info is saved to your draft. Use the global save button to persist.</p>
            </div>
          </TabsContent>

          {/* Job Preferences Tab */}
          <TabsContent value="preferences" className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-8">
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold tracking-tight">Job Preferences</h3>
                <p className="text-muted-foreground">Tell us what you&apos;re looking for so we can find the best matches.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Roles & Job Types */}
                <div className="space-y-10">
                  <div className="space-y-4">
                    <Label className="text-base font-bold">Desired Roles</Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {desiredRoles.map(role => (
                        <Badge key={role} className="bg-primary/20 text-primary border-primary/30 px-3 py-1.5 rounded-xl">
                          {role}
                          <button 
                            onClick={() => {
                              setDesiredRoles(desiredRoles.filter(r => r !== role))
                              setHasChanges(true)
                            }}
                            className="ml-2 hover:text-foreground"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="relative group">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="e.g. Full Stack Developer"
                          value={roleInput}
                          onChange={(e) => setRoleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && roleInput.trim()) {
                              if (!desiredRoles.includes(roleInput.trim())) {
                                setDesiredRoles([...desiredRoles, roleInput.trim()])
                                setHasChanges(true)
                              }
                              setRoleInput("")
                            }
                          }}
                          className="bg-muted/30 border-border/50 h-12 rounded-xl"
                        />
                        <Button 
                          variant="outline"
                          onClick={() => {
                            if (roleInput.trim() && !desiredRoles.includes(roleInput.trim())) {
                              setDesiredRoles([...desiredRoles, roleInput.trim()])
                              setHasChanges(true)
                              setRoleInput("")
                            }
                          }}
                          className="border-border/50 h-12 px-4 rounded-xl"
                        >
                          Add
                        </Button>
                      </div>

                      {/* Role Suggestions Dropdown */}
                      {roleInput && filteredRoles.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-2 flex flex-col gap-1">
                            {filteredRoles.map(role => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => {
                                  if (!desiredRoles.includes(role)) {
                                    setDesiredRoles([...desiredRoles, role])
                                    setHasChanges(true)
                                  }
                                  setRoleInput("")
                                }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 rounded-xl transition-all text-left group/item"
                              >
                                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center group-hover/item:bg-primary/20 transition-colors">
                                  <Plus className="w-4 h-4 text-muted-foreground group-hover/item:text-primary" />
                                </div>
                                <span className="font-medium">{role}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2 ml-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Suggested roles
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {commonRoles
                        .filter(role => !desiredRoles.includes(role))
                        .slice(0, 8)
                        .map(role => (
                          <Badge 
                            key={role} 
                            variant="outline" 
                            className="bg-muted/5 border-border/50 hover:bg-primary/10 hover:border-primary/30 cursor-pointer px-4 py-2 rounded-xl transition-all font-medium text-sm"
                            onClick={() => {
                              setDesiredRoles([...desiredRoles, role])
                              setHasChanges(true)
                            }}
                          >
                            <Plus className="w-3 h-3 mr-2 text-primary" />
                            {role}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-bold">Job Types</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Full-time", "Contract", "Part-time", "Internship"].map(type => {
                        const isSelected = preferredJobTypes.includes(type)
                        return (
                          <label 
                            key={type}
                            className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/10 ring-1 ring-primary/20' : 'border-border/50 hover:border-border/80 bg-muted/10'}`}
                          >
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setPreferredJobTypes([...preferredJobTypes, type])
                                } else {
                                  setPreferredJobTypes(preferredJobTypes.filter(t => t !== type))
                                }
                                setHasChanges(true)
                              }}
                            />
                            <span className="font-medium">{type}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Location & Remote */}
                <div className="space-y-10">
                  <div className="space-y-4">
                    <Label className="text-base font-bold">Preferred Location</Label>
                    <Input 
                      placeholder="e.g. San Francisco or United States"
                      value={preferredLocation}
                      onChange={(e) => {
                        setPreferredLocation(e.target.value)
                        setHasChanges(true)
                      }}
                      className="bg-muted/30 border-border/50 h-12 rounded-xl"
                    />
                    <div className="flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-muted/10">
                      <Checkbox 
                        id="remote"
                        checked={openToRemote}
                        onCheckedChange={(checked) => {
                          setOpenToRemote(checked as boolean)
                          setHasChanges(true)
                        }}
                      />
                      <label htmlFor="remote" className="text-sm font-medium cursor-pointer">Open to Remote Roles</label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-bold">Work Authorization</Label>
                    <div className="flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-muted/10">
                      <Checkbox 
                        id="visa"
                        checked={needsVisa}
                        onCheckedChange={(checked) => {
                          setNeedsVisa(checked as boolean)
                          setHasChanges(true)
                        }}
                      />
                      <label htmlFor="visa" className="text-sm font-medium cursor-pointer">I require H1B visa sponsorship</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-12 flex justify-end">
              <p className="text-sm text-muted-foreground italic">Your preferences are saved to your draft. Use the global save button to persist.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Global Save Bar */}
      {hasChanges && (
        <div className="sticky bottom-6 mt-12 z-40 animate-in slide-in-from-bottom-8 duration-500 flex justify-center">
          <div className="bg-background/90 backdrop-blur-2xl border border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl p-3 flex items-center gap-6 pr-4 pl-6 ring-1 ring-primary/20">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Unsaved Changes</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Draft mode active</span>
            </div>
            <div className="h-10 w-px bg-border/50 mx-2" />
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={handleDiscard}
                className="h-12 px-6 rounded-2xl hover:bg-destructive/10 hover:text-destructive font-medium transition-all"
              >
                Discard
              </Button>
              <Button 
                onClick={handleGlobalSave}
                disabled={isSaving}
                className="h-12 px-10 rounded-2xl bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Save All Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Personal Sheet */}
      <Sheet open={editingPersonal} onOpenChange={setEditingPersonal}>
        <SheetContent side="right" className="w-full sm:max-w-5xl bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl p-0">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-10 pb-0 text-left">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold tracking-tight">Personal Details</SheetTitle>
                  <SheetDescription className="text-base mt-1 text-muted-foreground">Update your basic contact and location info.</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-sm font-bold ml-1 text-muted-foreground">First Name</Label>
                  <Input 
                    value={tempPersonal.firstName}
                    onChange={(e) => setTempPersonal({...tempPersonal, firstName: e.target.value})}
                    className="bg-muted/40 h-14 rounded-2xl border-border/50 focus:border-primary/50 transition-all text-lg"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold ml-1 text-muted-foreground">Last Name</Label>
                  <Input 
                    value={tempPersonal.lastName}
                    onChange={(e) => setTempPersonal({...tempPersonal, lastName: e.target.value})}
                    className="bg-muted/40 h-14 rounded-2xl border-border/50 focus:border-primary/50 transition-all text-lg"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-base font-bold ml-1 text-muted-foreground">Email Address</Label>
                  <Input 
                    value={tempPersonal.email}
                    onChange={(e) => setTempPersonal({...tempPersonal, email: e.target.value})}
                    className="bg-muted/40 h-14 rounded-2xl border-border/50 focus:border-primary/50 transition-all text-lg"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-bold ml-1 text-muted-foreground">Phone Number</Label>
                  <Input 
                    value={tempPersonal.phone}
                    onChange={(e) => setTempPersonal({...tempPersonal, phone: e.target.value})}
                    className="bg-muted/40 h-14 rounded-2xl border-border/50 focus:border-primary/50 transition-all text-lg"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-border/50">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-base font-bold ml-1 text-muted-foreground">Country</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between bg-background/40 backdrop-blur-md border-border/50 hover:border-primary/30 h-14 rounded-2xl transition-all font-medium text-lg text-left",
                            !tempPersonal.country && "text-muted-foreground"
                          )}
                        >
                          {tempPersonal.country
                            ? countries.find((country) => country === tempPersonal.country)
                            : "Select country"}
                          <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl" align="start">
                        <Command className="bg-transparent">
                          <CommandInput placeholder="Search country..." className="h-14 text-lg" />
                          <CommandList className="max-h-[400px]">
                            {isLoadingCountries ? (
                              <div className="flex items-center justify-center p-8">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                              </div>
                            ) : (
                              <>
                                <CommandEmpty className="py-6 text-center text-muted-foreground">No country found.</CommandEmpty>
                                <CommandGroup className="p-2">
                                  {countries.map((country) => (
                                    <CommandItem
                                      value={country}
                                      key={country}
                                      onSelect={() => {
                                        setTempPersonal({...tempPersonal, country})
                                      }}
                                      className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl hover:bg-primary/15 transition-colors text-lg"
                                    >
                                      <Check
                                        className={cn(
                                          "h-5 w-5 text-primary",
                                          country === tempPersonal.country ? "opacity-100" : "opacity-0"
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
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-bold ml-1 text-muted-foreground">City</Label>
                    <Input 
                      value={tempPersonal.city}
                      onChange={(e) => setTempPersonal({...tempPersonal, city: e.target.value})}
                      className="bg-muted/40 h-14 rounded-2xl border-border/50 focus:border-primary/50 transition-all text-lg"
                      placeholder="San Francisco"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-base font-bold ml-1 text-muted-foreground">Postal Code</Label>
                  <Input 
                    value={tempPersonal.postalCode}
                    onChange={(e) => setTempPersonal({...tempPersonal, postalCode: e.target.value})}
                    className="bg-muted/40 h-14 rounded-2xl border-border/50 focus:border-primary/50 transition-all text-lg"
                    placeholder="94103"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-bold ml-1 text-muted-foreground">Address Line</Label>
                  <Input 
                    value={tempPersonal.addressLine}
                    onChange={(e) => setTempPersonal({...tempPersonal, addressLine: e.target.value})}
                    className="bg-muted/40 h-14 rounded-2xl border-border/50 focus:border-primary/50 transition-all text-lg"
                    placeholder="123 Market St"
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="p-10 pt-6 border-t border-border/50 flex flex-row gap-4 bg-background/50 backdrop-blur-md">
              <Button 
                onClick={savePersonal} 
                className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Update Profile
              </Button>
              <SheetClose asChild>
                <Button variant="outline" className="h-12 px-10 rounded-2xl border-border/50 hover:bg-muted/50 transition-all text-base">
                  Cancel
                </Button>
              </SheetClose>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      {/* Education Sheet */}
      <Sheet open={!!editingEducation || addingEducation} onOpenChange={(open) => { if(!open) { setEditingEducation(null); setAddingEducation(false); } }}>
        <SheetContent side="right" className="w-full sm:max-w-5xl bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl p-0">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-10 pb-0 text-left">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold tracking-tight">{editingEducation ? 'Edit Education' : 'Add Education'}</SheetTitle>
                  <SheetDescription className="text-base mt-1 text-muted-foreground">Share your academic background and certifications.</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <Form {...educationForm}>
              <form onSubmit={educationForm.handleSubmit((values) => {
                let updated = [...education];
                if (editingEducation && education.indexOf(editingEducation) !== -1) {
                  updated[education.indexOf(editingEducation)] = values;
                } else {
                  updated.push(values);
                }
                setEducation(updated);
                updateProfile({ educations: updated });
                setEditingEducation(null);
                setAddingEducation(false);
              })} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-10 space-y-8">
                  <FormField
                    control={educationForm.control}
                    name="schoolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>School/University</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Harvard University" className="bg-muted/40 h-12 rounded-2xl border-border/50 text-base" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-8">
                    <FormField
                      control={educationForm.control}
                      name="major"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Field of Study</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Computer Science" className="bg-muted/40 h-14 rounded-2xl border-border/50 text-lg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={educationForm.control}
                      name="degreeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Degree Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted/40 h-14 rounded-2xl border-border/50 text-lg">
                                <SelectValue placeholder="Select degree" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl p-2">
                              <SelectItem value="Bachelor" className="rounded-xl h-12">Bachelor's Degree</SelectItem>
                              <SelectItem value="Master" className="rounded-xl h-12">Master's Degree</SelectItem>
                              <SelectItem value="PhD" className="rounded-xl h-12">PhD / Doctorate</SelectItem>
                              <SelectItem value="Associate" className="rounded-xl h-12">Associate Degree</SelectItem>
                              <SelectItem value="Bootcamp" className="rounded-xl h-12">Bootcamp / Certificate</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={educationForm.control}
                    name="gpa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GPA (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="3.9 / 4.0" className="bg-muted/40 h-14 rounded-2xl border-border/50 text-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border/50">
                    <FormField
                      control={educationForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Start Date</FormLabel>
                          <FormControl>
                            <DatePicker 
                              value={field.value} 
                              onChange={field.onChange} 
                              placeholder="Select start date"
                              className="bg-muted/40 h-14 rounded-2xl border-border/50 text-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={educationForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <DatePicker 
                              value={field.value} 
                              onChange={field.onChange} 
                              placeholder="Select end date"
                              className="bg-muted/40 h-14 rounded-2xl border-border/50 text-lg"
                              disabled={educationForm.watch('currentlyStudying')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={educationForm.control}
                    name="currentlyStudying"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0 bg-primary/5 p-5 rounded-2xl border border-primary/10">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="w-6 h-6 rounded-lg" />
                        </FormControl>
                        <FormLabel className="text-lg font-medium cursor-pointer flex-1">I am currently studying here</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <SheetFooter className="p-10 pt-6 border-t border-border/50 flex flex-row gap-4 bg-background/50 backdrop-blur-md">
                  <Button type="submit" className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    {editingEducation ? 'Save Changes' : 'Add Education'}
                  </Button>
                  <SheetClose asChild>
                    <Button type="button" variant="outline" className="h-12 px-10 rounded-2xl border-border/50 hover:bg-muted/50 transition-all text-base">
                      Cancel
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Experience Sheet */}
      <Sheet open={!!editingExperience || addingExperience} onOpenChange={(open) => { if(!open) { setEditingExperience(null); setAddingExperience(false); } }}>
        <SheetContent side="right" className="w-full sm:max-w-5xl bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl p-0">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-10 pb-0 text-left">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <Briefcase className="w-8 h-8" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold tracking-tight">{editingExperience ? 'Edit Experience' : 'Add Experience'}</SheetTitle>
                  <SheetDescription className="text-base mt-1 text-muted-foreground">Share your professional journey and key achievements.</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <Form {...experienceForm}>
              <form onSubmit={experienceForm.handleSubmit((values) => {
                let updated = [...experience];
                if (editingExperience && experience.indexOf(editingExperience) !== -1) {
                  updated[experience.indexOf(editingExperience)] = values;
                } else {
                  updated.push(values);
                }
                setExperience(updated);
                updateProfile({ experiences: updated });
                setEditingExperience(null);
                setAddingExperience(false);
              })} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <FormField
                      control={experienceForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Company</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Google" className="bg-muted/40 h-14 rounded-2xl border-border/50 text-lg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={experienceForm.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Job Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Senior Frontend Engineer" className="bg-muted/40 h-14 rounded-2xl border-border/50 text-lg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <FormField
                      control={experienceForm.control}
                      name="jobType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted/40 h-14 rounded-2xl border-border/50 text-lg">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl p-2">
                              <SelectItem value="Full-time" className="rounded-xl h-12">Full-time</SelectItem>
                              <SelectItem value="Part-time" className="rounded-xl h-12">Part-time</SelectItem>
                              <SelectItem value="Contract" className="rounded-xl h-12">Contract</SelectItem>
                              <SelectItem value="Internship" className="rounded-xl h-12">Internship</SelectItem>
                              <SelectItem value="Freelance" className="rounded-xl h-12">Freelance</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={experienceForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Remote / New York, NY" className="bg-muted/40 h-14 rounded-2xl border-border/50 text-lg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border/50">
                    <FormField
                      control={experienceForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Start Date</FormLabel>
                          <FormControl>
                            <DatePicker 
                              value={field.value} 
                              onChange={field.onChange} 
                              placeholder="Select start date"
                              className="bg-muted/40 h-14 rounded-2xl border-border/50 text-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={experienceForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <DatePicker 
                              value={field.value} 
                              onChange={field.onChange} 
                              placeholder="Select end date"
                              className="bg-muted/40 h-14 rounded-2xl border-border/50 text-lg"
                              disabled={experienceForm.watch('currentlyWorking')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={experienceForm.control}
                    name="currentlyWorking"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0 bg-primary/5 p-5 rounded-2xl border border-primary/10">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="w-6 h-6 rounded-lg" />
                        </FormControl>
                        <FormLabel className="text-lg font-medium cursor-pointer flex-1">I currently work here</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={experienceForm.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Summary</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="bg-muted/40 min-h-[100px] rounded-2xl border-border/50 text-lg p-4" placeholder="Briefly describe your main impact..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Key Responsibilities
                    </Label>
                    <div className="space-y-3">
                      {experienceForm.watch('descriptions').map((_, descIndex) => (
                        <div key={descIndex} className="flex items-start gap-2 group">
                          <FormField
                            control={experienceForm.control}
                            name={`descriptions.${descIndex}`}
                            render={({ field }) => (
                              <FormItem className="flex-1 space-y-0">
                                <FormControl>
                                  <Input {...field} placeholder="Reduced API latency by 40%..." className="bg-muted/40 h-12 rounded-xl border-border/50 text-lg" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {experienceForm.watch('descriptions').length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              type="button"
                              onClick={() => {
                                const descs = experienceForm.getValues('descriptions')
                                experienceForm.setValue('descriptions', descs.filter((_, i) => i !== descIndex))
                              }}
                              className="text-muted-foreground hover:text-destructive h-12 w-12 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        type="button"
                        onClick={() => {
                          const descs = experienceForm.getValues('descriptions')
                          experienceForm.setValue('descriptions', [...descs, ""])
                        }}
                        className="text-primary hover:bg-primary/5 h-10 px-4 rounded-xl"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add achievement
                      </Button>
                    </div>
                  </div>
                </div>

                <SheetFooter className="p-10 pt-6 border-t border-border/50 flex flex-row gap-4 bg-background/50 backdrop-blur-md">
                  <Button type="submit" className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    {editingExperience ? 'Save Changes' : 'Add Experience'}
                  </Button>
                  <SheetClose asChild>
                    <Button type="button" variant="outline" className="h-12 px-10 rounded-2xl border-border/50 hover:bg-muted/50 transition-all text-base">
                      Cancel
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
