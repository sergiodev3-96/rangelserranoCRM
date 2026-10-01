import React from "react";

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 animate-pulse">
      {/* Page Title skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-surface-container rounded-lg" />
        <div className="h-4 w-80 bg-surface-container/60 rounded" />
      </div>

      {/* Filter / Action bar skeleton */}
      <div className="h-14 w-full bg-surface border border-border-default rounded-xl" />

      {/* Main content table / cards skeleton */}
      <div className="flex-1 min-h-[300px] bg-surface border border-border-default rounded-xl p-4 space-y-3">
        <div className="h-10 w-full bg-surface-container rounded-lg" />
        <div className="h-12 w-full bg-surface-container/40 rounded-lg" />
        <div className="h-12 w-full bg-surface-container/40 rounded-lg" />
        <div className="h-12 w-full bg-surface-container/40 rounded-lg" />
        <div className="h-12 w-full bg-surface-container/40 rounded-lg" />
        <div className="h-12 w-full bg-surface-container/40 rounded-lg" />
      </div>
    </div>
  );
}
