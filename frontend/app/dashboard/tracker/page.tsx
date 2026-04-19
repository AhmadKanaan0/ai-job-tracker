import { ApplicationTracker } from "@/components/job-tracker/application-tracker";

export default function TrackerPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-balance">Application Tracker</h1>
        <p className="text-muted-foreground">Track all your applications</p>
      </header>
      <ApplicationTracker />
    </>
  );
}
