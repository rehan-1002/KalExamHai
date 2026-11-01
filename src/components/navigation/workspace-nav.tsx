"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Sparkles,
  FileText,
  Zap,
  BookOpen,
  PlusCircle,
  GraduationCap,
  LogOut,
  ArrowRightLeft,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";

interface QuotaInfo {
  isUnlimited: boolean;
  remainingToday: number;
  totalDailyLimit: number;
  resetsAtFormatted: string;
}

interface WorkspaceNavProps {
  userEmail: string;
  creditBalance: number;
  mode: "tutor" | "student";
  isAdmin?: boolean;
  quota?: QuotaInfo;
}

export function WorkspaceNav({
  userEmail,
  creditBalance,
  mode,
  isAdmin = false,
  quota,
}: WorkspaceNavProps) {
  const pathname = usePathname();

  // If we are on the paper print view, hide the navbar for clean printing
  if (pathname.includes("/print")) {
    return null;
  }

  const tutorTabs = [
    { label: "Dashboard", href: "/tutor", icon: LayoutDashboard, exact: true },
    { label: "Knowledge Library", href: "/tutor/documents", icon: Library, exact: false },
    { label: "Generate Paper", href: "/tutor/generate", icon: Sparkles, exact: false },
    { label: "My Papers", href: "/tutor/papers", icon: FileText, exact: false },
  ];

  const studentTabs = [
    { label: "Cram Hub", href: "/student", icon: Zap, exact: true },
    { label: "My Notes", href: "/student/library", icon: BookOpen, exact: false },
    { label: "New Cram Session", href: "/student/cram/new", icon: PlusCircle, exact: false },
    { label: "Practice Papers", href: "/tutor/papers", icon: FileText, exact: false },
  ];

  const tabs = mode === "tutor" ? tutorTabs : studentTabs;

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs print:hidden">
      {/* Upper Bar: Brand, Switcher, Credits & Account */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand Logo + Workspace Pill */}
        <div className="flex items-center gap-3">
          <Link href={mode === "tutor" ? "/tutor" : "/student"} className="flex items-center gap-2">
            <Image
              src="/keh-logo.svg"
              alt="KalExamHai Logo"
              width={34}
              height={16}
              className="w-auto h-5 object-contain"
              priority
            />
          </Link>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-[6px] border ${
              mode === "tutor"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {mode === "tutor" ? "Faculty Workspace" : "Student Cram Suite"}
          </span>
        </div>

        {/* Right: Mode Switcher (Admin only), Credits & Sign Out */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Workspace Switcher — Strictly visible to Admins only */}
          {isAdmin && (
            <Link
              href={mode === "tutor" ? "/student" : "/tutor"}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[6px] text-slate-700 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              title={mode === "tutor" ? "Switch to Student Cramming Suite" : "Switch to Faculty Paper Generator"}
            >
              <ArrowRightLeft className="w-3 h-3 text-slate-500" />
              <span>{mode === "tutor" ? "Student Mode" : "Faculty Mode"}</span>
            </Link>
          )}

          {/* Daily Quota / Credits Counter Badge */}
          {quota?.isUnlimited || isAdmin ? (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700"
              title="Admin Account — Unlimited Generations"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Unlimited (Admin)</span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-blue-50/90 border border-blue-200 text-xs font-bold text-blue-700"
              title={`Free Launch Quota: Resets every night at ${quota?.resetsAtFormatted || "12:00 AM IST"}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {quota ? `${quota.remainingToday}/${quota.totalDailyLimit}` : `${creditBalance}`} Free Left Today
              </span>
            </div>
          )}

          {/* User Account / Sign Out */}
          <div className="flex items-center gap-2 text-xs text-slate-600 pl-1 border-l border-slate-200">
            <span className="hidden lg:inline-block max-w-[130px] truncate font-medium text-slate-800" title={userEmail}>
              {userEmail}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                title="Sign out of KalExamHai"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-medium text-[11px]">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Lower Bar: Navigation Tabs */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none" aria-label="Workspace Navigation">
            {tabs.map((tab) => {
              const isActive = tab.exact
                ? pathname === tab.href
                : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Switch for mobile screens — Admin only */}
          {isAdmin && (
            <div className="md:hidden py-1">
              <Link
                href={mode === "tutor" ? "/student" : "/tutor"}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline whitespace-nowrap"
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>{mode === "tutor" ? "Student Mode" : "Faculty Mode"}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

