"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Brain, Zap, CheckCircle, AlertCircle, Send } from "lucide-react"

const jobRequirements = [
  { skill: "React", status: "match" as const },
  { skill: "TypeScript", status: "match" as const },
  { skill: "Node.js", status: "match" as const },
  { skill: "GraphQL", status: "match" as const },
  { skill: "Kubernetes", status: "missing" as const },
  { skill: "AWS Lambda", status: "partial" as const },
  { skill: "5+ years experience", status: "match" as const },
  { skill: "Team leadership", status: "partial" as const },
]

const cvDiff = [
  { type: "remove", text: "3 years of experience in frontend development" },
  { type: "add", text: "5+ years of experience building scalable web applications" },
  { type: "context", text: "" },
  { type: "remove", text: "Familiar with React and JavaScript" },
  { type: "add", text: "Expert-level proficiency in React, TypeScript, and modern JavaScript ecosystems" },
  { type: "context", text: "" },
  { type: "add", text: "Experience deploying applications to AWS (Lambda, EC2, S3)" },
  { type: "context", text: "" },
  { type: "remove", text: "Worked on team projects" },
  { type: "add", text: "Led cross-functional teams of 5+ engineers, mentoring junior developers" },
]

export function AIAnalyzer() {
  const [url, setUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)

  const handleAnalyze = () => {
    if (!url) return
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setAnalyzed(true)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex gap-4">
          <Input 
            placeholder="Paste job post URL here..." 
            className="flex-1 bg-muted/50 text-lg h-14"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button 
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 animate-pulse-glow"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Brain className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Analyze & Diff
              </>
            )}
          </Button>
        </div>
      </div>

      {analyzed && (
        <>
          {/* Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job Intel */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-secondary" />
                Job Intelligence
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Required skills and qualifications extracted from job posting:
                </p>
                <div className="flex flex-wrap gap-2">
                  {jobRequirements.map((req, i) => (
                    <Badge 
                      key={i}
                      className={
                        req.status === "match" 
                          ? "bg-green-500/20 text-green-400 border-green-500/30" 
                          : req.status === "missing"
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      }
                    >
                      {req.status === "match" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {req.status === "missing" && <AlertCircle className="w-3 h-3 mr-1" />}
                      {req.skill}
                    </Badge>
                  ))}
                </div>
                
                <div className="mt-6 p-4 rounded-xl bg-muted/30">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Overall Match</span>
                    <span className="text-primary font-bold">87%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '87%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* CV Diff */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                CV Optimization Diff
              </h3>
              <div className="bg-muted/30 rounded-xl p-4 font-mono text-sm space-y-1 max-h-80 overflow-y-auto">
                {cvDiff.map((line, i) => (
                  <div 
                    key={i}
                    className={
                      line.type === "remove" 
                        ? "bg-red-500/20 text-red-400 px-2 py-1 rounded line-through"
                        : line.type === "add"
                        ? "bg-green-500/20 text-green-400 px-2 py-1 rounded"
                        : "h-2"
                    }
                  >
                    {line.type === "remove" && "- "}
                    {line.type === "add" && "+ "}
                    {line.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button 
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-6 text-lg animate-pulse-glow"
            >
              <Send className="w-5 h-5 mr-2" />
              Approve & Auto-Apply
            </Button>
          </div>
        </>
      )}

      {!analyzed && !isAnalyzing && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">AI-Powered Job Analysis</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Paste a job posting URL above to analyze requirements and get AI-optimized CV suggestions
          </p>
        </div>
      )}
    </div>
  )
}
