"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, FileText, Archive, Plus } from "lucide-react";
import { PaperHistoryTable, type PaperListItem } from "@/components/features/papers/paper-history-table";
import { MuPyqsArchive } from "@/components/features/papers/mu-pyqs-archive";

interface StudentPapersViewProps {
  initialPapers: PaperListItem[];
}

export function StudentPapersView({ initialPapers }: StudentPapersViewProps) {
  const [activeTab, setActiveTab] = useState<"generated" | "archive">("archive");

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("archive")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
              activeTab === "archive"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Official MU Past Papers Archive</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500 text-white rounded">
              5,327 PYQs
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("generated")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
              activeTab === "generated"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Practice Papers</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded">
              {initialPapers.length}
            </span>
          </button>
        </div>

        <Link
          href="/student/papers/generate"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-[6px] hover:bg-blue-700 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate New Paper</span>
        </Link>
      </div>

      {/* Tab Content */}
      {activeTab === "archive" ? (
        <MuPyqsArchive />
      ) : (
        <PaperHistoryTable initialPapers={initialPapers} />
      )}
    </div>
  );
}
