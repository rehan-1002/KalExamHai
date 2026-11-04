import "server-only";

/**
 * Robust JSON repairer and parser for LLM-generated outputs.
 * 
 * Handles:
 * 1. Markdown code block wrappers (```json ... ``` or ``` ...)
 * 2. Unescaped LaTeX backslashes (\min, \frac, \infty, \sum, \mathcal{O}, \alpha, \theta, \beta)
 *    which are invalid escape sequences in JSON and cause JSON.parse to crash.
 * 3. Trailing commas in arrays and objects ([1, 2, ])
 * 4. Preamble and postamble commentary around the JSON payload
 */
export function safeJsonParse<T = unknown>(rawInput: string): T {
  if (!rawInput || typeof rawInput !== "string") {
    throw new Error("Empty or non-string input provided to JSON parser.");
  }

  // 1. Strip markdown fences defensively
  let cleaned = rawInput
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/g, "")
    .trim();

  // 2. Try native parse first (fast path for perfectly formatted JSON)
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall through to repair steps
  }

  // 3. Extract JSON boundaries if LLM included conversational text
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = -1;

  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx !== -1) {
    const isObject = cleaned[startIdx] === "{";
    const endIdx = isObject ? cleaned.lastIndexOf("}") : cleaned.lastIndexOf("]");
    if (endIdx > startIdx) {
      cleaned = cleaned.slice(startIdx, endIdx + 1);
    }
  }

  // 4. Repair unescaped LaTeX backslashes while preserving valid JSON escapes
  cleaned = repairJsonBackslashes(cleaned);

  // 5. Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

  // 6. Try parsing the repaired JSON
  try {
    return JSON.parse(cleaned) as T;
  } catch (err: unknown) {
    // 7. Last-ditch attempt: fix unescaped double quotes inside strings if possible
    try {
      const sanitizedQuotes = cleaned.replace(/(?<=:\s*"[^"]*)"([^",}\]]*)"/g, '\\"$1\\"');
      return JSON.parse(sanitizedQuotes) as T;
    } catch {
      const originalErr = err instanceof Error ? err.message : String(err);
      throw new Error(`AI response could not be parsed as valid JSON: ${originalErr}`);
    }
  }
}

/**
 * Escapes backslashes in JSON strings that are not part of standard JSON escape sequences,
 * and preserves LaTeX math formulas (\frac, \theta, \beta, \min, \infty).
 */
function repairJsonBackslashes(jsonStr: string): string {
  let result = "";
  let inString = false;
  let i = 0;

  while (i < jsonStr.length) {
    const char = jsonStr[i];

    if (char === '"' && (i === 0 || jsonStr[i - 1] !== "\\")) {
      inString = !inString;
      result += char;
      i++;
      continue;
    }

    if (inString && char === "\\") {
      const nextChar = jsonStr[i + 1];
      const afterNextChar = jsonStr[i + 2] || "";

      // Check if it's a LaTeX command starting with f, t, n, b, r (e.g. \frac, \text, \theta, \beta, \rho, \nabla)
      const isLatexCommand =
        (nextChar === "f" || nextChar === "t" || nextChar === "n" || nextChar === "b" || nextChar === "r") &&
        /[a-zA-Z]/.test(afterNextChar);

      if (isLatexCommand) {
        // Must escape to \\ so LaTeX formula is preserved in JSON string
        result += "\\\\";
        i++;
        continue;
      }

      // Check standard JSON escape sequences: \", \\, \/
      if (nextChar === '"' || nextChar === "\\" || nextChar === "/") {
        result += "\\" + nextChar;
        i += 2;
        continue;
      }

      // Check standard control escapes: \b, \f, \n, \r, \t (not followed by letters)
      if (nextChar === "b" || nextChar === "f" || nextChar === "n" || nextChar === "r" || nextChar === "t") {
        result += "\\" + nextChar;
        i += 2;
        continue;
      }

      // Check unicode: \uXXXX
      if (nextChar === "u" && /^[0-9a-fA-F]{4}/.test(jsonStr.slice(i + 2, i + 6))) {
        result += jsonStr.slice(i, i + 6);
        i += 6;
        continue;
      }

      // Unescaped LaTeX backslash (e.g. \min, \infty, \sum, \alpha, \le, \ge)
      result += "\\\\";
      i++;
      continue;
    }

    result += char;
    i++;
  }

  return result;
}
