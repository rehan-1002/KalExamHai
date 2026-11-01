"use client";

import React, { useState, useTransition } from "react";
import { UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";
import { IllosUploadDropzone } from "@/components/vendor/upload-dropzone";

interface DocumentUploadProps {
  onIngestionComplete?: () => void;
}

export function DocumentUploadDropzone({ onIngestionComplete }: DocumentUploadProps) {
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [pastedText, setPastedText] = useState("");

  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    title: string;
    chunks?: number;
    pages?: number;
  } | null>(null);

  // Handle files selected from the Illos dropzone
  const handleFiles = (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessInfo(null);
    setStatusMessage("Uploading and generating vector embeddings with Gemini text-embedding-004...");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subject", subject);
        formData.append("title", title || file.name.replace(/\.[^/.]+$/, ""));

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        const responseText = await response.text();
        let result: {
          ok: boolean;
          data?: { documentId: string; chunkCount?: number; pageCount?: number };
          message?: string;
        };

        try {
          result = JSON.parse(responseText);
        } catch {
          setStatusMessage(null);
          setErrorMessage(
            `Server error (${response.status}): ${
              responseText.slice(0, 180) || "Server did not return a response"
            }`
          );
          return;
        }

        if (result.ok && result.data) {
          setStatusMessage(null);
          setSuccessInfo({
            title: title || file.name,
            chunks: result.data.chunkCount,
            pages: result.data.pageCount,
          });
          setTitle("");
          onIngestionComplete?.();
        } else {
          setStatusMessage(null);
          setErrorMessage(result.message || "Upload failed.");
        }
      } catch (err: unknown) {
        setStatusMessage(null);
        setErrorMessage(err instanceof Error ? err.message : "Upload failed unexpectedly.");
      }
    });
  };

  // Handle paste submission
  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim() || !title.trim()) {
      setErrorMessage("Please enter both a title and notes text.");
      return;
    }

    setErrorMessage(null);
    setSuccessInfo(null);
    setStatusMessage("Processing syllabus notes and generating vector embeddings...");

    startTransition(async () => {
      try {
        const response = await fetch("/api/documents/paste", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content: pastedText, subject }),
        });

        // Paste route also runs pipeline inline — handle timeout gracefully
        let result: { ok: boolean; data?: { documentId?: string; chunkCount?: number; pageCount?: number }; message?: string } | null = null;
        try {
          result = await response.json();
        } catch {
          // Response body empty — Vercel timeout
          setStatusMessage(null);
          setErrorMessage("Processing is taking longer than expected. Please try pasting a shorter text, or wait a moment and refresh.");
          return;
        }

        if (result?.ok) {
          setStatusMessage(null);
          setSuccessInfo({
            title,
            chunks: result.data?.chunkCount,
            pages: result.data?.pageCount,
          });
          setTitle("");
          setPastedText("");
          onIngestionComplete?.();
        } else {
          setStatusMessage(null);
          setErrorMessage(result?.message || "Failed to process pasted notes.");
        }
      } catch (err: unknown) {
        setStatusMessage(null);
        setErrorMessage(err instanceof Error ? err.message : "Processing failed.");
      }
    });
  };

  return (
    <div className="w-full bg-[#FFFFFF] rounded-xl border border-[#E7E5E0] p-6 shadow-sm">
      {/* Top Controls: Mode Switcher (Rectangular tabs, strictly NO pills) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E7E5E0]">
        <div>
          <h2 className="text-lg font-semibold text-[#1F2937]">Ingest Syllabus &amp; Lecture Notes</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Embed notes into pgvector. Used exclusively to ground exam papers and viva questions with zero AI drift.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-md border border-[#E7E5E0] bg-[#F9F9F6] p-0.5">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-medium transition-colors cursor-pointer ${
              mode === "file"
                ? "bg-[#FFFFFF] text-[#2563EB] shadow-xs font-semibold"
                : "text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-medium transition-colors cursor-pointer ${
              mode === "paste"
                ? "bg-[#FFFFFF] text-[#2563EB] shadow-xs font-semibold"
                : "text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Notes</span>
          </button>
        </div>
      </div>

      {/* Metadata Inputs (Optional Subject & Title) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div>
          <label className="block text-xs font-medium text-[#4B5563] mb-1">
            Subject / Course Name (Optional)
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Applied Mathematics IV, Data Structures"
            disabled={isPending}
            className="w-full h-9 px-3 rounded-md border border-[#E7E5E0] bg-[#FFFFFF] text-sm text-[#1F2937] placeholder-[#9CA3AF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#4B5563] mb-1">
            Custom Document Title {mode === "paste" && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={mode === "file" ? "Leave blank to use original filename" : "e.g. Unit 3 Trees & Graphs"}
            disabled={isPending}
            className="w-full h-9 px-3 rounded-md border border-[#E7E5E0] bg-[#FFFFFF] text-sm text-[#1F2937] placeholder-[#9CA3AF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          />
        </div>
      </div>

      {/* Active Mode Form */}
      <div className="mt-5">
        {mode === "file" ? (
          <div>
            {/* Vendor Isometric Illos Upload Dropzone */}
            <IllosUploadDropzone
              title="Drop Mumbai University notes or syllabus here"
              description="PDF, TXT, or Markdown files up to 25 MB. Text extraction and vector chunking happen automatically."
              buttonLabel={isPending ? "Processing..." : "Browse files"}
              accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              multiple={false}
              onFiles={handleFiles}
            />
          </div>
        ) : (
          <form onSubmit={handlePasteSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">
                Lecture Notes or Syllabus Content (Markdown / Plain Text)
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste module formulas, derivations, syllabus outlines, or lecture transcripts here..."
                rows={8}
                disabled={isPending}
                required
                className="w-full p-3 rounded-md border border-[#E7E5E0] bg-[#FFFFFF] text-sm text-[#1F2937] placeholder-[#9CA3AF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] font-sans"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending || !pastedText.trim() || !title.trim()}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#2563EB] px-5 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Notes...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Process &amp; Ingest Notes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Status Progress Display */}
      {isPending && statusMessage && (
        <div className="mt-4 p-3.5 rounded-md bg-[#EFF6FF] border border-blue-200 text-xs text-[#1E40AF] flex items-center gap-2.5">
          <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Error Message Box */}
      {errorMessage && (
        <div className="mt-4 p-3.5 rounded-md bg-[#FEF3F2] border border-red-200 text-xs text-[#B42318] flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Ingestion Failed: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Success Notification Box */}
      {successInfo && (
        <div className="mt-4 p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>{successInfo.title}</strong> processed successfully! Created{" "}
              <strong>{successInfo.chunks || 1} semantic chunks</strong> across{" "}
              <strong>{successInfo.pages || 1} page(s)</strong>.
            </span>
          </div>
          <span className="font-semibold text-emerald-700">Ready for RAG</span>
        </div>
      )}
    </div>
  );
}

