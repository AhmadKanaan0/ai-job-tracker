import { PipelineBoard } from "@/components/job-tracker/pipeline-board"

export default function PipelinePage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-balance">Pipeline</h1>
        <p className="text-muted-foreground">All tracked applications with scores, status, and quick actions</p>
      </header>
      <PipelineBoard />
    </>
  )
}
