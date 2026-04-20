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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  Plus,
  Trash2,
  Upload,
  FileText,
  Check,
  User as UserIcon,
  GraduationCap,
  Briefcase,
  Wrench,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ChevronsUpDown,
  Search,
  AlertCircle
} from "lucide-react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"

// interface removed

// Interfaces removed in favor of Zod schema types

const steps = [
  { number: 1, label: "Personal", icon: UserIcon },
  { number: 2, label: "Education", icon: GraduationCap },
  { number: 3, label: "Work Experience", icon: Briefcase },
  { number: 4, label: "Skills", icon: Wrench },
  { number: 5, label: "Equal Employment", icon: ShieldCheck },
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

const setupSchema = z.object({
  personal: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().optional(),
    country: z.string().min(1, "Country is required"),
    city: z.string().min(1, "City is required"),
    county: z.string().optional(),
    postalCode: z.string().optional(),
    addressLine: z.string().optional(),
  }),
  educations: z.array(z.object({
    schoolName: z.string().min(1, "School name is required"),
    major: z.string().min(1, "Major is required"),
    degreeType: z.string().min(1, "Degree type is required"),
    gpa: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    currentlyStudying: z.boolean().default(false),
  })),
  experiences: z.array(z.object({
    jobTitle: z.string().min(1, "Job title is required"),
    company: z.string().min(1, "Company is required"),
    jobType: z.string().default("Full-time"),
    location: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    currentlyWorking: z.boolean().default(false),
    summary: z.string().optional(),
    descriptions: z.array(z.string()).default([""]),
  })),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  equalEmployment: z.object({
    hasDisability: z.string().optional(),
    gender: z.string().optional(),
  }),
})

type SetupFormValues = z.infer<typeof setupSchema>

export function SetupWizard() {
  const router = useRouter()
  const { user, updateProfile, isAuthenticated, isLoading: authLoading } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [countries, setCountries] = useState<string[]>([])
  const [isLoadingCountries, setIsLoadingCountries] = useState(true)


  const onComplete = async (values: SetupFormValues) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await updateProfile({
        first_name: values.personal.firstName,
        last_name: values.personal.lastName,
        phone: values.personal.phone || undefined,
        country: values.personal.country,
        city: values.personal.city,
        county: values.personal.county || undefined,
        postal_code: values.personal.postalCode || undefined,
        address_line: values.personal.addressLine || undefined,
        educations: values.educations,
        experiences: values.experiences,
        skills: values.skills,
        has_disability: values.equalEmployment.hasDisability || undefined,
        gender: values.equalEmployment.gender || undefined,
        setup_completed: true,
      })
      router.push("/dashboard")
    } catch (err) {
      setSaveError((err as Error).message || "Failed to save profile")
      setIsSaving(false)
    }
  }

  // Redirect if not logged in or already completed
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/auth")
      } else if (user?.setup_completed) {
        router.push("/dashboard")
      } else if (!user?.has_cv) {
        router.push("/onboarding")
      }
    }
  }, [authLoading, isAuthenticated, user, router])
  
  const [step, setStep] = useState(1)
  
  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      personal: {
        firstName: user?.first_name || "",
        lastName: user?.last_name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        country: user?.country || "",
        city: user?.city || "",
        county: user?.county || "",
        postalCode: user?.postal_code || "",
        addressLine: user?.address_line || "",
      },
      educations: user?.educations?.length 
        ? user.educations.map(e => ({
            schoolName: e.schoolName || "",
            major: e.major || "",
            degreeType: e.degreeType || "",
            gpa: e.gpa || "",
            startDate: e.startDate || "",
            endDate: e.endDate || "",
            currentlyStudying: !!e.currentlyStudying,
          }))
        : [{ schoolName: "", major: "", degreeType: "", gpa: "", startDate: "", endDate: "", currentlyStudying: false }],
      experiences: user?.experiences?.length
        ? user.experiences.map(e => ({
            jobTitle: e.jobTitle || "",
            company: e.company || "",
            jobType: e.jobType || "Full-time",
            location: e.location || "",
            startDate: e.startDate || "",
            endDate: e.endDate || "",
            currentlyWorking: !!e.currentlyWorking,
            summary: e.summary || "",
            descriptions: e.descriptions?.length ? e.descriptions : [""],
          }))
        : [{ jobTitle: "", company: "", jobType: "Full-time", location: "", startDate: "", endDate: "", currentlyWorking: false, summary: "", descriptions: [""] }],
      skills: user?.skills?.length ? user.skills : ["React", "TypeScript", "Node.js", "Docker", "PostgreSQL"],
      equalEmployment: {
        hasDisability: user?.has_disability || "",
        gender: user?.gender || "",
      }
    }
  })

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control: form.control,
    name: "educations",
  })

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({
    control: form.control,
    name: "experiences",
  })

  // Sync state when user is loaded (only for initial load or if fields are empty)
  const [hasSynced, setHasSynced] = useState(false)

  useEffect(() => {
    if (user && !hasSynced) {
      form.reset({
        personal: {
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          email: user.email || "",
          phone: user.phone || "",
          country: user.country || "",
          city: user.city || "",
          county: user.county || "",
          postalCode: user.postal_code || "",
          addressLine: user.address_line || ""
        },
        educations: user.educations?.length 
          ? user.educations.map(e => ({
              schoolName: e.schoolName || "",
              major: e.major || "",
              degreeType: e.degreeType || "",
              gpa: e.gpa || "",
              startDate: e.startDate || "",
              endDate: e.endDate || "",
              currentlyStudying: !!e.currentlyStudying,
            }))
          : form.getValues().educations,
        experiences: user.experiences?.length
          ? user.experiences.map(e => ({
              jobTitle: e.jobTitle || "",
              company: e.company || "",
              jobType: e.jobType || "Full-time",
              location: e.location || "",
              startDate: e.startDate || "",
              endDate: e.endDate || "",
              currentlyWorking: !!e.currentlyWorking,
              summary: e.summary || "",
              descriptions: e.descriptions?.length ? e.descriptions : [""],
            }))
          : form.getValues().experiences,
        skills: user.skills?.length ? user.skills : form.getValues().skills,
        equalEmployment: {
          hasDisability: user.has_disability || "",
          gender: user.gender || "",
        }
      })
      setHasSynced(true)
    }
  }, [user, hasSynced, form])

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
        // Fallback to a minimal list if API fails
        setCountries(["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "India", "China", "Japan"])
      } finally {
        setIsLoadingCountries(false)
      }
    }
    fetchCountries()
  }, [])

  // Resume upload
  const [resumeUploaded, setResumeUploaded] = useState(false)
  const [newSkill, setNewSkill] = useState("")
  const [skillSearch, setSkillSearch] = useState("")

  if (authLoading || (!isAuthenticated && !authLoading) || (user?.setup_completed && !authLoading) || (!user?.has_cv && !authLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  const addSkill = () => {
    const currentSkills = form.getValues("skills")
    if (newSkill && !currentSkills.includes(newSkill)) {
      form.setValue("skills", [...currentSkills, newSkill])
      setNewSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    const currentSkills = form.getValues("skills")
    form.setValue("skills", currentSkills.filter(s => s !== skill))
  }

  const handleNext = async () => {
    let fieldsToValidate: any[] = []
    
    if (step === 1) fieldsToValidate = ["personal"]
    if (step === 2) fieldsToValidate = ["educations"]
    if (step === 3) fieldsToValidate = ["experiences"]
    if (step === 4) fieldsToValidate = ["skills"]
    if (step === 5) fieldsToValidate = ["equalEmployment"]

    const isValid = await form.trigger(fieldsToValidate as any)
    
    if (isValid) {
      if (step < 5) {
        setStep(step + 1)
      } else {
        form.handleSubmit(onComplete)()
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // Curated list of popular tech stacks for autocomplete
  const techStacks = [
    "React", "Next.js", "TypeScript", "JavaScript", "Python", "Node.js", "Docker", "Kubernetes", "AWS", "Google Cloud", "Azure",
    "Tailwind CSS", "PostgreSQL", "MongoDB", "MySQL", "Redis", "GraphQL", "REST API", "Git", "CI/CD", "Testing", "Jest", "Cypress",
    "Java", "Spring Boot", "C#", ".NET", "Go", "Rust", "Swift", "Kotlin", "Flutter", "React Native", "Vue.js", "Angular", "Svelte",
    "Figma", "Redux", "Zustand", "Prisma", "Drizzle", "Firebase", "Supabase", "Machine Learning", "Data Science", "Artificial Intelligence",
    "OpenAI", "NLP", "Computer Vision", "PyTorch", "TensorFlow", "Pandas", "NumPy", "Scikit-Learn", "FastAPI", "Django", "Flask"
  ]

  const filteredTech = techStacks.filter(s => 
    s.toLowerCase().includes(skillSearch.toLowerCase()) && 
    !form.watch("skills").includes(s)
  ).slice(0, 5)



  return (
    <div className="min-h-screen bg-background relative flex flex-col md:flex-row">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar Progress (Desktop) */}
      <div className="hidden md:flex w-80 bg-muted/30 border-r border-border/50 p-8 flex-col gap-8 backdrop-blur-xl sticky top-0 h-screen overflow-y-auto no-scrollbar">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(223,255,0,0.3)]">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">AI Setup</h1>
        </div>

        <div className="flex flex-col gap-6">
          {steps.map((s) => {
            const Icon = s.icon
            const isActive = step === s.number
            const isCompleted = step > s.number
            
            return (
              <div key={s.number} className="flex items-center gap-4 group">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border",
                  isActive ? "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(223,255,0,0.3)] scale-110" : 
                  isCompleted ? "bg-primary/20 border-primary/30 text-primary" : 
                  "bg-muted border-border text-muted-foreground group-hover:border-primary/30"
                )}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>{s.label}</span>
                  {isActive && <span className="text-[10px] text-primary uppercase tracking-widest font-bold">In Progress</span>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-auto pt-8 border-t border-border/50">
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              "{aiMessages[step as keyof typeof aiMessages]}"
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Header Progress */}
      <div className="md:hidden w-full bg-muted/30 border-b border-border/50 p-4 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
          {steps.map((s) => {
            const isActive = step === s.number
            const isCompleted = step > s.number
            return (
              <div key={s.number} className="flex-1 flex flex-col items-center gap-1">
                <div className={cn(
                  "h-1.5 w-full rounded-full transition-all duration-500",
                  isActive ? "bg-primary shadow-[0_0_10px_rgba(223,255,0,0.3)]" : 
                  isCompleted ? "bg-primary/40" : "bg-muted"
                )} />
                <span className={cn("text-[10px] font-bold", isActive ? "text-primary" : "text-muted-foreground")}>Step {s.number}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto p-6 md:p-12 lg:p-16">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">{steps[step-1].label}</h2>
            <p className="text-muted-foreground">Complete your profile to get the best matching opportunities.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onComplete)} className="space-y-10">
              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="personal.firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="John" className="bg-muted/30 h-12 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="personal.lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Doe" className="bg-muted/30 h-12 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="personal.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="john@example.com" className="bg-muted/30 h-12 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="personal.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+1 (555) 000-0000" className="bg-muted/30 h-12 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                    <FormField
                      control={form.control}
                      name="personal.country"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel required>Country</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between bg-background/40 backdrop-blur-md border-border/50 hover:border-primary/30 h-12 rounded-xl transition-all font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? countries.find((country) => country === field.value)
                                    : "Select country"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl" align="start">
                              <Command className="bg-transparent">
                                <CommandInput placeholder="Search country..." className="h-12" />
                                <CommandList className="max-h-[300px]">
                                  {isLoadingCountries ? (
                                    <div className="flex items-center justify-center p-4">
                                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    </div>
                                  ) : (
                                    <>
                                      <CommandEmpty>No country found.</CommandEmpty>
                                      <CommandGroup>
                                        {countries.map((country) => (
                                          <CommandItem
                                            value={country}
                                            key={country}
                                            onSelect={() => {
                                              form.setValue("personal.country", country)
                                            }}
                                            className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-primary/10"
                                          >
                                            <Check
                                              className={cn(
                                                "h-4 w-4 text-primary",
                                                country === field.value ? "opacity-100" : "opacity-0"
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="personal.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>City</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="San Francisco" className="bg-muted/30 h-12 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="personal.postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="94103" className="bg-muted/30 h-12 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="personal.addressLine"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123 Main Street" className="bg-muted/30 h-12 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Education */}
              {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {educationFields.map((edu, index) => (
                    <div key={edu.id} className="bg-muted/10 border border-border/50 rounded-2xl p-8 relative shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                            <span className="text-primary font-bold text-xs">{index + 1}</span>
                          </div>
                          <h3 className="font-semibold text-lg">Education History</h3>
                        </div>
                        {educationFields.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeEducation(index)}
                            className="text-muted-foreground hover:text-destructive rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name={`educations.${index}.schoolName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel required>School/University</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Harvard University" className="bg-background h-12 rounded-xl border-border/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`educations.${index}.major`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel required>Field of Study</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Computer Science" className="bg-background h-12 rounded-xl border-border/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <FormField
                          control={form.control}
                          name={`educations.${index}.degreeType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel required>Degree Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-background/40 backdrop-blur-md border-border/50 hover:border-primary/30 h-12 rounded-xl transition-all">
                                    <SelectValue placeholder="Select degree" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl max-h-[300px]">
                                  <SelectItem value="Bachelor">Bachelor</SelectItem>
                                  <SelectItem value="Master">Master</SelectItem>
                                  <SelectItem value="PhD">PhD</SelectItem>
                                  <SelectItem value="Associate">Associate</SelectItem>
                                  <SelectItem value="Bootcamp">Bootcamp/Certificate</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`educations.${index}.gpa`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GPA (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="3.8/4.0" className="bg-background h-12 rounded-xl border-border/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <FormField
                          control={form.control}
                          name={`educations.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel required>Start Date</FormLabel>
                              <FormControl>
                                <DatePicker 
                                  value={field.value} 
                                  onChange={field.onChange} 
                                  placeholder="Select start date"
                                  className="bg-background"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`educations.${index}.endDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <DatePicker 
                                  value={field.value} 
                                  onChange={field.onChange} 
                                  placeholder="Select end date"
                                  className="bg-background"
                                  disabled={form.watch(`educations.${index}.currentlyStudying`)} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`educations.${index}.currentlyStudying`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0 bg-background/50 px-3 py-1.5 rounded-full border border-border/30">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="text-xs font-normal cursor-pointer">I am currently studying here</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => appendEducation({ schoolName: "", major: "", degreeType: "", gpa: "", startDate: "", endDate: "", currentlyStudying: false })}
                    className="w-full border-dashed border-2 py-8 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <Plus className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform" />
                    Add Another Education
                  </Button>
                </div>
              )}

              {/* Step 3: Work Experience */}
              {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {experienceFields.map((exp, index) => (
                    <div key={exp.id} className="bg-muted/10 border border-border/50 rounded-2xl p-8 relative shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                            <span className="text-primary font-bold text-xs">{index + 1}</span>
                          </div>
                          <h3 className="font-semibold text-lg">Work Experience</h3>
                        </div>
                        {experienceFields.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeExperience(index)}
                            className="text-muted-foreground hover:text-destructive rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name={`experiences.${index}.jobTitle`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel required>Job Title</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Software Engineer" className="bg-background h-12 rounded-xl border-border/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`experiences.${index}.company`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel required>Company</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Tech Solutions Inc." className="bg-background h-12 rounded-xl border-border/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <FormField
                          control={form.control}
                          name={`experiences.${index}.jobType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-background/40 backdrop-blur-md border-border/50 hover:border-primary/30 h-12 rounded-xl transition-all">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl max-h-[300px]">
                                  <SelectItem value="Full-time">Full-time</SelectItem>
                                  <SelectItem value="Part-time">Part-time</SelectItem>
                                  <SelectItem value="Contract">Contract</SelectItem>
                                  <SelectItem value="Internship">Internship</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`experiences.${index}.location`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Remote / New York, NY" className="bg-background h-12 rounded-xl border-border/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <FormField
                          control={form.control}
                          name={`experiences.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel required>Start Date</FormLabel>
                              <FormControl>
                                <DatePicker 
                                  value={field.value} 
                                  onChange={field.onChange} 
                                  placeholder="Select start date"
                                  className="bg-background"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`experiences.${index}.endDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <DatePicker 
                                  value={field.value} 
                                  onChange={field.onChange} 
                                  placeholder="Select end date"
                                  className="bg-background"
                                  disabled={form.watch(`experiences.${index}.currentlyWorking`)} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-4 flex items-center gap-2 mb-6">
                        <FormField
                          control={form.control}
                          name={`experiences.${index}.currentlyWorking`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0 bg-background/50 px-3 py-1.5 rounded-full border border-border/30">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="text-xs font-normal cursor-pointer">I currently work here</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`experiences.${index}.summary`}
                        render={({ field }) => (
                          <FormItem className="mt-6">
                            <FormLabel>Role Summary</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="bg-background min-h-[100px] rounded-xl border-border/50" 
                                placeholder="Describe your main responsibilities and focus..." 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="mt-8 space-y-4">
                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          Key Achievements
                        </FormLabel>
                        {form.watch(`experiences.${index}.descriptions`).map((_, descIndex) => (
                          <div key={descIndex} className="flex items-start gap-2 group">
                            <FormField
                              control={form.control}
                              name={`experiences.${index}.descriptions.${descIndex}`}
                              render={({ field }) => (
                                <FormItem className="flex-1 space-y-0">
                                  <FormControl>
                                    <Input {...field} placeholder="Reduced API latency by 40%..." className="bg-background h-10 rounded-lg border-border/50" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {form.watch(`experiences.${index}.descriptions`).length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                  const descs = form.getValues(`experiences.${index}.descriptions`)
                                  form.setValue(`experiences.${index}.descriptions`, descs.filter((_, i) => i !== descIndex))
                                }}
                                className="text-muted-foreground hover:text-destructive h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          type="button"
                          onClick={() => {
                            const descs = form.getValues(`experiences.${index}.descriptions`)
                            form.setValue(`experiences.${index}.descriptions`, [...descs, ""])
                          }}
                          className="text-primary hover:bg-primary/5 h-8 px-2"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add achievement
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => appendExperience({ jobTitle: "", company: "", jobType: "Full-time", location: "", startDate: "", endDate: "", currentlyWorking: false, summary: "", descriptions: [""] })}
                    className="w-full border-dashed border-2 py-8 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <Plus className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform" />
                    Add Work Experience
                  </Button>
                </div>
              )}

              {/* Step 4: Skills */}
              {step === 4 && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-6">
                    <FormLabel required className="text-xl font-bold">What are your top skills?</FormLabel>
                    <div className="flex flex-col gap-4">
                      <div className="relative group">
                        <Input 
                          value={skillSearch}
                          onChange={(e) => setSkillSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && skillSearch) {
                              e.preventDefault()
                              if (!form.getValues("skills").includes(skillSearch)) {
                                form.setValue("skills", [...form.getValues("skills"), skillSearch])
                                setSkillSearch("")
                              }
                            }
                          }}
                          className="bg-muted/30 h-14 rounded-2xl pl-12 border-border/50 focus:border-primary/50 transition-all"
                          placeholder="Search or type a skill (e.g. React, Python)..."
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
                                    form.setValue("skills", [...form.getValues("skills"), skill])
                                    setSkillSearch("")
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
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mt-8">
                      {form.watch("skills").map((skill) => (
                        <Badge 
                          key={skill} 
                          variant="secondary"
                          className="px-4 py-2 text-sm bg-primary/10 text-foreground border-primary/20 flex items-center gap-2 group rounded-xl hover:bg-primary/20 transition-all cursor-default"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              removeSkill(skill)
                            }}
                            className="p-0.5 hover:bg-destructive/20 rounded-md transition-colors group"
                          >
                            <X className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-border/50">
                    <Label className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">Suggested Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {techStacks
                        .filter(s => !form.watch("skills").includes(s))
                        .slice(0, 20)
                        .map(skill => (
                          <Badge 
                            key={skill} 
                            variant="outline" 
                            className="px-4 py-2 cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-all rounded-xl border-border/50 bg-background/20"
                            onClick={() => form.setValue("skills", [...form.getValues("skills"), skill])}
                          >
                            <Plus className="w-3.5 h-3.5 mr-2 opacity-50" />
                            {skill}
                          </Badge>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Equal Employment */}
              {step === 5 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mb-8">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      To comply with equal employment laws and speed up your applications, you can optionally provide your identity information. This is private and only used for autofilling job applications.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="equalEmployment.gender"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-lg font-semibold">Gender Identity</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background/40 backdrop-blur-md border-border/50 hover:border-primary/30 h-14 rounded-2xl border-border/50 transition-all">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="non-binary">Non-binary</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="equalEmployment.hasDisability"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-lg font-semibold">Disability Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background/40 backdrop-blur-md border-border/50 hover:border-primary/30 h-14 rounded-2xl border-border/50 transition-all">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
                            <SelectItem value="yes">Yes, I have a disability</SelectItem>
                            <SelectItem value="no">No, I don't have a disability</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-12 border-t border-border/50 mt-auto">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleBack}
                  disabled={step === 1 || isSaving}
                  className="h-12 px-6 rounded-xl border-border/50 hover:bg-muted hover:border-primary/20 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>

                <div className="flex gap-4">
                  <Button 
                    type="button"
                    onClick={handleNext}
                    disabled={isSaving}
                    className="h-12 px-8 rounded-xl shadow-xl shadow-primary/20 min-w-[140px]"
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : step === 5 ? (
                      <>
                        Start Matching
                        <Sparkles className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Continue
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {saveError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                  <AlertCircle className="w-4 h-4" />
                  {saveError}
                </div>
              )}
            </form>
          </Form>
        </div>
      </main>
    </div>
  )
}
