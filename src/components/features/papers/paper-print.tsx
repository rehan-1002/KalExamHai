"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import { MathText } from "@/components/ui/math-text";
import { DiagramRenderer } from "@/components/ui/diagram-renderer";
import type { PaperJson } from "@/lib/schemas/paper";

interface PaperRecord {
  id: string;
  format: "IAT" | "END_SEM";
  title: string;
  subject: string;
  course_code?: string;
  paper: PaperJson;
}

interface PaperPrintProps {
  paperRecord: PaperRecord;
}

export function PaperPrint({ paperRecord }: PaperPrintProps) {
  const pathname = usePathname();
  const isStudent = pathname?.startsWith("/student") ?? false;
  const backUrl = isStudent
    ? `/student/papers/${paperRecord.id}`
    : `/tutor/papers/${paperRecord.id}`;

  const paper = paperRecord.paper;

  // Resolve exact document name specified before paper creation
  const docName =
    paperRecord.title ||
    (paper.subject && paper.exam_title ? `${paper.subject} - ${paper.exam_title}` : null) ||
    paper.exam_title ||
    paper.subject ||
    "Question Paper";

  const safeFilename = docName.replace(/[\\/:*?"<>|]/g, "_").trim();

  // Set document.title so browser's "Save as PDF" defaults to the exact input name
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

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white text-slate-900">
      {/* Floating Action Bar - Hidden in print */}
      <div className="print:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Interactive Review
          </Link>

          <div className="flex items-center gap-3">
            <span
              className="text-xs font-semibold text-slate-700 hidden sm:inline-block max-w-xs truncate"
              title={docName}
            >
              📄 {docName}
            </span>
            <span className="text-xs text-slate-400 hidden md:inline">•</span>
            <span className="text-xs text-slate-500 hidden md:inline">
              A4 Format • 15mm Margins
            </span>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-[6px] hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="max-w-[210mm] mx-auto my-6 print:my-0 bg-white shadow-md print:shadow-none p-8 sm:p-12 print:p-0 min-h-[297mm]">
        {/* University Header */}
        <header className="text-center border-b-2 border-slate-900 pb-3 mb-4">
          <h1 className="text-xl font-serif font-black tracking-wider uppercase text-slate-900">
            {paper.institute_name || "UNIVERSITY OF MUMBAI"}
          </h1>
          <h2 className="text-sm font-serif font-bold uppercase tracking-wide text-slate-800 mt-1">
            {paper.exam_title || paperRecord.title || (paper.format === "IAT" ? "Internal Assessment Test" : "End Semester Examination")}
          </h2>

          <div className="mt-3 text-xs font-serif font-semibold text-slate-800 flex justify-between items-center border-t border-slate-300 pt-2">
            <div className="text-left">
              <span>Program: Bachelor of Technology / Engineering</span>
              <br />
              <span>
                Subject: <strong className="font-bold">{paper.subject || paperRecord.subject}</strong>
              </span>
              {(paper.course_code || paperRecord.course_code) && (
                <span> ({paper.course_code || paperRecord.course_code})</span>
              )}
            </div>
            <div className="text-right">
              <span>
                Time: <strong className="font-bold">{paper.duration_minutes} Minutes</strong>
              </span>
              <br />
              <span>
                Max. Marks: <strong className="font-bold">{paper.total_attemptable_marks}</strong>
              </span>
            </div>
          </div>
        </header>

        {/* Instructions */}
        <section className="mb-4 text-[11.5px] font-serif border-b border-slate-300 pb-3 leading-relaxed">
          <p className="font-bold uppercase tracking-wide mb-1 text-[11px]">N.B. (Instructions to Candidates):</p>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-800">
            {paper.general_instructions.map((inst, idx) => (
              <li key={idx}>{inst}</li>
            ))}
          </ol>
        </section>

        {/* Question Content */}
        <main className="space-y-4 font-serif">
          {paper.questions.map((q) => (
            <div key={q.no} className="border-b border-slate-200 pb-3 break-inside-avoid">
              {/* Question Banner */}
              <div className="flex items-baseline justify-between font-bold text-sm text-slate-900 mb-2">
                <span>
                  Q.{q.no}&nbsp;&nbsp;{q.title || `Question No. ${q.no}`}
                  <span className="font-normal text-xs ml-2 italic text-slate-700">
                    ({q.instructions})
                  </span>
                </span>
                <span className="text-xs font-bold shrink-0">
                  [{q.total_marks}]
                </span>
              </div>

              {/* Sub-questions */}
              <div className="space-y-2.5 pl-4">
                {q.sub_questions.map((sq) => (
                  <div key={sq.id} className="flex items-start justify-between gap-4 text-xs leading-relaxed">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="font-bold text-slate-800 shrink-0">({sq.label})</span>
                      <div className="text-slate-900 flex-1">
                        <MathText content={sq.text} />
                        {sq.diagram && sq.diagram.code && (
                          <div className="my-2">
                            <DiagramRenderer
                              code={sq.diagram.code}
                              type={sq.diagram.type}
                              caption={sq.diagram.caption}
                              allowCopy={false}
                            />
                          </div>
                        )}
                        {sq.repeat_badge && (
                          <div className="text-[10px] text-slate-500 font-sans mt-0.5 italic">
                            🔥 {sq.repeat_badge}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 shrink-0 text-right">
                      [{sq.marks}]
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </main>

        {/* Footer */}
        <footer className="mt-8 pt-4 text-center text-xs font-serif font-semibold border-t border-slate-300 text-slate-700">
          <p>----------------- ALL THE BEST -----------------</p>
          <p className="text-[10px] text-slate-500 font-sans mt-1 print:hidden">
            Generated via KalExamHai NEP-2020 Compliant Examination Engine
          </p>
        </footer>
      </div>

      {/* Global Print Media Query Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
