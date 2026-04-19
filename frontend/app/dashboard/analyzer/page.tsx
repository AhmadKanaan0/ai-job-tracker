import { AIAnalyzer } from "@/components/job-tracker/ai-analyzer";

export default function AnalyzerPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-balance">AI Analyzer</h1>
        <p className="text-muted-foreground">AI-powered job matching and CV optimization</p>
      </header>
      <AIAnalyzer />
    </>
  );
}
