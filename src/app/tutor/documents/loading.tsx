import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TutorDocumentsLoading() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-[6px]" />
      </div>

      <Skeleton className="h-36 w-full rounded-xl border border-slate-200" />

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="divide-y divide-slate-100">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Skeleton className="h-10 w-10 rounded-[6px] shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-4 w-1/2 max-w-xs" />
                  <Skeleton className="h-3 w-1/3 max-w-[140px]" />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Skeleton className="h-6 w-16 rounded-[6px]" />
                <Skeleton className="h-8 w-8 rounded-[6px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

