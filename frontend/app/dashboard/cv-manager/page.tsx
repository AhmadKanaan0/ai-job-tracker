import { CVManager } from "@/components/job-tracker/cv-manager";

export default function CVManagerPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-balance">CV Manager</h1>
        <p className="text-muted-foreground">Manage and optimize your master CV</p>
      </header>
      <CVManager />
    </>
  );
}
