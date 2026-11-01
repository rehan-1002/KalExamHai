import React from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — KalExamHai",
  description: "Privacy policy detailing how KalExamHai protects user data and academic documents.",
};

export default function PrivacyPage() {
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
            <Lock className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Data Protection</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
          <p className="text-xs text-slate-500 mt-1">Last updated: November 1, 2026</p>
        </div>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
          <p>
            When you register for KalExamHai, we collect your email address, full name, and selected workspace role (Student or Faculty). When you upload documents (PDF, TXT, MD), we process the document text to generate vector embeddings for semantic search and study tool generation.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">2. Document Isolation &amp; Security</h2>
          <p>
            Your uploaded notes and study materials are strictly isolated. We enforce PostgreSQL Row Level Security (RLS) on all storage buckets and database tables. No other user can search, view, or generate materials from your personal syllabus library.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">3. Third-Party AI Processing</h2>
          <p>
            Extracted document chunks are sent securely via TLS 1.3 to Google Gemini API endpoints solely for the purpose of generating your requested study materials. Your documents are never used to train public foundation models.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">4. Data Retention &amp; Deletion</h2>
          <p>
            You can delete any uploaded document or generated examination paper at any time from your Knowledge Library or Papers history. Deletion permanently purges the file from storage and deletes corresponding vector embeddings.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">5. Privacy Inquiries</h2>
          <p>
            For data protection inquiries or requests to delete your account, contact our privacy officer at{" "}
            <a href="mailto:privacy@kalexamhai.com" className="text-blue-600 underline font-medium">
              privacy@kalexamhai.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}

