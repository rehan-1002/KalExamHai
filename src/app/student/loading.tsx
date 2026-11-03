import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboardLoading() {
  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner Skeleton */}
      <Skeleton className="h-20 w-full rounded-xl" />

      {/* Header & User Info Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28 rounded-[6px]" />
          <Skeleton className="h-10 w-36 rounded-[6px]" />
        </div>
      </div>

      {/* 4 Tool Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-10 rounded-[6px]" />
              <Skeleton className="h-5 w-16 rounded-[4px]" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-8 w-full rounded-[6px] mt-2" />
          </div>
        ))}
      </div>

      {/* Recent Study Sessions Skeleton */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-3 flex items-center justify-between">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-7 w-20 rounded-[6px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

