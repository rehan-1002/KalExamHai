import React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Clock, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Contact Us — KalExamHai",
  description: "Get in touch with KalExamHai customer support for help with question paper generation, subscriptions, and student notes.",
};

export default function ContactPage() {
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
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Support Desk</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contact Us</h1>
          <p className="text-xs text-slate-500 mt-1">We are here to support your exam preparation 24/7.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 border border-slate-200 rounded-[6px] bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs">
              <Mail className="w-4 h-4" />
              <span>General &amp; Student Inquiries</span>
            </div>
            <a href="mailto:support@kalexamhai.com" className="text-sm font-bold text-slate-900 hover:text-blue-600">
              support@kalexamhai.com
            </a>
            <p className="text-xs text-slate-500">For syllabus uploads, feedback, or paper generation queries.</p>
          </div>

          <div className="p-5 border border-slate-200 rounded-[6px] bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs">
              <Clock className="w-4 h-4" />
              <span>Response Turnaround Time</span>
            </div>
            <div className="text-sm font-bold text-slate-900">Within 12–24 Hours</div>
            <p className="text-xs text-slate-500">Priority triage during active Mumbai University exam weeks.</p>
          </div>
        </div>

        <div className="p-5 border border-slate-200 rounded-[6px] bg-white space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Operating Location</span>
          </div>
          <div className="text-sm font-bold text-slate-900">Mumbai, Maharashtra, India</div>
          <p className="text-xs text-slate-500">KalExamHai — Engineered specifically for Mumbai University colleges &amp; engineering institutes.</p>
        </div>
      </div>
    </div>
  );
}

