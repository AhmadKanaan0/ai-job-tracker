"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Download, Sparkles, ArrowUpCircle, Edit3, Zap } from "lucide-react"

import { useGenerateCoverLetter } from "@/hooks/use-cover-letter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { CoverLetter } from "@/lib/types";

interface CoverLetterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  cvId: number;
}

export function CoverLetterDrawer({ open, onOpenChange, jobId, cvId }: CoverLetterDrawerProps) {
  const [generatedLetter, setGeneratedLetter] = useState<CoverLetter | null>(null);
  const generateMutation = useGenerateCoverLetter();

  useEffect(() => {
    if (open && !generatedLetter) {
      handleGenerate();
    }
  }, [open]);

  const handleGenerate = async () => {
    try {
      const letter = await generateMutation.mutateAsync({
        job_id: jobId,
        cv_id: cvId,
        tone: "professional"
      });
      setGeneratedLetter(letter);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate cover letter");
    }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-full !max-w-full sm:!max-w-[1000px] overflow-y-auto bg-background p-0 border-l border-border/50"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-6 pt-6 pb-5">
          <SheetHeader className="p-0">
            <SheetTitle className="text-xl font-bold flex items-center gap-3 flex-wrap">
              Generate Your Cover Letter
              <Badge variant="outline" className="text-muted-foreground border-border/50 text-xs font-normal">1 credit consumed</Badge>
              <Badge className="bg-primary/20 text-primary border border-primary/30 text-xs font-medium">1 credit available today</Badge>
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 pb-28">

          {/* LEFT: Document Preview */}
          <div className="flex justify-center">
            <div className="w-full bg-card rounded-lg border border-border/50 p-8 sm:p-10 shadow-2xl shadow-black/20 relative">
              {/* Edit button */}
              <div className="absolute top-4 right-4">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-8 px-4 text-xs font-bold shadow-[0_0_8px_rgba(223,255,0,0.2)]">
                  <Edit3 className="w-3 h-3 mr-1.5" /> Edit
                </Button>
              </div>

              {/* Contact Info */}
              <div className="text-right text-sm space-y-0.5 mb-8 pr-16">
                <p className="font-semibold text-foreground">Ahmad Kanaan</p>
                <p className="text-muted-foreground">Tripoli, Lebanon</p>
                <p className="text-muted-foreground">+961 81 849 055</p>
                <p className="text-primary text-xs">ahmad.w.kanaan@gmail.com</p>
              </div>

              {/* Letter Body */}
              <div className="space-y-4 text-sm leading-relaxed text-foreground/85 min-h-[400px] flex flex-col justify-center">
                {generateMutation.isPending ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ) : generatedLetter ? (
                  <div className="whitespace-pre-wrap">
                    {generatedLetter.content}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground italic">Failed to generate letter.</p>
                )}
              </div>

              {/* Page Count */}
              <div className="flex justify-center mt-8">
                <div className="bg-foreground text-background text-xs font-bold px-3.5 py-1 rounded-full">1/1</div>
              </div>
            </div>
          </div>

          {/* RIGHT: AI Editor Panel */}
          <div className="flex flex-col gap-4">
            <Tabs defaultValue="ai" className="w-full">
              <TabsList className="w-full bg-muted/30 p-1 h-10 rounded-lg border border-border/50">
                <TabsTrigger value="ai" className="w-1/2 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">AI Rewrite</TabsTrigger>
                <TabsTrigger value="editor" className="w-1/2 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">Editor</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex-1 rounded-xl border border-border/50 bg-muted/10 p-5 flex flex-col">
              {/* AI Message */}
              <div className="bg-muted/30 rounded-xl rounded-tl-sm p-3.5 border border-border/50 text-sm mb-5">
                <span className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/90">
                    {generateMutation.isPending 
                      ? "I'm crafting your perfect cover letter... This will just take a moment."
                      : "Your cover letter is ready! Want to tweak the tone, length, or any details? Just tell me."}
                  </span>
                </span>
              </div>

              {/* Quick Suggestions */}
              <div className="space-y-2 flex flex-col items-end mb-6">
                {[
                  "Make the tone more confident and professional",
                  "Improve the opening paragraph",
                  "Make this more tailored to the job"
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    className="text-xs border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all bg-background rounded-full px-3.5 py-2 flex items-center gap-2 text-foreground/80"
                  >
                    {suggestion}
                    <ArrowUpCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="mt-auto border border-border/50 focus-within:border-primary/40 transition-colors rounded-xl p-3 bg-background/50">
                <textarea
                  className="w-full bg-transparent border-none resize-none focus:outline-none min-h-[50px] text-sm placeholder:text-muted-foreground/60"
                  placeholder="Tell me how you'd like to tweak your cover letter..."
                />
                <div className="flex justify-end mt-1.5">
                  <Button size="sm" className="bg-primary/15 hover:bg-primary/25 text-primary font-semibold rounded-full border border-primary/25 h-8 text-xs">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Edit With AI
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-4 flex justify-center items-center gap-3">
          <Button variant="outline" className="h-11 px-6 rounded-full border-border/50 font-semibold">
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
          <Button className="h-11 px-10 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-[0_0_12px_rgba(223,255,0,0.25)] hover:shadow-[0_0_20px_rgba(223,255,0,0.4)] transition-all">
            <Zap className="w-4 h-4 mr-2 fill-current" /> APPLY NOW
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
