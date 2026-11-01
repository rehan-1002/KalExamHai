import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions — KalExamHai",
  description: "Terms and conditions governing the use of KalExamHai's exam preparation and question paper generation platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F6] text-[#1F2937] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-[#E7E5E0] rounded-xl p-8 sm:p-12 shadow-sm space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to KalExamHai
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Legal Agreement</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms and Conditions</h1>
          <p className="text-xs text-slate-500 mt-1">Last updated: November 1, 2026</p>
        </div>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using KalExamHai (&quot;Service&quot;, &quot;Platform&quot;), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Platform. KalExamHai is an independent educational tool designed to assist students and educators with study material preparation and university examination format compliance.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">2. Description of Service</h2>
          <p>
            KalExamHai provides AI-assisted study tools, including 3D memory flashcards, high-yield formula sheets, oral viva prep questions, and mock examination papers formatted according to Mumbai University NEP-2020 guidelines. All materials are generated strictly using user-uploaded course syllabus and lecture notes.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">3. User Responsibilities &amp; Fair Use</h2>
          <p>
            Users agree not to upload malicious files, copyrighted textbooks without authorization, or abusive content. KalExamHai enforces a fair-use daily quota (3 free generations per day during launch mode) to ensure equitable server and AI resource availability for all students.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">4. Academic Integrity &amp; Disclaimer</h2>
          <p>
            KalExamHai is an educational practice and preparation aid. While generated blueprints conform to NEP-2020 structures, KalExamHai does not claim to leak, possess, or guarantee actual university examination questions. Students are expected to use the platform as a complementary revision instrument.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">5. Contact Information</h2>
          <p>
            For any legal or operational queries regarding these terms, please contact our support desk at{" "}
            <a href="mailto:support@kalexamhai.com" className="text-blue-600 underline font-medium">
              support@kalexamhai.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}

