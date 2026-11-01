"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Printer,
  Trash2,
  ExternalLink,
  Award,
  Calendar,
  Sparkles,
  Search,
  BookOpen,
} from "lucide-react";
import { deletePaperAction } from "@/app/tutor/papers/[id]/actions";

interface PaperListItem {
  id: string;
  format: "IAT" | "END_SEM";
  title: string;
  subject: string;
  course_code?: string;
  created_at: string;
  credits_charged: number;
  total_attemptable_marks: number;
}

interface PaperHistoryTableProps {
  initialPapers: PaperListItem[];
}

export function PaperHistoryTable({ initialPapers }: PaperHistoryTableProps) {
  const [papers, setPapers] = useState<PaperListItem[]>(initialPapers);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = papers.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.subject?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.course_code?.toLowerCase().includes(q) ||
      p.format.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (paperId: string) => {
    if (!confirm("Are you sure you want to delete this question paper? This action cannot be undone.")) {
      return;
    }

    setDeletingId(paperId);
    try {
      const res = await deletePaperAction(paperId);
      if (res.ok) {
        setPapers((prev) => prev.filter((p) => p.id !== paperId));
      } else {
        alert(res.error || "Failed to delete paper.");
      }
    } catch {
      alert("Network error while deleting paper.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, code, or format..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>

        <Link
          href="/tutor/generate"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-[6px] hover:bg-blue-700 shadow-sm transition-colors text-center justify-center"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate New Paper
        </Link>
      </div>

      {/* Papers Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white border border-slate-200 rounded-[6px] shadow-sm">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No question papers found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {search
              ? "No papers match your search criteria. Try a different search term."
              : "You haven't generated any question papers yet. Upload syllabus notes and generate your first exam paper."}
          </p>
          {!search && (
            <Link
              href="/tutor/generate"
              className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-[6px] hover:bg-blue-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Question Paper
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[6px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Subject & Details</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Marks</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-sm">{paper.subject}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                        {paper.course_code && (
                          <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded-[4px] border border-slate-200">
                            {paper.course_code}
                          </span>
                        )}
                        <span>{paper.title}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-[6px] border ${
                          paper.format === "IAT"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}
                      >
                        {paper.format === "IAT" ? "IAT (20 Marks)" : "End-Sem (60 Marks)"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {paper.total_attemptable_marks} M
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {paper.credits_charged} CR
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(paper.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/tutor/papers/${paper.id}`}
                          title="Interactive Review & Re-roll"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-[6px] transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/tutor/papers/${paper.id}/print`}
                          target="_blank"
                          title="Print / Export A4 PDF"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-[6px] transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === paper.id}
                          onClick={() => handleDelete(paper.id)}
                          title="Delete Paper"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-[6px] transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
