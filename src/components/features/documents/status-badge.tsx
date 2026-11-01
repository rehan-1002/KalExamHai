"use client";

import React from "react";
import { Loader2, CheckCircle2, AlertCircle, FileText, Cpu } from "lucide-react";

export type DocStatus = "uploaded" | "extracting" | "embedding" | "ready" | "failed";

interface StatusBadgeProps {
  status: DocStatus | string;
  errorMessage?: string | null;
}

/**
 * Status badge for document ingestion stages.
 * STRICT DESIGN MANDATE: Rectangular geometry (rounded-[6px]), NO PILLS (no rounded-full).
 */
export function StatusBadge({ status, errorMessage }: StatusBadgeProps) {
  switch (status) {
    case "uploaded":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-medium bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]"
          title="File uploaded to secure storage, waiting for extraction."
        >
          <FileText className="w-3 h-3 text-[#6B7280]" />
          <span>Uploaded</span>
        </span>
      );

    case "extracting":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
          title="Extracting syllabus and text content..."
        >
          <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
          <span>Extracting Text</span>
        </span>
      );

    case "embedding":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-medium bg-[#EFF6FF] text-[#1E40AF] border border-blue-200"
          title="Generating 768-dim vector embeddings with Gemini text-embedding-004..."
        >
          <Cpu className="w-3 h-3 text-[#2563EB] animate-pulse" />
          <span>Embedding Vectors</span>
        </span>
      );

    case "ready":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
          title="Ready for RAG paper & material generation."
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Ready</span>
        </span>
      );

    case "failed":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-medium bg-[#FEF3F2] text-[#B42318] border border-red-200"
          title={errorMessage || "Document processing failed"}
        >
          <AlertCircle className="w-3 h-3 text-[#B42318]" />
          <span>Failed</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-medium bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
          {status}
        </span>
      );
  }
}

