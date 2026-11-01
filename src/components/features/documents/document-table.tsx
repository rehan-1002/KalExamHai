"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2, RotateCw, FileText, Calendar, Layers, Sparkles, Loader2 } from "lucide-react";
import { StatusBadge, type DocStatus } from "./status-badge";
import { retryIngestionAction } from "@/app/tutor/documents/actions";

export interface DocumentItem {
  id: string;
  title: string;
  subject: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  page_count: number | null;
  status: DocStatus | string;
  error_message: string | null;
  created_at: string;
}

interface DocumentTableProps {
  documents: DocumentItem[];
  onRefresh?: () => void;
  onDeleted?: (id: string) => void;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function DocumentTable({ documents, onRefresh, onDeleted }: DocumentTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${title}"? Its vector embeddings will also be removed.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({ ok: false }));
      if (data.ok) {
        onDeleted?.(id);
      } else {
        alert(data.message || "Failed to delete document.");
      }
    } catch {
      alert("Network error while deleting document.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = (id: string) => {
    startTransition(async () => {
      await retryIngestionAction(id);
      onRefresh?.();
    });
  };

  if (documents.length === 0) {
    return (
      <div className="w-full bg-[#FFFFFF] rounded-xl border border-[#E7E5E0] p-10 text-center shadow-sm">
        <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[#1F2937]">No documents uploaded yet</h3>
        <p className="text-xs text-[#6B7280] max-w-sm mx-auto mt-1 leading-relaxed">
          Upload your semester notes, module PDFs, or paste syllabus units using the box above to generate question papers.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FFFFFF] rounded-xl border border-[#E7E5E0] overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-[#E7E5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#1F2937]">Knowledge Library ({documents.length})</h3>
          <p className="text-xs text-[#6B7280]">
            Embedded documents available for NEP-2020 question paper and cram suite generation.
          </p>
        </div>
        <Link
          href="/tutor/generate"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-[6px] shadow-xs transition-colors shrink-0 text-center justify-center"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate Question Paper</span>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F9F9F6] border-b border-[#E7E5E0] text-xs font-medium text-[#6B7280]">
            <tr>
              <th scope="col" className="px-6 py-3">Document Title</th>
              <th scope="col" className="px-4 py-3">Subject</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Pages / Size</th>
              <th scope="col" className="px-4 py-3">Uploaded</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E5E0]">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-[#F9F9F6]/50 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-[#1F2937] block truncate max-w-[260px] sm:max-w-[340px]">
                        {doc.title}
                      </span>
                      {doc.error_message && doc.status === "failed" && (
                        <span className="text-xs text-[#B42318] block truncate max-w-[260px]">
                          {doc.error_message}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3.5 text-xs text-[#4B5563]">
                  {doc.subject ? (
                    <span className="inline-block px-2 py-0.5 rounded-[5px] bg-[#F3F4F6] text-[#374151]">
                      {doc.subject}
                    </span>
                  ) : (
                    <span className="text-[#9CA3AF]">—</span>
                  )}
                </td>

                <td className="px-4 py-3.5">
                  <StatusBadge status={doc.status} errorMessage={doc.error_message} />
                </td>

                <td className="px-4 py-3.5 text-xs text-[#6B7280] tabular-nums">
                  <span>{doc.page_count ? `${doc.page_count} p.` : "1 p."}</span>
                  <span className="mx-1 text-[#D1D5DB]">•</span>
                  <span>{formatBytes(doc.size_bytes)}</span>
                </td>

                <td className="px-4 py-3.5 text-xs text-[#6B7280] tabular-nums whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#9CA3AF]" />
                    {formatDate(doc.created_at)}
                  </span>
                </td>

                <td className="px-6 py-3.5 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5">
                    {doc.status === "ready" && (
                      <Link
                        href={`/tutor/generate?docId=${doc.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-[6px] transition-colors"
                        title="Generate Question Paper with this document"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generate Paper</span>
                      </Link>
                    )}
                    {doc.status === "failed" && (
                      <button
                        type="button"
                        onClick={() => handleRetry(doc.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-md hover:bg-black/[0.04] text-[#2563EB] transition-colors cursor-pointer"
                        title="Retry Ingestion"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, doc.id, doc.title)}
                      disabled={isPending || deletingId === doc.id}
                      className="p-1.5 rounded-md hover:bg-red-50 text-[#6B7280] hover:text-[#B42318] transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete document"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

