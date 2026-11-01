"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Zap, CheckCircle2, ChevronRight, Eye, ShieldCheck, Sparkles, BookOpen } from "lucide-react";
import katex from "katex";

function Latex({ math, inline = true }: { math: string; inline?: boolean }) {
  try {
    const html = katex.renderToString(math, {
      displayMode: !inline,
      throwOnError: false,
    });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <code>{math}</code>;
  }
}

export function InteractivePreview() {
  const [activeTab, setActiveTab] = useState<"tutor" | "student">("tutor");
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [activeSource, setActiveSource] = useState(false);

  return (
    <div className="w-full rounded-2xl bg-white border border-[#E7E5E0] shadow-[0_4px_24px_rgba(31,41,55,0.06),0_1px_4px_rgba(31,41,55,0.04)] overflow-hidden transition-all duration-200">
      {/* Top Interactive Switcher Bar */}
      <div className="px-4 py-3 bg-[#F9F9F6] border-b border-[#E7E5E0] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#E7E5E0]/60 rounded-lg">
          <button
            onClick={() => setActiveTab("tutor")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              activeTab === "tutor"
                ? "bg-white text-[#1F2937] shadow-sm"
                : "text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Tutor: MU Exam Paper (20M)</span>
          </button>

          <button
            onClick={() => setActiveTab("student")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              activeTab === "student"
                ? "bg-white text-[#1F2937] shadow-sm"
                : "text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Student: 24h Survival Kit</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Context Verified &bull; Strict NEP-2020</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 text-left">
        <AnimatePresence mode="wait">
          {activeTab === "tutor" ? (
            <motion.div
              key="tutor"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Paper Academic Header */}
              <div className="text-center pb-3 border-b border-[#E7E5E0] font-serif">
                <h3 className="text-sm sm:text-base font-bold text-[#1F2937] tracking-tight">
                  DEPARTMENT OF COMPUTER ENGINEERING
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Internal Assessment Test 1 &bull; Semester III (NEP-2020 Scheme)
                </p>
                <div className="flex items-center justify-between text-xs text-[#1F2937] font-sans mt-2 pt-2 border-t border-dashed border-[#E7E5E0]">
                  <span>Course: <strong>Applied Mathematics III</strong></span>
                  <span>Max Marks: <strong>20</strong></span>
                  <span>Time: <strong>1 Hour</strong></span>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-[11px] text-[#6B7280] bg-[#F9F9F6] p-2.5 rounded-md border border-[#E7E5E0]/70 font-sans">
                <strong>N.B.</strong> (1) Question No. 1 is compulsory. (2) Attempt any one question from Q.2 and Q.3. (3) Figures to the right indicate full marks.
              </div>

              {/* Sample Questions */}
              <div className="space-y-3 font-serif">
                {/* Q1 Block */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#1F2937] font-sans pb-1">
                    <span>Q.1 Attempt any TWO of the following:</span>
                    <span className="text-[#2563EB] font-mono">[10 Marks]</span>
                  </div>

                  {/* Subquestion a */}
                  <div className="p-3 bg-white rounded-lg border border-[#E7E5E0] hover:border-[#2563EB]/40 transition-colors">
                    <div className="flex items-start justify-between gap-3 text-xs sm:text-sm text-[#1F2937]">
                      <div>
                        <span className="font-bold mr-2 font-sans">(a)</span>
                        Prove that the vector field{" "}
                        <Latex math="\vec{F} = (2xy + z^3)\hat{i} + x^2\hat{j} + 3xz^2\hat{k}" />{" "}
                        is irrotational, and hence find its scalar potential function{" "}
                        <Latex math="\phi" />.
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#1F2937] bg-[#F9F9F6] px-1.5 py-0.5 rounded border border-[#E7E5E0] shrink-0">
                        [05]
                      </span>
                    </div>

                    {/* Source citation */}
                    <div className="mt-2.5 pt-2 border-t border-[#E7E5E0]/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans">
                      <button
                        onClick={() => setActiveSource(!activeSource)}
                        className="text-[#2563EB] hover:underline flex items-center gap-1 font-medium"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Source: Module 2 (Vector Calculus) &bull; Page 18</span>
                      </button>

                      <button
                        onClick={() => setShowAnswerKey(!showAnswerKey)}
                        className="text-[#6B7280] hover:text-[#1F2937] flex items-center gap-1 text-[11px]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{showAnswerKey ? "Hide marking scheme" : "View marking scheme"}</span>
                      </button>
                    </div>

                    {/* Expandable Marking Scheme */}
                    {showAnswerKey && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 p-2.5 bg-[#EFF6FF] rounded border border-blue-200/60 text-xs font-sans text-[#1F2937]"
                      >
                        <p className="font-semibold text-[#2563EB] mb-1">Model Answer / Marking Scheme:</p>
                        <ul className="list-disc list-inside space-y-1 text-[#4B5563]">
                          <li>
                            Compute <Latex math="\text{curl } \vec{F} = \nabla \times \vec{F} = \vec{0}" /> <span className="font-mono text-[#2563EB]">[2 Marks]</span>
                          </li>
                          <li>
                            Integrate <Latex math="d\phi = \vec{F} \cdot d\vec{r} \Rightarrow \phi = x^2y + xz^3 + C" /> <span className="font-mono text-[#2563EB]">[3 Marks]</span>
                          </li>
                        </ul>
                      </motion.div>
                    )}
                  </div>

                  {/* Subquestion b */}
                  <div className="mt-2 p-3 bg-white rounded-lg border border-[#E7E5E0] hover:border-[#2563EB]/40 transition-colors">
                    <div className="flex items-start justify-between gap-3 text-xs sm:text-sm text-[#1F2937]">
                      <div>
                        <span className="font-bold mr-2 font-sans">(b)</span>
                        Evaluate the Laplace Transform:{" "}
                        <Latex math="\mathcal{L}\left\{ t \cdot e^{-2t} \sin(3t) \right\}" />.
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#1F2937] bg-[#F9F9F6] px-1.5 py-0.5 rounded border border-[#E7E5E0] shrink-0">
                        [05]
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#E7E5E0]/60 text-[11px] font-sans text-[#6B7280]">
                      <span>Source: Module 1 (Laplace Transform) &bull; Page 9</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="student"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 font-sans"
            >
              {/* Exam Emergency Kit Badge */}
              <div className="flex items-center justify-between pb-2 border-b border-[#E7E5E0]">
                <div>
                  <span className="text-xs font-bold text-[#1F2937]">
                    Applied Mathematics III &bull; 24h Cram Kit
                  </span>
                  <p className="text-[11px] text-[#6B7280]">High-frequency derivations &amp; examiner viva prep</p>
                </div>
                <span className="text-xs font-medium text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded border border-blue-200/50">
                  ₹49 Exam Pass Included
                </span>
              </div>

              {/* Viva Card 1 (Tricky) */}
              <div className="p-3.5 bg-white rounded-xl border border-[#E7E5E0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 rounded border border-rose-200">
                    Tricky Examiner Question
                  </span>
                  <span className="text-[11px] text-[#6B7280]">Viva Probability: 92%</span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-[#1F2937]">
                  &ldquo;Can a divergence-free vector field still have a non-zero curl? What is its physical vortex interpretation?&rdquo;
                </p>

                <div className="p-2.5 bg-[#F9F9F6] rounded-lg border border-[#E7E5E0] text-xs space-y-1.5 text-[#374151]">
                  <p>
                    <strong>Model Answer:</strong> Yes. For incompressible fluid flow (<Latex math="\nabla \cdot \vec{v} = 0" />), the fluid elements can still undergo local rotation, meaning <Latex math="\nabla \times \vec{v} \neq 0" />.
                  </p>
                  <p className="text-rose-600 text-[11px] font-medium">
                    ⚠️ Examiner Trap: Do not confuse velocity potential with stream function; a velocity potential only exists if curl is zero.
                  </p>
                </div>
              </div>

              {/* Must-Know Derivation Snippet */}
              <div className="p-3 bg-white rounded-xl border border-[#E7E5E0] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1F2937]">
                  <span>⚡ Priority Derivation 1 of 4: Stokes&apos; Theorem</span>
                  <span className="text-emerald-700 text-[11px] font-medium">Appeared in 4 of last 5 papers</span>
                </div>
                <p className="text-xs text-[#4B5563]">
                  Relation between line integral and surface integral:
                </p>
                <div className="p-2 bg-[#F9F9F6] rounded text-center text-xs text-[#1F2937]">
                  <Latex math="\oint_C \vec{F} \cdot d\vec{r} = \iint_S (\nabla \times \vec{F}) \cdot \hat{n} \, dS" inline={false} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card Footer Bar */}
      <div className="px-5 py-2.5 bg-[#F9F9F6] border-t border-[#E7E5E0] flex items-center justify-between text-xs text-[#6B7280]">
        <span>Validated against Mumbai University NEP-2020 circular guidelines</span>
        <span className="text-[#2563EB] font-medium hover:underline flex items-center cursor-pointer">
          See full End-Sem (60M) spec <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </span>
      </div>
    </div>
  );
}
