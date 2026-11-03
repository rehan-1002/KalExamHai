import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentPapersLoading() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-36 rounded-[6px]" />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <Skeleton className="h-10 w-full sm:w-72 rounded-[6px]" />
        <div className="flex gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-20 rounded-[6px]" />
          <Skeleton className="h-9 w-24 rounded-[6px]" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="divide-y divide-slate-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Skeleton className="h-8 w-16 rounded-[6px] shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/4 max-w-xs" />
                  <Skeleton className="h-3 w-1/2 max-w-[180px]" />
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Skeleton className="h-6 w-20 rounded-[6px] hidden sm:block" />
                <Skeleton className="h-8 w-24 rounded-[6px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

