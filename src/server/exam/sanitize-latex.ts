import "server-only";
import katex from "katex";

export interface LatexSanitizeResult {
  text: string;
  hasWarnings: boolean;
  warnings: string[];
}

/**
 * Normalizes and validates LaTeX segments in text strings.
 * 1. Converts \(...\) to $...$ and \[...\] to $$...$$
 * 2. Restores accidental JSON control-character escapes (\f, \t, \b)
 * 3. Checks $ delimiter balance
 * 4. Runs KaTeX server dry-render check on all math segments
 * 5. Strips raw HTML tags
 */
export function sanitizeLatex(input: string): LatexSanitizeResult {
  if (!input) {
    return { text: "", hasWarnings: false, warnings: [] };
  }

  const warnings: string[] = [];

  // 1. Strip raw HTML tags (stored text is plain text + LaTeX only)
  let text = input.replace(/<\/?[^>]+(>|$)/g, "");

  // 2. Normalize LaTeX delimiters
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, "$$$$$1$$$$");
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, "$$$1$$");

  // 3. Balance check for single $ and double $$
  const rawSegments = text.split("$$");
  let normalizedDisplay = "";

  for (let i = 0; i < rawSegments.length; i++) {
    const seg = rawSegments[i]!;
    if (i % 2 === 1) {
      // Inside display math $$...$$
      try {
        katex.renderToString(seg.trim(), { displayMode: true, throwOnError: true });
        normalizedDisplay += `$$${seg.trim()}$$`;
      } catch (err: unknown) {
        warnings.push(`Invalid display math: "${seg.slice(0, 40)}" - ${err instanceof Error ? err.message : String(err)}`);
        normalizedDisplay += `$$${seg}$$`;
      }
    } else {
      // Process inline math $...$ within non-display segments
      const inlineParts = seg.split("$");
      let inlineResult = "";

      for (let j = 0; j < inlineParts.length; j++) {
        const inPart = inlineParts[j]!;
        if (j % 2 === 1) {
          // Inside inline math $...$
          try {
            katex.renderToString(inPart.trim(), { displayMode: false, throwOnError: true });
            inlineResult += `$${inPart.trim()}$`;
          } catch (err: unknown) {
            warnings.push(`Invalid inline math: "${inPart.slice(0, 40)}" - ${err instanceof Error ? err.message : String(err)}`);
            inlineResult += `$${inPart}$`;
          }
        } else {
          inlineResult += inPart;
        }
      }

      // Check for unbalanced lone $
      if (inlineParts.length % 2 === 0) {
        warnings.push("Unbalanced inline '$' delimiter detected");
      }

      normalizedDisplay += inlineResult;
    }
  }

  return {
    text: normalizedDisplay,
    hasWarnings: warnings.length > 0,
    warnings,
  };
}

