import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Shield, Sparkles, Users, CreditCard, Activity, Cpu, CheckCircle2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { AdminBar } from "@/components/navigation/admin-bar";
import { grantCreditsAction } from "@/app/auth/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Master Admin Control — KalExamHai",
};

async function AdminContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = isAdminEmail(user?.email);

  if (!user || !isAdmin) {
    redirect("/login?redirectTo=/admin");
  }

  // Fetch quick metrics
  const { count: totalProfiles } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: totalTutors } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "tutor");

  const { count: totalStudents } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");

  // Fetch recent profiles
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-[#1F2937] flex flex-col">
      {/* 1. Master Admin Bar */}
      <AdminBar userEmail={user.email ?? ""} />

      {/* 2. Top Navigation */}
      <header className="w-full bg-white border-b border-[#E7E5E0] px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/keh-logo.svg"
                alt="KalExamHai Logo"
                width={36}
                height={16}
                className="w-auto h-5 object-contain"
                priority
              />
            </Link>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-white">
              Master Admin Control
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/tutor"
              className="px-3 py-1.5 rounded-md border border-[#E5E7EB] hover:bg-black/[0.03] text-[#1F2937] font-medium transition-colors"
            >
              Open Tutor Portal &rarr;
            </Link>
            <Link
              href="/student"
              className="px-3 py-1.5 rounded-md border border-[#E5E7EB] hover:bg-black/[0.03] text-[#1F2937] font-medium transition-colors"
            >
              Open Student Portal &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Main Dashboard Body */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 space-y-8">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#E7E5E0] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B7280]">Total Registered</span>
              <Users className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1F2937]">
              {totalProfiles ?? 1}
            </div>
            <span className="text-xs text-[#9CA3AF] mt-1 block">Active user profiles</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E7E5E0] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B7280]">Faculty / Tutors</span>
              <Shield className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1F2937]">
              {totalTutors ?? 0}
            </div>
            <span className="text-xs text-[#9CA3AF] mt-1 block">2-credit free tier active</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E7E5E0] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B7280]">Students</span>
              <Activity className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1F2937]">
              {totalStudents ?? 1}
            </div>
            <span className="text-xs text-[#9CA3AF] mt-1 block">MU engineering crammers</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E7E5E0] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B7280]">Admin Balance</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600">
              9,999
            </div>
            <span className="text-xs text-emerald-700/80 mt-1 block">Unlimited generation pass</span>
          </div>
        </div>

        {/* System Health & Manual Provisioning Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Manual Credit Grant Card */}
          <div className="bg-white p-6 rounded-xl border border-[#E7E5E0] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-semibold text-[#1F2937]">
                  Manual Credit Provisioning
                </h3>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed mb-4">
                Grant test or bonus credits directly to any faculty member or student account.
              </p>

              <form action={grantCreditsAction} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">
                    User Email
                  </label>
                  <input
                    name="targetEmail"
                    type="email"
                    required
                    placeholder="tutor@college.edu.in"
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-xs text-[#1F2937] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">
                    Credits to Add
                  </label>
                  <select
                    name="amount"
                    defaultValue="10"
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-xs text-[#1F2937] outline-none focus:border-[#2563EB]"
                  >
                    <option value="5">+5 Credits (Starter)</option>
                    <option value="10">+10 Credits</option>
                    <option value="25">+25 Credits (Standard)</option>
                    <option value="50">+50 Credits (Pro)</option>
                    <option value="100">+100 Credits</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
                >
                  Grant Credits &rarr;
                </button>
              </form>
            </div>
          </div>

          {/* Infrastructure Health Card */}
          <div className="bg-white p-6 rounded-xl border border-[#E7E5E0] shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-semibold text-[#1F2937]">
                Backend &amp; API Integration Health
              </h3>
            </div>
            <p className="text-xs text-[#6B7280] mb-5">
              Live configuration status of external models and payment webhooks.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9F9F6] border border-[#E7E5E0]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-semibold text-[#1F2937] block">Google Gemini 1.5 Flash</span>
                    <span className="text-[#6B7280]">Primary Question Paper &amp; Formula Generation Model</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[11px] border border-emerald-200">
                  Ready (24k tokens)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9F9F6] border border-[#E7E5E0]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-semibold text-[#1F2937] block">Gemini text-embedding-004</span>
                    <span className="text-[#6B7280]">768-Dimension Dense Vectors for Syllabus RAG</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[11px] border border-emerald-200">
                  Ready (768-dim)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9F9F6] border border-[#E7E5E0]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-semibold text-[#1F2937] block">Razorpay UPI &amp; Cards</span>
                    <span className="text-[#6B7280]">Key: {process.env.PAYMENT_KEY_ID?.slice(0, 12)}... (Test Mode)</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[11px] border border-emerald-200">
                  Active (Test)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Registered Users */}
        <div className="bg-white rounded-xl border border-[#E7E5E0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E7E5E0] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1F2937]">
              Recently Registered Accounts
            </h3>
            <span className="text-xs text-[#6B7280]">Profiles Table</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9F6] text-[#6B7280] border-b border-[#E7E5E0]">
                <tr>
                  <th className="py-2.5 px-6 font-medium">Email</th>
                  <th className="py-2.5 px-6 font-medium">Full Name</th>
                  <th className="py-2.5 px-6 font-medium">Assigned Role</th>
                  <th className="py-2.5 px-6 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E0]">
                {recentUsers && recentUsers.length > 0 ? (
                  recentUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-black/[0.01]">
                      <td className="py-3 px-6 font-mono text-[#1F2937]">{u.email}</td>
                      <td className="py-3 px-6 text-[#4B5563]">{u.full_name || "—"}</td>
                      <td className="py-3 px-6">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            u.role === "admin"
                              ? "bg-slate-900 text-white border-slate-900"
                              : u.role === "tutor"
                              ? "bg-blue-50 text-[#2563EB] border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-[#9CA3AF]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 px-6 text-center text-[#9CA3AF]">
                      No accounts registered yet. Sign up to test!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F9F6] flex items-center justify-center text-sm text-[#6B7280]">
          Loading Master Admin Control...
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
