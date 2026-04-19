"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Pencil, 
  Plus, 
  Trash2, 
  X,
  User,
  GraduationCap,
  Briefcase,
  Code,
  FileText
} from "lucide-react"

interface Education {
  id: number
  school: string
  major: string
  degree: string
  startDate: string
  endDate: string
}

interface Experience {
  id: number
  company: string
  title: string
  startDate: string
  endDate: string
  descriptions: string[]
}

const initialEducation: Education[] = [
  { id: 1, school: "MIT", major: "Computer Science", degree: "Master", startDate: "2018", endDate: "2020" },
  { id: 2, school: "UC Berkeley", major: "Software Engineering", degree: "Bachelor", startDate: "2014", endDate: "2018" },
]

const initialExperience: Experience[] = [
  { 
    id: 1, 
    company: "Stripe", 
    title: "Senior Software Engineer", 
    startDate: "2022-01", 
    endDate: "Present",
    descriptions: [
      "Led development of payment processing features handling $2B+ annually",
      "Architected microservices infrastructure reducing latency by 40%",
      "Mentored team of 5 junior developers"
    ]
  },
  { 
    id: 2, 
    company: "Airbnb", 
    title: "Software Engineer", 
    startDate: "2020-06", 
    endDate: "2022-01",
    descriptions: [
      "Built React components for booking flow used by millions",
      "Implemented A/B testing framework improving conversion by 15%",
      "Collaborated with design team on new checkout experience"
    ]
  },
  { 
    id: 3, 
    company: "Google", 
    title: "Software Engineer Intern", 
    startDate: "2019-06", 
    endDate: "2019-09",
    descriptions: [
      "Developed internal tools for Chrome DevTools team",
      "Implemented performance monitoring dashboard"
    ]
  },
]

const initialSkills = [
  "React", "TypeScript", "Node.js", "Python", "PostgreSQL", "Redis",
  "AWS", "Docker", "Kubernetes", "GraphQL", "Next.js", "TailwindCSS"
]

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState("personal")
  const [education, setEducation] = useState(initialEducation)
  const [experience, setExperience] = useState(initialExperience)
  const [skills, setSkills] = useState(initialSkills)
  const [newSkill, setNewSkill] = useState("")
  
  // Edit modals
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [editingEducation, setEditingEducation] = useState<Education | null>(null)
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null)
  const [addingEducation, setAddingEducation] = useState(false)
  const [addingExperience, setAddingExperience] = useState(false)

  const [personal, setPersonal] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@email.com",
    phone: "+1 234 567 8900",
    city: "San Francisco, CA",
    linkedIn: "linkedin.com/in/johndoe",
    github: "github.com/johndoe"
  })

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill])
      setNewSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill))
  }

  const deleteEducation = (id: number) => {
    setEducation(education.filter(e => e.id !== id))
  }

  const deleteExperience = (id: number) => {
    setExperience(experience.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">PROFILE</h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/30 border border-border/50 mb-6">
            <TabsTrigger value="personal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="w-4 h-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="education" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <GraduationCap className="w-4 h-4 mr-2" />
              Education
            </TabsTrigger>
            <TabsTrigger value="experience" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Briefcase className="w-4 h-4 mr-2" />
              Work Experience
            </TabsTrigger>
            <TabsTrigger value="skills" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Code className="w-4 h-4 mr-2" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="employment" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4 mr-2" />
              Equal Employment
            </TabsTrigger>
          </TabsList>

          {/* Personal Tab */}
          <TabsContent value="personal" className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                <div>
                  <Label className="text-muted-foreground text-sm">Full Name</Label>
                  <p className="text-lg font-medium">{personal.firstName} {personal.lastName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <p className="text-lg">{personal.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Phone</Label>
                  <p className="text-lg">{personal.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Location</Label>
                  <p className="text-lg">{personal.city}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">LinkedIn</Label>
                  <p className="text-lg text-primary">{personal.linkedIn}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">GitHub</Label>
                  <p className="text-lg text-primary">{personal.github}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setEditingPersonal(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Education History</h3>
              <Button onClick={() => setAddingEducation(true)} className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>
            </div>

            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-3 h-3 rounded-full bg-primary/30 mt-2 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          {edu.startDate} - {edu.endDate}
                        </div>
                        <h4 className="text-lg font-semibold">{edu.school}</h4>
                        <p className="text-muted-foreground">{edu.degree} in {edu.major}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingEducation(edu)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteEducation(edu.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Work Experience Tab */}
          <TabsContent value="experience" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Work Experience</h3>
              <Button onClick={() => setAddingExperience(true)} className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[5px] top-4 bottom-4 w-0.5 bg-amber-200/50" />
              
              <div className="space-y-6">
                {experience.map((exp) => (
                  <div key={exp.id} className="relative pl-8">
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-2 w-3 h-3 rounded-full border-2 border-muted-foreground bg-background" />
                    
                    <div className="border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">
                            {exp.startDate} → {exp.endDate}
                          </div>
                          <h4 className="text-lg font-semibold">{exp.company}</h4>
                          <p className="text-muted-foreground">{exp.title}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingExperience(exp)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteExperience(exp.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {exp.descriptions.map((desc, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground">
                            <span className="text-primary">•</span>
                            {desc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Your Skills</h3>
              <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-xl min-h-[100px]">
                {skills.map(skill => (
                  <Badge 
                    key={skill} 
                    className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 cursor-pointer px-3 py-1.5"
                    onClick={() => removeSkill(skill)}
                  >
                    {skill}
                    <X className="w-3 h-3 ml-2" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Input 
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="Add a new skill..."
                  className="bg-muted/50"
                />
                <Button onClick={addSkill} className="bg-primary text-primary-foreground">
                  Add Skill
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Equal Employment Tab */}
          <TabsContent value="employment" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border/50 rounded-xl p-5">
                <Label className="text-muted-foreground text-sm">Work Authorization</Label>
                <p className="text-lg font-medium mt-1">Authorized to work in US</p>
              </div>
              <div className="border border-border/50 rounded-xl p-5">
                <Label className="text-muted-foreground text-sm">Visa Sponsorship</Label>
                <p className="text-lg font-medium mt-1">Not required</p>
              </div>
              <div className="border border-border/50 rounded-xl p-5">
                <Label className="text-muted-foreground text-sm">Veteran Status</Label>
                <p className="text-lg font-medium mt-1">Not a veteran</p>
              </div>
              <div className="border border-border/50 rounded-xl p-5">
                <Label className="text-muted-foreground text-sm">Disability Status</Label>
                <p className="text-lg font-medium mt-1">Declined to state</p>
              </div>
            </div>
            <Button variant="outline" className="mt-4">
              <Pencil className="w-4 h-4 mr-2" />
              Edit Employment Information
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Personal Modal */}
      <Dialog open={editingPersonal} onOpenChange={setEditingPersonal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Personal Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input 
                  value={personal.firstName}
                  onChange={(e) => setPersonal({...personal, firstName: e.target.value})}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input 
                  value={personal.lastName}
                  onChange={(e) => setPersonal({...personal, lastName: e.target.value})}
                  className="bg-muted/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                value={personal.email}
                onChange={(e) => setPersonal({...personal, email: e.target.value})}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input 
                value={personal.phone}
                onChange={(e) => setPersonal({...personal, phone: e.target.value})}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input 
                value={personal.city}
                onChange={(e) => setPersonal({...personal, city: e.target.value})}
                className="bg-muted/50"
              />
            </div>
            <Button onClick={() => setEditingPersonal(false)} className="w-full bg-primary text-primary-foreground">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Add Education Modal */}
      <Dialog open={!!editingEducation || addingEducation} onOpenChange={() => { setEditingEducation(null); setAddingEducation(false); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingEducation ? 'Edit Education' : 'Add Education'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>School Name</Label>
              <Input 
                defaultValue={editingEducation?.school || ''}
                className="bg-muted/50"
                placeholder="e.g., MIT"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Major</Label>
                <Input 
                  defaultValue={editingEducation?.major || ''}
                  className="bg-muted/50"
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label>Degree</Label>
                <Select defaultValue={editingEducation?.degree || ''}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bachelor">Bachelor</SelectItem>
                    <SelectItem value="Master">Master</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Year</Label>
                <Input 
                  defaultValue={editingEducation?.startDate || ''}
                  className="bg-muted/50"
                  placeholder="2018"
                />
              </div>
              <div className="space-y-2">
                <Label>End Year</Label>
                <Input 
                  defaultValue={editingEducation?.endDate || ''}
                  className="bg-muted/50"
                  placeholder="2022"
                />
              </div>
            </div>
            <Button onClick={() => { setEditingEducation(null); setAddingEducation(false); }} className="w-full bg-primary text-primary-foreground">
              {editingEducation ? 'Save Changes' : 'Add Education'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Add Experience Modal */}
      <Dialog open={!!editingExperience || addingExperience} onOpenChange={() => { setEditingExperience(null); setAddingExperience(false); }}>
        <DialogContent className="bg-card border-border max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingExperience ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input 
                  defaultValue={editingExperience?.company || ''}
                  className="bg-muted/50"
                  placeholder="e.g., Stripe"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input 
                  defaultValue={editingExperience?.title || ''}
                  className="bg-muted/50"
                  placeholder="e.g., Senior Engineer"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input 
                  defaultValue={editingExperience?.startDate || ''}
                  className="bg-muted/50"
                  placeholder="2022-01"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input 
                  defaultValue={editingExperience?.endDate || ''}
                  className="bg-muted/50"
                  placeholder="Present"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Responsibilities & Achievements</Label>
              <Textarea 
                defaultValue={editingExperience?.descriptions.join('\n') || ''}
                className="bg-muted/50 min-h-[120px]"
                placeholder="Enter each bullet point on a new line..."
              />
            </div>
            <Button onClick={() => { setEditingExperience(null); setAddingExperience(false); }} className="w-full bg-primary text-primary-foreground">
              {editingExperience ? 'Save Changes' : 'Add Experience'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
