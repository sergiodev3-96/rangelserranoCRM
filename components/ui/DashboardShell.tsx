"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import type { Profile } from "@/types/profiles";

type DashboardShellProps = {
  profile: Profile;
  children: React.ReactNode;
};

export default function DashboardShell({ profile, children }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-bg-base text-text-primary">
      {/* Sidebar Navigation */}
      <Sidebar 
        isAdmin={profile.role === "admin"} 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
      />

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Main Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Atmospheric glow */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

        {/* Global Dashboard Header */}
        <Header profile={profile} onToggleSidebar={toggleSidebar} />

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative z-10 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
