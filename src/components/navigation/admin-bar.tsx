"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Sparkles, BookOpen, GraduationCap } from "lucide-react";
import { isAdminEmail } from "@/lib/auth/admin";

interface AdminBarProps {
  userEmail: string;
}

export function AdminBar({ userEmail }: AdminBarProps) {
  const pathname = usePathname();
  const isAdmin = isAdminEmail(userEmail);

  if (!isAdmin) return null;

  const isTutorView = pathname.startsWith("/tutor");
  const isStudentView = pathname.startsWith("/student");
  const isAdminView = pathname.startsWith("/admin");

  return (
    <div className="w-full bg-[#1E293B] text-white px-4 py-2 border-b border-slate-700 text-xs flex flex-wrap items-center justify-between gap-3 z-50 print:hidden">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-blue-500/20 text-blue-400">
          <Shield className="w-3.5 h-3.5" />
        </div>
        <span className="font-semibold text-slate-200">Master Admin:</span>
        <span className="text-slate-400 font-mono">{userEmail}</span>
        <span className="text-slate-600">&bull;</span>
        <div className="flex items-center gap-1 text-emerald-400 font-medium">
          <Sparkles className="w-3 h-3" />
          <span>9,999 Credits &bull; Unlimited Pass</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-400">Active View:</span>
        <div className="flex items-center bg-slate-800 p-0.5 rounded-md border border-slate-700">
          <Link
            href="/admin"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              isAdminView
                ? "bg-[#2563EB] text-white"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Control</span>
          </Link>
          <Link
            href="/tutor"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              isTutorView
                ? "bg-[#2563EB] text-white"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Tutor Portal</span>
          </Link>
          <Link
            href="/student"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              isStudentView
                ? "bg-[#2563EB] text-white"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Student Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
