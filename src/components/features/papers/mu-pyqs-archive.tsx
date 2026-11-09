"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Download,
  ExternalLink,
  Sparkles,
  Layers,
  BookOpen,
  Filter,
  Loader2,
  Calendar,
} from "lucide-react";
import { fetchMuPastPapersAction } from "@/app/student/papers/pyq-actions";
import type { MuPyqItem } from "@/data/mu-pyqs";

const BRANCH_OPTIONS = [
  { id: "fe", label: "FE (First Year)", maxSem: 2 },
  { id: "comps", label: "Computer Engg", maxSem: 8 },
  { id: "it", label: "Information Tech", maxSem: 8 },
  { id: "aids", label: "AI & Data Science", maxSem: 8 },
  { id: "aiml", label: "AI & Machine Learning", maxSem: 8 },
  { id: "mech", label: "Mechanical Engg", maxSem: 8 },
  { id: "electrical", label: "Electrical Engg", maxSem: 8 },
  { id: "civil", label: "Civil Engg", maxSem: 8 },
];

export function MuPyqsArchive() {
  const [selectedBranch, setSelectedBranch] = useState("comps");
  const [selectedSem, setSelectedSem] = useState<number>(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [nepOnly, setNepOnly] = useState(false);
  const [papers, setPapers] = useState<MuPyqItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const currentBranchConfig = BRANCH_OPTIONS.find((b) => b.id === selectedBranch) || BRANCH_OPTIONS[1]!;

  const loadPapers = () => {
    startTransition(async () => {
      const res = await fetchMuPastPapersAction(
        selectedBranch,
        selectedSem,
        searchQuery.trim() || undefined,
        nepOnly
      );
      if (res.ok) {
        setPapers(res.papers);
        setTotalCount(res.totalCount);
      }
    });
  };

  useEffect(() => {
    loadPapers();
  }, [selectedBranch, selectedSem, nepOnly]);

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    const branch = BRANCH_OPTIONS.find((b) => b.id === branchId);
    if (branch && selectedSem > branch.maxSem) {
      setSelectedSem(1);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPapers();
  };

  const semestersList = Array.from({ length: currentBranchConfig.maxSem }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3.5">
        {/* Branch Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {BRANCH_OPTIONS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => handleBranchChange(b.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] shrink-0 transition-colors cursor-pointer ${
                selectedBranch === b.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Semester selector & Search query */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          {/* Semesters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
              Semester:
            </span>
            {semestersList.map((sem) => (
              <button
                key={sem}
                type="button"
                onClick={() => setSelectedSem(sem)}
                className={`w-7 h-7 text-xs font-bold rounded-[6px] transition-colors cursor-pointer shrink-0 ${
                  selectedSem === sem
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {sem}
              </button>
            ))}
          </div>

          {/* NEP-2020 Filter & Live Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={nepOnly}
                onChange={(e) => setNepOnly(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>NEP-2020 Only</span>
            </label>

            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-60">
              <input
                type="text"
                placeholder="Search subject or year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </form>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-slate-600">
          Showing {papers.length} of {totalCount} verified past question papers
        </span>
        {isPending && (
          <span className="text-xs text-blue-600 flex items-center gap-1 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Filtering archive...
          </span>
        )}
      </div>

      {/* Papers Grid */}
      {papers.length === 0 ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-2">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            No past papers found for this selection
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try switching semesters or toggling off "NEP-2020 Only" to browse C-Scheme papers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {papers.map((p, idx) => (
            <div
              key={`${p.slug}_${idx}`}
              className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 shadow-sm flex flex-col justify-between space-y-2.5 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-[5px] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {p.session} {p.year}
                  </span>
                  {p.isNep ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px] border border-emerald-200">
                      NEP-2020
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-[5px] border border-slate-200">
                      Rev-2019
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {p.subject}
                </h4>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={p.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-[5px] transition-colors"
                >
                  <Download className="w-3 h-3 text-slate-600" />
                  <span>Download PDF</span>
                </a>

                <Link
                  href={`/student/cram/new?branch=${selectedBranch}&sem=${selectedSem}&subject=${encodeURIComponent(p.subject)}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-[5px] transition-colors"
                  title="Generate KT Buster or Flashcards for this subject"
                >
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>Prep AI</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

