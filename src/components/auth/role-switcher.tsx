"use client";

import React from "react";
import { GraduationCap, BookOpen } from "lucide-react";

export type UserRole = "student" | "tutor";

interface RoleSwitcherProps {
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export function RoleSwitcher({
  selectedRole,
  onRoleChange,
}: RoleSwitcherProps) {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Symmetrical Dual-Tab Switcher (No pills) */}
      <div className="w-full grid grid-cols-2 p-1 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB]">
        <button
          type="button"
          onClick={() => onRoleChange("student")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
            selectedRole === "student"
              ? "bg-white text-[#1F2937] shadow-sm border border-[#E5E7EB]"
              : "text-[#6B7280] hover:text-[#1F2937]"
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#2563EB]" />
          <span>Student</span>
        </button>

        <button
          type="button"
          onClick={() => onRoleChange("tutor")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
            selectedRole === "tutor"
              ? "bg-white text-[#1F2937] shadow-sm border border-[#E5E7EB]"
              : "text-[#6B7280] hover:text-[#1F2937]"
          }`}
        >
          <GraduationCap className="w-4 h-4 text-[#2563EB]" />
          <span>Faculty / Tutor</span>
        </button>
      </div>

      {/* Role Context Helper Banner */}
      <div className="w-full mt-3 p-3 rounded-lg bg-[#EFF6FF] border border-blue-100 text-xs text-[#1E40AF] text-center leading-relaxed">
        {selectedRole === "student" ? (
          <span>
            <strong>Student Portal:</strong> Access verified MU syllabus notes, 3D flashcards, and 24h exam cram kits.
          </span>
        ) : (
          <span>
            <strong>Faculty Portal:</strong> Generate NEP-2020 question papers with verified mark splits. <strong>Includes 2 free credits.</strong>
          </span>
        )}
      </div>
    </div>
  );
}
