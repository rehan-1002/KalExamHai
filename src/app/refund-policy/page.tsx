import React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

export const metadata = {
  title: "Refund and Cancellation Policy — KalExamHai",
  description: "Official refund and cancellation policy for KalExamHai digital passes and credit packs.",
};

export default function RefundPolicyPage() {
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
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Payment &amp; Refund Policy</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Refund and Cancellation Policy</h1>
          <p className="text-xs text-slate-500 mt-1">Last updated: November 1, 2026</p>
        </div>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Digital Nature of Service</h2>
          <p>
            KalExamHai offers digital access passes (Exam-Night Emergency Pass ₹49, Semester Pass ₹99) and prepaid AI credit packs. During our launch phase, core platform features are available under a free daily quota (3 generations per day).
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">2. Refund Eligibility</h2>
          <p>
            Because study artifacts and question papers are generated and delivered instantaneously upon request, purchases of digital passes and credit packs are generally non-refundable once utilized. However, you are entitled to a full refund under the following conditions:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Duplicate payment deduction due to a payment gateway or network timeout error.</li>
            <li>Technical failure where credits were charged but no examination paper or study artifact was generated and the automatic refund trigger failed.</li>
            <li>Refund request submitted within 48 hours of purchase with 0 utilized generations under that pass or credit pack.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">3. Refund Processing Timeline</h2>
          <p>
            Approved refunds are credited back to the original payment source (UPI, Debit Card, Credit Card, or Net Banking) within <strong>5 to 7 business days</strong> in accordance with standard RBI and payment gateway processing timelines.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">4. How to Request a Refund</h2>
          <p>
            To initiate a refund request, send an email to{" "}
            <a href="mailto:payments@kalexamhai.com" className="text-blue-600 underline font-medium">
              payments@kalexamhai.com
            </a>{" "}
            with your registered account email, Transaction ID / Payment ID, and a brief description of the issue. Our support team responds within 24 hours.
          </p>
        </section>
      </div>
    </div>
  );
}

