import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaperDetailLoading() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Top action bar skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <Skeleton className="h-8 w-28 rounded-[6px]" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-[6px]" />
          <Skeleton className="h-8 w-24 rounded-[6px]" />
        </div>
      </div>

      {/* Main Paper Sheet Skeleton */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-sm space-y-6">
        {/* Mumbai University Header */}
        <div className="text-center space-y-2 border-b border-slate-200 pb-6">
          <Skeleton className="h-6 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <div className="flex justify-between items-center pt-3 text-xs max-w-md mx-auto">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* General Instructions Skeleton */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>

        {/* Questions Skeleton Blocks */}
        {[1, 2, 3].map((qNo) => (
          <div key={qNo} className="border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>

            {/* Sub-questions */}
            <div className="space-y-3 pl-2">
              {[1, 2].map((sub) => (
                <div key={sub} className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-6 w-10 shrink-0 rounded-[4px]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

