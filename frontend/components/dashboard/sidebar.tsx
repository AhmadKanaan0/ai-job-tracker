"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  Phone,
  Zap,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Patients" },
  { icon: Calendar, label: "Calendar" },
  { icon: MessageSquare, label: "Messages" },
  { icon: Phone, label: "Calls" },
  { icon: Settings, label: "Settings" },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center bg-sidebar py-6">
      <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
        <Zap className="h-5 w-5 text-primary-foreground" />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-4">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
              item.active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5" />
          </button>
        ))}
      </nav>
    </aside>
  );
}
