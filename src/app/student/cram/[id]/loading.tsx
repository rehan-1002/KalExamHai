import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CramArtifactLoading() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <Skeleton className="h-8 w-28 rounded-[6px]" />
        <Skeleton className="h-7 w-32 rounded-[6px]" />
      </div>

      {/* Header Info Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-3/4 max-w-md" />
        <Skeleton className="h-4 w-1/3 max-w-[200px]" />
      </div>

      {/* Main Study Card Skeleton (3D Holo Flashcard Shape) */}
      <div className="w-full max-w-xl mx-auto h-[380px] sm:h-[420px] bg-white border-2 border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-lg">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-24 rounded-[6px]" />
          <Skeleton className="h-5 w-20 rounded-[6px]" />
        </div>

        <div className="my-auto space-y-3 py-6">
          <Skeleton className="h-6 w-5/6 mx-auto" />
          <Skeleton className="h-6 w-2/3 mx-auto" />
        </div>

        <div className="flex justify-center">
          <Skeleton className="h-4 w-48 rounded-[4px]" />
        </div>
      </div>

      {/* Bottom Control Bar Skeleton */}
      <div className="flex justify-center gap-4 pt-4 max-w-md mx-auto">
        <Skeleton className="h-10 w-32 rounded-[6px]" />
        <Skeleton className="h-10 w-32 rounded-[6px]" />
      </div>
    </div>
  );
}

