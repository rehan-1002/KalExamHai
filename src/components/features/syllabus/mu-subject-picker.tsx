"use client";

import React, { useMemo } from "react";
import { BRANCHES, MU_CATALOG_SUBJECTS, type MuCatalogSubject } from "@/data/mu-syllabus";
import { GraduationCap, CheckCircle2, BookOpen, Sparkles } from "lucide-react";

export interface MuSubjectPickerProps {
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  selectedSemester: number;
  onSelectSemester: (sem: number) => void;
  selectedSubjectCode: string;
  onSelectSubject: (subject: MuCatalogSubject) => void;
  disabled?: boolean;
}

export function MuSubjectPicker({
  selectedBranchId,
  onSelectBranch,
  selectedSemester,
  onSelectSemester,
  selectedSubjectCode,
  onSelectSubject,
  disabled = false,
}: MuSubjectPickerProps) {
  // Current active branch info
  const activeBranch = useMemo(() => {
    return BRANCHES.find((b) => b.id === selectedBranchId) || BRANCHES[0]!;
  }, [selectedBranchId]);

  // Available subjects for the chosen branch & semester
  const availableSubjects = useMemo(() => {
    return MU_CATALOG_SUBJECTS.filter(
      (s) => s.branchId === selectedBranchId && s.semester === selectedSemester
    );
  }, [selectedBranchId, selectedSemester]);

  // Selected subject object
  const currentSubject = useMemo(() => {
    return availableSubjects.find((s) => s.code === selectedSubjectCode) || availableSubjects[0];
  }, [availableSubjects, selectedSubjectCode]);

  const handleBranchChange = (branchId: string) => {
    onSelectBranch(branchId);
    const branch = BRANCHES.find((b) => b.id === branchId);
    const firstSem = branch?.semesters[0] || 1;
    onSelectSemester(firstSem);
    const nextSubjects = MU_CATALOG_SUBJECTS.filter(
      (s) => s.branchId === branchId && s.semester === firstSem
    );
    if (nextSubjects.length > 0 && nextSubjects[0]) {
      onSelectSubject(nextSubjects[0]);
    }
  };

  const handleSemesterChange = (sem: number) => {
    onSelectSemester(sem);
    const nextSubjects = MU_CATALOG_SUBJECTS.filter(
      (s) => s.branchId === selectedBranchId && s.semester === sem
    );
    if (nextSubjects.length > 0 && nextSubjects[0]) {
      onSelectSubject(nextSubjects[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Branch Selector */}
      <div>
        <label className="block text-xs font-semibold text-[#374151] mb-2 flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-[#2563EB]" />
          Select Engineering Branch
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BRANCHES.map((branch) => {
            const isSelected = branch.id === selectedBranchId;
            return (
              <button
                key={branch.id}
                type="button"
                disabled={disabled}
                onClick={() => handleBranchChange(branch.id)}
                className={`flex items-center gap-2 p-2.5 rounded-[8px] border text-left transition-all ${
                  isSelected
                    ? "border-[#2563EB] bg-[#EFF6FF] text-[#1E40AF] font-semibold shadow-xs"
                    : "border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#93C5FD] hover:bg-slate-50"
                } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className="text-base select-none">{branch.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs truncate">{branch.shortName}</div>
                  <div className="text-[10px] text-[#6B7280] truncate font-normal">
                    {branch.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Semester Selector */}
      <div>
        <label className="block text-xs font-semibold text-[#374151] mb-2 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
          Select Semester
        </label>
        <div className="flex gap-2">
          {activeBranch.semesters.map((sem) => {
            const isSelected = sem === selectedSemester;
            return (
              <button
                key={sem}
                type="button"
                disabled={disabled}
                onClick={() => handleSemesterChange(sem)}
                className={`px-4 py-2 rounded-[8px] text-xs font-medium border transition-all ${
                  isSelected
                    ? "border-[#2563EB] bg-[#2563EB] text-white shadow-xs"
                    : "border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#93C5FD] hover:bg-slate-50"
                } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                Semester {sem}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Subject Dropdown / Selector */}
      <div>
        <label className="block text-xs font-semibold text-[#374151] mb-2">
          Select Official MU Subject ({availableSubjects.length} Available)
        </label>
        {availableSubjects.length === 0 ? (
          <div className="p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-[8px]">
            No subjects found for Semester {selectedSemester} in {activeBranch.name}.
          </div>
        ) : (
          <div className="relative">
            <select
              value={currentSubject?.code || ""}
              disabled={disabled}
              onChange={(e) => {
                const found = availableSubjects.find((s) => s.code === e.target.value);
                if (found) onSelectSubject(found);
              }}
              className="w-full h-11 px-3.5 pr-8 rounded-[8px] border border-[#D1D5DB] bg-white text-sm font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all cursor-pointer"
            >
              {availableSubjects.map((subj) => (
                <option key={subj.code} value={subj.code}>
                  [{subj.code}] {subj.name} ({subj.shortName}) — {subj.endSemMarks}M End-Sem
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. Official Syllabus Badge / Feature Callout */}
      {currentSubject && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-[8px] p-3.5 text-xs text-blue-950 space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-semibold flex items-center gap-1.5 text-blue-900">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              {currentSubject.name} ({currentSubject.shortName})
            </span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded-[6px]">
                {currentSubject.scheme}
              </span>
              <span className="bg-purple-100 text-purple-800 font-medium px-2 py-0.5 rounded-[6px]">
                Code: {currentSubject.code}
              </span>
              <span className="bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-[6px]">
                {currentSubject.endSemMarks} Marks End-Sem
              </span>
            </div>
          </div>
          <p className="text-[11px] text-blue-800/90 leading-relaxed">
            ⚡ <strong>Zero Upload Needed:</strong> Official 6-module syllabus and 1,674+ scraped Mumbai University past papers pre-indexed. Repeats, numerical weightages, and 85%+ probability questions are auto-calculated.
          </p>
        </div>
      )}
    </div>
  );
}

