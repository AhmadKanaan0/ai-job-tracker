"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CheckCircle2, Download, Sparkles, ArrowUpCircle, Edit3, Zap, Copy, Check } from "lucide-react"

import { useGenerateCoverLetter } from "@/hooks/use-cover-letter";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useRef } from "react";
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
  const [editedContent, setEditedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const generateMutation = useGenerateCoverLetter();
  const { user } = useAuth();

  useEffect(() => {
    if (open && !generatedLetter) {
      handleGenerate();
    }
  }, [open]);

  // Sync edited content when generated letter changes
  useEffect(() => {
    if (generatedLetter) {
      setEditedContent(generatedLetter.content);
    }
  }, [generatedLetter]);

  const handleGenerate = async () => {
    try {
      const letter = await generateMutation.mutateAsync({
        job_id: jobId,
        cv_id: cvId,
        tone: "professional"
      });
      setGeneratedLetter(letter);
    } catch (err: any) {
      const isApiLimit = err.status === 401 || err.status === 402 || err.status === 429;
      toast.error(err.message || "Failed to generate cover letter", { 
        duration: isApiLimit ? 10000 : 4000,
        style: isApiLimit ? { border: '1px solid #ff4444', backgroundColor: '#ff444410' } : undefined
      });
    }
  };

  const handleRegenerate = async (instruction?: string) => {
    try {
      const letter = await generateMutation.mutateAsync({
        job_id: jobId,
        cv_id: cvId,
        tone: instruction?.includes("confident") ? "professional" 
            : instruction?.includes("opening") ? "professional"
            : "professional"
      });
      setGeneratedLetter(letter);
      toast.success("Cover letter regenerated!");
    } catch (err: any) {
      const isApiLimit = err.status === 401 || err.status === 402 || err.status === 429;
      toast.error(err.message || "Failed to regenerate", {
        duration: isApiLimit ? 10000 : 4000,
        style: isApiLimit ? { border: '1px solid #ff4444', backgroundColor: '#ff444410' } : undefined
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent || generatedLetter?.content || "");
      setCopied(true);
      toast.success("Cover letter copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDownload = () => {
    const content = editedContent || generatedLetter?.content || "";
    if (!content) return;
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Cover letter downloaded!");
  };

  const displayContent = isEditing ? editedContent : (editedContent || generatedLetter?.content || "");

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
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 pb-28">

          {/* LEFT: Document Preview */}
          <div className="flex justify-center">
            <div className="w-full bg-card rounded-lg border border-border/50 p-8 sm:p-10 shadow-2xl shadow-black/20 relative">
              {/* Edit/Preview toggle button */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button 
                  size="sm" 
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                      toast.success("Changes saved!");
                    } else {
                      setIsEditing(true);
                      setActiveTab("editor");
                      setTimeout(() => editorRef.current?.focus(), 100);
                    }
                  }}
                  className={isEditing 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-8 px-4 text-xs font-bold shadow-[0_0_8px_rgba(223,255,0,0.2)]"
                    : "rounded-full h-8 px-4 text-xs font-bold border-border/50"
                  }
                >
                  <Edit3 className="w-3 h-3 mr-1.5" /> {isEditing ? "Save" : "Edit"}
                </Button>
              </div>

              {/* Contact Info */}
              <div className="text-right text-sm space-y-0.5 mb-8 pr-16">
                <p className="font-semibold text-foreground">{user?.first_name} {user?.last_name}</p>
                <p className="text-muted-foreground">{user?.city}{user?.country ? `, ${user?.country}` : ""}</p>
                <p className="text-muted-foreground">{user?.phone}</p>
                <p className="text-primary text-xs">{user?.email}</p>
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
                ) : isEditing ? (
                  <textarea
                    ref={editorRef}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full min-h-[400px] bg-transparent border-none resize-none focus:outline-none text-sm leading-relaxed text-foreground/85 font-[inherit]"
                    placeholder="Edit your cover letter here..."
                  />
                ) : displayContent ? (
                  <div className="whitespace-pre-wrap">
                    {displayContent}
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
            <Tabs value={activeTab} onValueChange={(v) => {
              setActiveTab(v);
              if (v === "editor") {
                setIsEditing(true);
                setTimeout(() => editorRef.current?.focus(), 100);
              } else {
                setIsEditing(false);
              }
            }} className="w-full">
              <TabsList className="w-full bg-muted/30 p-1 h-10 rounded-lg border border-border/50">
                <TabsTrigger value="ai" className="w-1/2 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">AI Rewrite</TabsTrigger>
                <TabsTrigger value="editor" className="w-1/2 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">Editor</TabsTrigger>
              </TabsList>

              {/* AI Rewrite Tab */}
              <TabsContent value="ai" className="mt-4">
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
                        onClick={() => handleRegenerate(suggestion)}
                        disabled={generateMutation.isPending}
                        className="text-xs border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all bg-background rounded-full px-3.5 py-2 flex items-center gap-2 text-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <Button 
                        size="sm" 
                        onClick={() => handleRegenerate()}
                        disabled={generateMutation.isPending}
                        className="bg-primary/15 hover:bg-primary/25 text-primary font-semibold rounded-full border border-primary/25 h-8 text-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Edit With AI
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Manual Editor Tab */}
              <TabsContent value="editor" className="mt-4">
                <div className="flex-1 rounded-xl border border-border/50 bg-muted/10 p-5 flex flex-col gap-4">
                  {/* Editor Instructions */}
                  <div className="bg-muted/30 rounded-xl rounded-tl-sm p-3.5 border border-border/50 text-sm">
                    <span className="flex items-start gap-2">
                      <Edit3 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/90">
                        You&apos;re in editing mode. Make changes directly on the cover letter preview to the left.
                        Your edits are saved automatically.
                      </span>
                    </span>
                  </div>

                  {/* Formatting Tips */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h4>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="w-full justify-start border-border/50 hover:border-primary/40 hover:bg-primary/5 h-9 text-xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 mr-2 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-2" />}
                      {copied ? "Copied!" : "Copy to clipboard"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="w-full justify-start border-border/50 hover:border-primary/40 hover:bg-primary/5 h-9 text-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-2" />
                      Download as text file
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (generatedLetter) {
                          setEditedContent(generatedLetter.content);
                          toast.info("Reverted to original");
                        }
                      }}
                      className="w-full justify-start border-border/50 hover:border-destructive/40 hover:bg-destructive/5 h-9 text-xs text-destructive"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5 mr-2" />
                      Revert to original
                    </Button>
                  </div>

                  {/* Word Count */}
                  <div className="mt-auto pt-4 border-t border-border/30">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Word count</span>
                      <span className="font-mono">{editedContent.split(/\s+/).filter(Boolean).length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>Character count</span>
                      <span className="font-mono">{editedContent.length}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-4 flex justify-center items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleCopy}
            className="h-11 px-6 rounded-full border-border/50 font-semibold"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownload}
            className="h-11 px-6 rounded-full border-border/50 font-semibold"
          >
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
