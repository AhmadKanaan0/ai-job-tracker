import { MainSidebar } from "@/components/job-tracker/main-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      <main className="pl-16">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
