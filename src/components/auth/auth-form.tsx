"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RoleSwitcher, type UserRole } from "./role-switcher";

interface AuthFormProps {
  initialMode: "signin" | "signup";
}

export function AuthForm({ initialMode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") === "tutor" ? "tutor" : "student") as UserRole;
  const redirectTo = searchParams.get("redirectTo") || "";

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [useMagicLink, setUseMagicLink] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (useMagicLink) {
        // Passwordless Magic Link flow
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              redirectTo || (role === "tutor" ? "/tutor" : "/student")
            )}`,
            data: {
              role,
              full_name: fullName || email.split("@")[0],
            },
          },
        });

        if (error) throw error;
        setSuccessMessage("A secure login link has been sent to your email. Click it to enter instantly.");
        return;
      }

      if (mode === "signin") {
        // Standard Email + Password Sign-In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Redirect based on role or admin override
        const user = data.user;
        const isAdmin = user?.email?.toLowerCase() === "rehxnnn0@gmail.com";
        const userRole = user?.user_metadata?.role || role;

        if (redirectTo) {
          router.push(redirectTo);
        } else if (isAdmin || userRole === "tutor") {
          router.push("/tutor");
        } else {
          router.push("/student");
        }
        router.refresh();
      } else {
        // Create Account Sign-Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              full_name: fullName.trim() || email.split("@")[0],
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              redirectTo || (role === "tutor" ? "/tutor" : "/student")
            )}`,
          },
        });

        if (error) throw error;

        // If auto-confirm is enabled in Supabase
        if (data.session) {
          if (redirectTo) {
            router.push(redirectTo);
          } else if (role === "tutor") {
            router.push("/tutor");
          } else {
            router.push("/student");
          }
          router.refresh();
        } else {
          setSuccessMessage(
            "Account created! Please check your email inbox to confirm your account and get started."
          );
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed. Please check your credentials.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 sm:p-8">
      {/* 1. Symmetrical Dual-Role Selector */}
      <RoleSwitcher selectedRole={role} onRoleChange={setRole} />

      {/* 2. Mode Selector (Sign In vs Sign Up) */}
      <div className="mt-6 flex items-center justify-between border-b border-[#E5E7EB] pb-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrorMessage(null);
            }}
            className={`text-sm font-semibold pb-1 border-b-2 transition-all ${
              mode === "signin"
                ? "border-[#2563EB] text-[#1F2937]"
                : "border-transparent text-[#9CA3AF] hover:text-[#4B5563]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMessage(null);
            }}
            className={`text-sm font-semibold pb-1 border-b-2 transition-all ${
              mode === "signup"
                ? "border-[#2563EB] text-[#1F2937]"
                : "border-transparent text-[#9CA3AF] hover:text-[#4B5563]"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Toggle Passwordless Magic Link */}
        <button
          type="button"
          onClick={() => setUseMagicLink(!useMagicLink)}
          className="text-xs text-[#2563EB] hover:underline"
        >
          {useMagicLink ? "Use Password" : "Use Magic Link"}
        </button>
      </div>

      {/* 3. Feedback Messages */}
      {errorMessage && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 4. Credentials Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {mode === "signup" && !useMagicLink && (
          <div>
            <label className="block text-xs font-medium text-[#4B5563] mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Prof. Sharma / Rohan Patil"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#D1D5DB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#4B5563] mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu.in"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#D1D5DB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition-all"
            />
          </div>
        </div>

        {!useMagicLink && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[#4B5563]">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#D1D5DB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>
                {useMagicLink
                  ? "Send Magic Link"
                  : mode === "signin"
                  ? `Sign in as ${role === "tutor" ? "Faculty" : "Student"}`
                  : `Create ${role === "tutor" ? "Faculty" : "Student"} Account`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Navigation */}
      <div className="mt-6 pt-4 border-t border-[#E5E7EB] text-center text-xs text-[#6B7280]">
        <span>By continuing, you agree to Mumbai University academic guidelines.</span>
      </div>
    </div>
  );
}
