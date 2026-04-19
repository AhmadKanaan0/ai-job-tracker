"use client"

import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Tag } from "lucide-react"

const strengths = [
  "Strong React and TypeScript expertise clearly demonstrated",
  "Quantified achievements with specific metrics",
  "Clear progression in career trajectory",
  "Excellent project descriptions with business impact",
]

const weaknesses = [
  "Missing keywords: CI/CD, Agile, Scrum",
  "No mention of cloud certifications",
  "Could expand on leadership experience",
]

const missingKeywords = [
  "CI/CD", "Agile", "Scrum", "Kubernetes", "AWS Certified", 
  "System Design", "Microservices", "TDD", "A/B Testing"
]

const sampleCV = `JOHN DOE
Senior Software Engineer

SUMMARY
Passionate full-stack engineer with 6+ years of experience building scalable web applications. Expert in React, TypeScript, and Node.js with a track record of delivering high-impact features.

EXPERIENCE

Senior Software Engineer | Acme Corp | 2021 - Present
• Led development of customer-facing dashboard serving 100k+ daily users
• Reduced page load time by 40% through code splitting and lazy loading
• Mentored 3 junior developers, conducting weekly code reviews
• Implemented real-time notifications using WebSocket technology

Software Engineer | Tech Startup | 2019 - 2021
• Built RESTful APIs handling 1M+ requests daily
• Migrated legacy jQuery codebase to modern React architecture
• Improved test coverage from 45% to 85%

SKILLS
React, TypeScript, Node.js, PostgreSQL, GraphQL, Docker, Git

EDUCATION
B.S. Computer Science | State University | 2018`

export function CVManager() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* CV Editor */}
      <div className="lg:col-span-2 glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Master CV</h3>
        <Textarea 
          className="min-h-[600px] bg-muted/30 font-mono text-sm leading-relaxed resize-none"
          defaultValue={sampleCV}
          placeholder="Paste your master CV here..."
        />
      </div>

      {/* AI Assessment */}
      <div className="space-y-6">
        {/* Strengths */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Strengths
          </h3>
          <ul className="space-y-3">
            {strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                <span className="text-green-400/90">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Areas to Improve
          </h3>
          <ul className="space-y-3">
            {weaknesses.map((weakness, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                <span className="text-red-400/90">{weakness}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Missing Keywords */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-orange-400" />
            Missing Industry Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.map((keyword, i) => (
              <Badge 
                key={i}
                variant="outline"
                className="border-orange-400/30 text-orange-400 bg-orange-400/10 cursor-pointer hover:bg-orange-400/20"
              >
                + {keyword}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
