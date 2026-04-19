"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Zap, Upload, FileText, CheckCircle, Loader2, X } from "lucide-react"

interface CVUploadProps {
  onContinue: () => void
  onSkip: () => void
}

export function CVUpload({ onContinue, onSkip }: CVUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setIsProcessing(true)
      // Simulate AI processing
      setTimeout(() => {
        setIsProcessing(false)
        setIsComplete(true)
      }, 2500)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === "application/pdf" || droppedFile.name.endsWith(".docx"))) {
      setFile(droppedFile)
      setIsProcessing(true)
      setTimeout(() => {
        setIsProcessing(false)
        setIsComplete(true)
      }, 2500)
    }
  }

  const removeFile = () => {
    setFile(null)
    setIsProcessing(false)
    setIsComplete(false)
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
            One last step, let&apos;s <span className="font-bold">level up your search</span> by uploading your resume.
          </h1>
        </div>

        {/* Upload Card */}
        <div className="glass-card rounded-2xl p-8">
          {/* Upload Area */}
          <div 
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center transition-all
              ${file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/20'}
            `}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!file ? (
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <Button
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your Resume
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Files should be in <span className="text-primary font-medium">PDF</span> or{" "}
                  <span className="text-primary font-medium">Word</span> format and must not exceed 10MB in size.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {isProcessing ? (
                  <>
                    <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center relative">
                      <FileText className="w-10 h-10 text-primary" />
                      <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Analyzing your resume...</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Our AI is extracting your skills, experience, and qualifications
                      </p>
                    </div>
                    <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-primary animate-pulse" style={{ width: "60%" }} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg text-primary">Resume processed successfully!</h3>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{file.name}</span>
                        <button 
                          onClick={removeFile}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground text-center">
              Data privacy is the top priority at Career Agent. Your resume will only be used for job matching 
              and will never be shared with third parties. For details, please see our{" "}
              <button className="text-primary hover:underline font-medium">Privacy Policy</button>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            <Button
              variant="outline"
              className="flex-1 h-14 text-lg border-border/50"
              onClick={onSkip}
            >
              Skip for now
            </Button>
            <Button 
              className="flex-1 h-14 bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-medium rounded-full"
              onClick={onContinue}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Start Matching"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
