import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function GenerateWizardLoading() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-slate-200">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Step 1: Format Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
      </div>

      {/* Step 2: Document Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-12 w-full rounded-[6px]" />
      </div>

      {/* Step 3: Metadata Inputs */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-10 w-full rounded-[6px]" />
        <Skeleton className="h-10 w-full rounded-[6px]" />
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-44 rounded-[6px]" />
      </div>
    </div>
  );
}

