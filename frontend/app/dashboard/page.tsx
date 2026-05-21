"use client"

import { CommandCenter } from "@/components/job-tracker/command-center";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();
  const greeting = getGreeting();
  const firstName = user?.first_name || "there";

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-balance">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-muted-foreground">Here&apos;s an overview of your job search progress</p>
      </header>
      <CommandCenter />
    </>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
