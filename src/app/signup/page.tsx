import React, { Suspense } from "react";
import { AuthSwitch } from "@/components/vendor/auth-switch";
import { SunMoonThemeToggle } from "@/components/ui/sun-moon-theme-toggle";

export const metadata = {
  title: "Create Account — KalExamHai",
  description: "Create an account to generate Mumbai University question papers or study with verified exam notes.",
};

function SignUpContent() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <SunMoonThemeToggle size={34} defaultTheme="light" storageKey="keh_theme" />
      </div>
      <AuthSwitch initialMode="signup" />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F9F6] flex items-center justify-center text-sm text-[#6B7280]">
          Loading secure portal...
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
