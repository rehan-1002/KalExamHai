"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Printer,
  RotateCw,
  Edit2,
  Check,
  X,
  Copy,
  Sparkles,
  BookOpen,
  Info,
  Clock,
  Award,
} from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { MathText } from "@/components/ui/math-text";
import { regenerateSubQuestionAction, updateSubQuestionTextAction } from "@/app/tutor/papers/[id]/actions";
import type { PaperJson, SubQuestion } from "@/lib/schemas/paper";

interface PaperRecord {
  id: string;
  format: "IAT" | "END_SEM";
  title: string;
  subject: string;
  course_code?: string;
  model: string;
  credits_charged: number;
  validation_attempts: number;
  created_at: string;
  paper: PaperJson;
}

interface PaperViewProps {
  paperRecord: PaperRecord;
}

export function PaperView({ paperRecord }: PaperViewProps) {
  const pathname = usePathname();
  const isStudent = pathname?.startsWith("/student") ?? false;
  const papersUrl = isStudent ? "/student/papers" : "/tutor/papers";
  const printUrl = isStudent
    ? `/student/papers/${paperRecord.id}/print`
    : `/tutor/papers/${paperRecord.id}/print`;

  const [paper, setPaper] = useState<PaperJson>(paperRecord.paper);
  const [editingSubQId, setEditingSubQId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [rerollingSubQId, setRerollingSubQId] = useState<string | null>(null);
  const [savingSubQId, setSavingSubQId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Copy full paper text
  const handleCopyPaper = async () => {
    try {
      let fullText = `${paper.institute_name || "UNIVERSITY OF MUMBAI"}\n`;
      fullText += `${paper.exam_title} | ${paper.subject} (${paper.course_code || ""})\n`;
      fullText += `Duration: ${paper.duration_minutes} Mins | Max Marks: ${paper.total_attemptable_marks}\n\n`;
      fullText += `General Instructions:\n${paper.general_instructions.map((inst, i) => `${i + 1}. ${inst}`).join("\n")}\n\n`;

      paper.questions.forEach((q) => {
        fullText += `\nQuestion ${q.no} [${q.compulsory ? "Compulsory" : `Attempt any ${q.attempt_count} of ${q.out_of}`}] - [${q.total_marks} Marks]\n`;
        q.sub_questions.forEach((sq) => {
          fullText += `  (${sq.label}) ${sq.text} [${sq.marks}M]\n`;
        });
      });

      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setFeedbackMessage({ type: "error", text: "Failed to copy text to clipboard." });
    }
  };

  // Start inline editing
  const handleStartEdit = (subQ: SubQuestion) => {
    setEditingSubQId(subQ.id);
    setEditText(subQ.text);
    setFeedbackMessage(null);
  };

  // Cancel inline editing
  const handleCancelEdit = () => {
    setEditingSubQId(null);
    setEditText("");
  };

  // Save inline edit
  const handleSaveEdit = async (questionNo: number, subQId: string) => {
    if (!editText.trim()) return;
    setSavingSubQId(subQId);
    setFeedbackMessage(null);

    try {
      const res = await updateSubQuestionTextAction(paperRecord.id, questionNo, subQId, editText.trim());
      if (res.ok && res.updatedPaper) {
        setPaper(res.updatedPaper);
        setEditingSubQId(null);
        setFeedbackMessage({ type: "success", text: "Sub-question wording updated successfully." });
      } else {
        setFeedbackMessage({ type: "error", text: res.error || "Failed to update sub-question text." });
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error while updating question." });
    } finally {
      setSavingSubQId(null);
    }
  };

  // Re-roll single sub-question
  const handleRerollSubQuestion = async (questionNo: number, subQId: string) => {
    setRerollingSubQId(subQId);
    setFeedbackMessage(null);

    try {
      const res = await regenerateSubQuestionAction(paperRecord.id, questionNo, subQId);
      if (res.ok && res.updatedPaper) {
        setPaper(res.updatedPaper);
        setFeedbackMessage({ type: "success", text: "Sub-question re-rolled successfully from course syllabus." });
      } else {
        setFeedbackMessage({ type: "error", text: res.error || "Failed to re-roll sub-question." });
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error during question regeneration." });
    } finally {
      setRerollingSubQId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="mb-2">
            <BackButton fallbackUrl={papersUrl} label="Back to Papers" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{paper.subject}</h1>
            <span className="text-xs px-2.5 py-0.5 font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200 rounded-[6px]">
              {paper.format === "IAT" ? "IAT 20 Marks" : "End-Sem 60 Marks"}
            </span>
            {paper.course_code && (
              <span className="text-xs px-2.5 py-0.5 font-mono text-slate-600 bg-slate-100 border border-slate-200 rounded-[6px]">
                {paper.course_code}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">{paper.exam_title}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleCopyPaper}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-[6px] hover:bg-slate-50 shadow-sm transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Text"}
          </button>
          <Link
            href={printUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-[6px] hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Export A4 PDF
          </Link>
        </div>
      </div>

      {/* Notification Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 text-sm rounded-[6px] border flex items-center justify-between ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Meta Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-[6px] shadow-sm flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Duration</div>
            <div className="text-sm font-bold text-slate-900">{paper.duration_minutes} Minutes</div>
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-[6px] shadow-sm flex items-center gap-3">
          <Award className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Max Marks</div>
            <div className="text-sm font-bold text-slate-900">{paper.total_attemptable_marks} Marks</div>
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-[6px] shadow-sm flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Authored Marks</div>
            <div className="text-sm font-bold text-slate-900">{paper.total_authored_marks} Total (with choice)</div>
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-[6px] shadow-sm flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Engine</div>
            <div className="text-sm font-bold text-slate-900 truncate">NEP-2020 Verified</div>
          </div>
        </div>
      </div>

      {/* General Instructions Box */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-[6px]">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Info className="w-4 h-4 text-blue-600" />
          Instructions to Candidates
        </div>
        <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 leading-relaxed">
          {paper.general_instructions.map((instruction, idx) => (
            <li key={idx}>{instruction}</li>
          ))}
        </ul>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {paper.questions.map((q) => (
          <div key={q.no} className="bg-white border border-slate-200 rounded-[6px] shadow-sm overflow-hidden">
            {/* Question Header */}
            <div className="p-4 bg-slate-50/75 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 flex items-center justify-center font-bold text-sm bg-blue-600 text-white rounded-[6px]">
                  Q{q.no}
                </span>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">
                    {q.title || `Question No. ${q.no}`}
                  </h3>
                  <p className="text-xs text-slate-500">{q.instructions}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-[6px] border ${
                    q.compulsory
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {q.compulsory ? "Compulsory" : `Attempt ${q.attempt_count} of ${q.out_of}`}
                </span>
                <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-[6px]">
                  {q.total_marks} Marks
                </span>
              </div>
            </div>

            {/* Sub-Questions */}
            <div className="divide-y divide-slate-100">
              {q.sub_questions.map((sq) => {
                const isEditing = editingSubQId === sq.id;
                const isRerolling = rerollingSubQId === sq.id;
                const isSaving = savingSubQId === sq.id;

                return (
                  <div key={sq.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Label */}
                      <span className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-700 rounded-[6px] shrink-0 mt-0.5">
                        {sq.label}
                      </span>

                      {/* Middle: Content or Edit Form */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2.5">
                            <textarea
                              rows={3}
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full text-xs font-mono p-2.5 border border-blue-400 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Enter sub-question text with LaTeX ($...$)"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleSaveEdit(q.no, sq.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-[6px] hover:bg-blue-700 disabled:opacity-50"
                              >
                                {isSaving ? <RotateCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Save Text
                              </button>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={handleCancelEdit}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-[6px] hover:bg-slate-200"
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-slate-800 leading-relaxed font-normal">
                              <MathText content={sq.text} />
                            </div>

                            {/* Metadata Badges */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {sq.unit_label && (
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-[6px]">
                                  {sq.unit_label}
                                </span>
                              )}
                              {sq.bloom_level && (
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-[6px]">
                                  {sq.bloom_level}
                                </span>
                              )}
                              {sq.source_chunk_ids && sq.source_chunk_ids.length > 0 && (
                                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-[6px]">
                                  Cited: {sq.source_chunk_ids.join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Marks & Interactive Actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-[6px] border border-slate-200">
                          {sq.marks} Marks
                        </span>

                        {!isEditing && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(sq)}
                              title="Edit question text"
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-[6px] transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isRerolling}
                              onClick={() => handleRerollSubQuestion(q.no, sq.id)}
                              title="Re-roll this sub-question (Free from course syllabus)"
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-[6px] hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                              <RotateCw className={`w-3 h-3 ${isRerolling ? "animate-spin text-blue-600" : ""}`} />
                              {isRerolling ? "Re-rolling..." : "Re-roll"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
