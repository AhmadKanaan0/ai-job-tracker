"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UploadCloud, FileText, CheckCircle2, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { useUploadCV } from "@/hooks/use-cv"
import { useAuth } from "@/lib/auth-context"

export function OnboardingCVUpload() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, refreshUser } = useAuth()
  const uploadCV = useUploadCV()
  const [isHovering, setIsHovering] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Redirect to auth if not logged in
  if (!authLoading && !isAuthenticated) {
    router.push("/auth")
    return null
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsHovering(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsHovering(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsHovering(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0])
    }
  }

  const handleFileSelected = (file: File) => {
    setSelectedFile(file)
    // Upload immediately
    uploadCV.mutate(file, {
      onSuccess: () => {
        refreshUser()
      }
    })
  }

  const handleContinue = () => {
    router.push("/setup")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">Upload Your CV</h1>
          <p className="text-muted-foreground text-lg">Let AI parse your resume and build your profile automatically.</p>
        </div>

        <div className="glass-card rounded-3xl p-8 mb-6">
          {/* Upload in progress */}
          {uploadCV.isPending && selectedFile && (
            <div className="border border-border/50 rounded-2xl p-12 text-center bg-muted/20">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 text-primary">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Uploading & Parsing...</h3>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</span>
              </div>
              <p className="text-sm text-muted-foreground mt-4">AI is extracting your profile data. This may take a moment.</p>
            </div>
          )}

          {/* Upload error */}
          {uploadCV.isError && (
            <div className="border border-destructive/30 rounded-2xl p-8 text-center bg-destructive/5">
              <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6 text-destructive">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Upload Failed</h3>
              <p className="text-muted-foreground mb-6">
                {(uploadCV.error as Error)?.message || "Could not upload or parse your CV. Please try again."}
              </p>
              <Button 
                onClick={() => { setSelectedFile(null); uploadCV.reset(); }}
                variant="outline"
                className="rounded-full px-8 h-12"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Upload success */}
          {uploadCV.isSuccess && selectedFile && (
            <div className="border border-border/50 rounded-2xl p-8 text-center bg-muted/20">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 text-primary">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Upload Complete!</h3>
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-8">
                <FileText className="w-4 h-4" />
                <span>{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</span>
              </div>
              
              <Button 
                onClick={handleContinue}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xl h-12 text-base font-medium transition-all group"
              >
                Continue to Profile Setup
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}

          {/* Initial drop zone — only show when no upload action is happening */}
          {!uploadCV.isPending && !uploadCV.isError && !uploadCV.isSuccess && (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200
                ${isHovering ? "border-primary bg-primary/5 scale-[1.02]" : "border-border/50 hover:border-primary/50"}
              `}
            >
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6 text-secondary">
                <UploadCloud className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Drag & drop your resume</h3>
              <p className="text-muted-foreground mb-8">Supports PDF, DOCX, and DOC up to 5MB</p>
              
              <input 
                type="file" 
                id="cv-upload" 
                className="hidden" 
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-12 text-base font-medium">
                <label htmlFor="cv-upload" className="cursor-pointer">
                  Browse Files
                </label>
              </Button>
            </div>
          )}
        </div>
        
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={handleContinue}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip for now, I'll fill it manually
          </Button>
        </div>
      </div>
    </div>
  )
}
