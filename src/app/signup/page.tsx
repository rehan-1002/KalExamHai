import React, { Suspense } from "react";
import { AuthSwitch } from "@/components/vendor/auth-switch";

export const metadata = {
  title: "Create Account — KalExamHai",
  description: "Create an account to generate Mumbai University question papers or study with verified exam notes.",
};

function SignUpContent() {
  return <AuthSwitch initialMode="signup" />;
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
