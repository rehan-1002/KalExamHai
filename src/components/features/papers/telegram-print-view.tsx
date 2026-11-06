"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { MathText } from "@/components/ui/math-text";
import type { TelegramExport } from "@/server/telegram/session";

interface TelegramPrintViewProps {
  exportData: TelegramExport;
}

export function TelegramPrintView({ exportData }: TelegramPrintViewProps) {
  const safeFilename = `${exportData.subject} - ${exportData.title}`
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim();

  useEffect(() => {
    const originalTitle = document.title;
    document.title = safeFilename;
    return () => {
      document.title = originalTitle;
    };
  }, [safeFilename]);

  const handlePrint = () => {
    document.title = safeFilename;
    window.print();
  };

  const isExamPaper =
    exportData.type === "iat" || exportData.type === "paper60";

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white text-slate-900">
      {/* Floating Action Bar - Hidden in Print */}
      <div className="print:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>KalExamHai Home</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className="text-xs font-semibold text-slate-700 hidden sm:inline-block max-w-xs truncate"
              title={safeFilename}
            >
              📄 {exportData.subject} ({exportData.title})
            </span>
            <span className="text-xs text-slate-400 hidden md:inline">•</span>
            <span className="text-xs text-slate-500 hidden md:inline">
              A4 Format • Print Ready
            </span>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-[6px] hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-[6px] hover:bg-blue-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Open Full Workspace</span>
            </Link>
          </div>
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="max-w-[210mm] mx-auto my-6 print:my-0 bg-white shadow-md print:shadow-none p-8 sm:p-12 print:p-0 min-h-[297mm]">
        {/* Official Header */}
        <header className="text-center border-b-2 border-slate-900 pb-3 mb-5">
          <h1 className="text-xl sm:text-2xl font-serif font-black tracking-wider uppercase text-slate-900">
            UNIVERSITY OF MUMBAI
          </h1>
          <h2 className="text-sm sm:text-base font-serif font-bold uppercase tracking-wide text-slate-800 mt-1">
            {exportData.type === "iat"
              ? "Internal Assessment Test (IAT) — NEP-2020 Pattern"
              : exportData.type === "paper60"
              ? "End-Semester Examination — NEP-2020 Pattern"
              : exportData.title}
          </h2>

          <div className="mt-3 text-xs font-serif font-semibold text-slate-800 flex justify-between items-center border-t border-slate-300 pt-2">
            <div className="text-left">
              <span>Program: Bachelor of Technology / Engineering</span>
              <br />
              <span>
                Subject: <strong className="font-bold">{exportData.subject}</strong>
              </span>
            </div>
            <div className="text-right">
              {isExamPaper && (
                <>
                  <span>
                    Duration:{" "}
                    <strong className="font-bold">
                      {exportData.type === "iat" ? "1 Hour" : "2 Hours"}
                    </strong>
                  </span>
                  <br />
                  <span>
                    Max. Marks:{" "}
                    <strong className="font-bold">
                      {exportData.type === "iat" ? "20" : "60"}
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Body formatted with MathText */}
        <main className="space-y-4 font-serif text-slate-900 leading-relaxed text-sm">
          {exportData.content
            .split("\n\n")
            .filter((block) => block.trim().length > 0)
            .map((block, idx) => {
              const trimmed = block.trim();

              // Dividers
              if (trimmed.startsWith("━━━━") || trimmed.startsWith("────")) {
                return (
                  <hr
                    key={idx}
                    className="border-t border-slate-300 my-3 print:my-2"
                  />
                );
              }

              // Section / Question Header
              if (trimmed.startsWith("📌") || trimmed.startsWith("🏛️") || trimmed.startsWith("###")) {
                return (
                  <div
                    key={idx}
                    className="font-bold text-sm sm:text-base text-slate-900 mt-4 mb-2 bg-slate-50 print:bg-transparent p-2 print:p-0 border-l-2 border-slate-800 print:border-none"
                  >
                    <MathText content={trimmed} />
                  </div>
                );
              }

              // Sub-question line with marks badge
              if (trimmed.includes("└─")) {
                const parts = trimmed.split("└─");
                const questionPart = parts[0]?.trim() || "";
                const metaPart = parts[1]?.trim() || "";

                return (
                  <div key={idx} className="my-2.5 break-inside-avoid">
                    <div className="text-slate-900 font-normal">
                      <MathText content={questionPart} />
                    </div>
                    {metaPart && (
                      <div className="mt-1 text-xs text-slate-600 font-mono bg-slate-100 print:bg-transparent px-2 py-0.5 rounded inline-block border border-slate-200 print:border-none">
                        <MathText content={metaPart} />
                      </div>
                    )}
                  </div>
                );
              }

              // Normal text / paragraphs / bullet items
              return (
                <div key={idx} className="my-2">
                  <MathText content={trimmed} />
                </div>
              );
            })}
        </main>

        {/* Official Footer */}
        <footer className="mt-12 pt-4 border-t border-slate-300 text-center text-[11px] font-serif text-slate-500">
          Generated via KalExamHai AI • Strictly compliant with Mumbai University Examination Blueprint
        </footer>
      </div>
    </div>
  );
}

