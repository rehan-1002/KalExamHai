import React, { Suspense } from "react";
import { AuthSwitch } from "@/components/vendor/auth-switch";

export const metadata = {
  title: "Sign In — KalExamHai",
  description: "Sign in to access your Mumbai University question papers and exam prep tools.",
};

interface LoginPageProps {
  searchParams?: Promise<{ redirectTo?: string; next?: string }>;
}

async function LoginContent({ searchParams }: LoginPageProps) {
  const sp = searchParams ? await searchParams : {};
  const redirectTarget = sp.redirectTo || sp.next || "/student";
  return <AuthSwitch initialMode="signin" redirectTo={redirectTarget} />;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F9F6] flex items-center justify-center text-sm text-[#6B7280]">
          Loading secure portal...
        </div>
      }
    >
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
