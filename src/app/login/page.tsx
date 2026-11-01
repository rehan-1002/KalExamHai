import React, { Suspense } from "react";
import { AuthSwitch } from "@/components/vendor/auth-switch";

export const metadata = {
  title: "Sign In — KalExamHai",
  description: "Sign in to access your Mumbai University question papers and exam prep tools.",
};

function LoginContent() {
  return <AuthSwitch initialMode="signin" />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F9F6] flex items-center justify-center text-sm text-[#6B7280]">
          Loading secure portal...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
