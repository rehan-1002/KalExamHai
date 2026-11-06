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

/**
 * Normalizes common LaTeX delimiters and LLM quirks:
 * - Strips quotes around math like '$G$' or "$G$" -> $G$
 * - Converts \[ ... \] to $$ ... $$
 * - Converts \( ... \) to $ ... $
 */
function normalizeLatexInput(input: string): string {
  if (!input) return "";

  // 1. Remove single/double quotes wrapping inline math (e.g. '$G$' or "'$i$'" -> $G$, $i$)
  let normalized = input.replace(/["']\$([^$]+)\$["']/g, "$$$1$");

  // 2. Normalize display math \[ ... \] to $$ ... $$
  normalized = normalized.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `$$${eq.trim()}$$`);

  // 3. Normalize inline math \( ... \) to $ ... $
  normalized = normalized.replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => `$${eq.trim()}$`);

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
          return <span key={idx}>{seg.value}</span>;
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
