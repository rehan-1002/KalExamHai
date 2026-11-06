"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathTextProps {
  content: string;
  className?: string;
}

interface Segment {
  type: "text" | "inline-math" | "display-math";
  value: string;
}

function cleanPlainTextMath(text: string): string {
  return text
    .replace(/\\pi\b/g, "π")
    .replace(/\\dots\b/g, "…")
    .replace(/\\cdots\b/g, "···")
    .replace(/\\ldots\b/g, "…")
    .replace(/\\le(q)?\b/g, "≤")
    .replace(/\\ge(q)?\b/g, "≥")
    .replace(/\\ne(q)?\b/g, "≠")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\times\b/g, "×")
    .replace(/\\pm\b/g, "±")
    .replace(/\\to\b/g, "→")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\bar\{([a-zA-Z0-9]+)\}/g, "$1̄")
    .replace(/\\bar\(([a-zA-Z0-9]+)\)/g, "$1̄")
    .replace(/\^2\b/g, "²")
    .replace(/\^3\b/g, "³")
    .replace(/\^4\b/g, "⁴")
    .replace(/\^-1\b/g, "⁻¹");
}

/**
 * Normalizes common LaTeX delimiters and LLM quirks:
 * - Strips quotes around math like '$G$' or "$G$" -> $G$
 * - Converts \[ ... \] to $$ ... $$
 * - Converts \( ... \) to $ ... $
 * - Converts corrupted \begin(pmatrix) to \begin{pmatrix}
 * - Wraps unwrapped matrix environments in $$ ... $$
 */
function normalizeLatexInput(input: string): string {
  if (!input) return "";

  // 1. Remove single/double quotes wrapping inline math (e.g. '$G$' or "'$i$'" -> $G$, $i$)
  let normalized = input.replace(/["']\$([^$]+)\$["']/g, "$$$1$");

  // 2. Normalize display math \[ ... \] to $$ ... $$
  normalized = normalized.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `$$${eq.trim()}$$`);

  // 3. Normalize inline math \( ... \) to $ ... $
  normalized = normalized.replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => `$${eq.trim()}$`);

  // 4. Fix corrupted \begin(pmatrix) -> \begin{pmatrix} and \end(pmatrix) -> \end{pmatrix}
  normalized = normalized.replace(/\\begin\(([a-zA-Z*]+)\)/g, "\\begin{$1}");
  normalized = normalized.replace(/\\end\(([a-zA-Z*]+)\)/g, "\\end{$1}");

  // 5. Fix \bar(x) -> \bar{x}
  normalized = normalized.replace(/\\bar\(([a-zA-Z0-9]+)\)/g, "\\bar{$1}");

  // 6. Automatically wrap unwrapped matrix environments in $$...$$
  normalized = normalized.replace(
    /(?:([A-Za-z0-9_]+\s*=\s*)?)(\\begin\{(?:p|b|B|v|V)?matrix\}[\s\S]*?\\end\{(?:p|b|B|v|V)?matrix\})/g,
    (match) => `$$${match}$$`
  );

  // 7. Clean up accidental multiple dollar signs $$$$
  normalized = normalized.replace(/\${3,}/g, "$$");

  return normalized;
}

/**
 * Splits text with LaTeX delimiters ($...$ and $$...$$) into distinct rendering segments.
 */
function splitLatexSegments(input: string): Segment[] {
  if (!input) return [];

  const normalized = normalizeLatexInput(input);
  const segments: Segment[] = [];

  // Split on display math $$...$$ first
  const displayParts = normalized.split("$$");

  for (let i = 0; i < displayParts.length; i++) {
    const part = displayParts[i]!;
    if (i % 2 === 1) {
      // Display math
      segments.push({ type: "display-math", value: part });
    } else {
      // Split on inline math $...$
      const inlineParts = part.split("$");
      for (let j = 0; j < inlineParts.length; j++) {
        const inPart = inlineParts[j]!;
        if (j % 2 === 1) {
          segments.push({ type: "inline-math", value: inPart });
        } else if (inPart.length > 0) {
          segments.push({ type: "text", value: inPart });
        }
      }
    }
  }

  return segments;
}

/**
 * Renders individual LaTeX math segments safely with KaTeX.
 * If KaTeX fails to parse, renders a fallback monospace badge instead of blanking the paper.
 */
function KaTeXSegment({ math, display }: { math: string; display: boolean }) {
  const html = useMemo(() => {
    try {
      const trimmed = math.trim();
      if (!trimmed) return "";
      return katex.renderToString(trimmed, {
        displayMode: display,
        throwOnError: false,
        errorColor: "#B42318",
        trust: true,
        strict: false,
        output: "htmlAndMathml",
      });
    } catch {
      return null;
    }
  }, [math, display]);

  if (!html) {
    return (
      <span className="font-mono text-xs px-1.5 py-0.5 rounded-[4px] bg-[#FEF3F2] text-[#B42318] border border-red-200">
        ${math}$
      </span>
    );
  }

  if (display) {
    return (
      <span
        className="block my-2 overflow-x-auto max-w-full text-center"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return <span className="inline-block" dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Pure, safe Math & Text renderer component for Mumbai University examination questions.
 */
export function MathText({ content, className = "" }: MathTextProps) {
  const segments = useMemo(() => splitLatexSegments(content), [content]);

  return (
    <span className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === "text") {
          return <span key={idx}>{cleanPlainTextMath(seg.value)}</span>;
        }
        return (
          <KaTeXSegment
            key={idx}
            math={seg.value}
            display={seg.type === "display-math"}
          />
        );
      })}
    </span>
  );
}

export default MathText;
