import { DiscoveryFeed } from "@/components/job-tracker/discovery-feed";

export default function DiscoveryPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-balance">Discovery Feed</h1>
        <p className="text-muted-foreground">Find your next opportunity</p>
      </header>
      <DiscoveryFeed />
    </>
  );
}
