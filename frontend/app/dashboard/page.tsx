import { CommandCenter } from "@/components/job-tracker/command-center";

export default function DashboardPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-balance">Command Center</h1>
        <p className="text-muted-foreground">Overview of your job search progress</p>
      </header>
      <CommandCenter />
    </>
  );
}
