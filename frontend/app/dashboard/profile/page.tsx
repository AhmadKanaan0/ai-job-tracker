"use client"

import { ProfilePage as ProfileContent } from "@/components/job-tracker/profile-page"

export default function ProfilePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your professional profile and application preferences.</p>
      </div>
      <ProfileContent />
    </div>
  )
}
