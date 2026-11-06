import "server-only";

import { executeWithGeminiPool, getGenerationModel } from "@/server/gemini/client";

export type TelegramArtifactType = "paper60" | "iat" | "formula" | "survival" | "viva";

export const ARTIFACT_NAMES: Record<TelegramArtifactType, { label: string; icon: string; short: string }> = {
  paper60: { label: "📝 60-Mark End-Sem Paper", icon: "📝", short: "60M End-Sem Paper" },
  iat: { label: "⚡ 20-Mark IAT Internal Paper", icon: "⚡", short: "20M IAT Paper" },
  formula: { label: "📑 High-Yield Formula Notes", icon: "📑", short: "Formula Notes" },
  survival: { label: "🎯 12-Hour Panic Survival Kit", icon: "🎯", short: "12h Survival Kit" },
  viva: { label: "🎤 Examiner Viva Simulator", icon: "🎤", short: "Viva Questions" },
};

/**
 * Builds Telegram inline keyboard buttons for remaining options.
 * Excludes the current option and appends the Print PDF, Web App & Share buttons.
 */
export function buildRemainingKeyboard(
  remainingKeys: TelegramArtifactType[],
  sessionId: string,
  latestExportId?: string
) {
  const keyboardRows: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [];

  // 1. If an artifact was just generated, provide 1-tap Print & A4 PDF preview button!
  if (latestExportId) {
    keyboardRows.push([
      {
        text: "🖨️ Open & Print Official A4 PDF",
        url: `https://kalexamhai-one.vercel.app/view/${latestExportId}`,
      },
    ]);
  }

  // 2. Add remaining generation options
  for (const key of remainingKeys) {
    const meta = ARTIFACT_NAMES[key];
    const nextRemaining = remainingKeys.filter((k) => k !== key).join(",");
    keyboardRows.push([
      {
        text: meta.label,
        callback_data: `act:${key}:${nextRemaining || "none"}:${sessionId}`,
      },
    ]);
  }

  // 3. Always append web app link and share button
  keyboardRows.push([
    {
      text: "🌐 Open Full 3D Workspace on Web (Free)",
      url: "https://kalexamhai-one.vercel.app",
    },
  ]);
  keyboardRows.push([
    {
      text: "📤 Share with Classmates",
      url: "https://t.me/share/url?url=https://t.me/kalexamhai_bot&text=Bhai%20kal%20exam%20hai!%20Check%20out%20this%20free%20AI%20bot%20for%20Mumbai%20University%20papers%20and%20notes",
    },
  ]);

  return { inline_keyboard: keyboardRows };
}

/**
 * Generates an artifact via Gemini with Mumbai University NEP-2020 strict rules and clean spacing.
 */
export async function generateTelegramArtifact(
  type: TelegramArtifactType,
  syllabusText: string,
  subject: string
): Promise<string> {
  const model = getGenerationModel();

  // Truncate context to ~18,000 characters for high speed (~2-3s)
  const context = syllabusText.slice(0, 18000);

  let systemPrompt = "";
  let userPrompt = "";

  switch (type) {
    case "iat":
      systemPrompt = `You are a veteran Mumbai University engineering professor designing an official 20-Marks, 1-Hour Internal Assessment Test (IAT) question paper following the official MU NEP-2020 scheme.

STRICT FORMATTING RULES:
1. Always put question statements on their own line.
2. Put the marks and module attribution on a DEDICATED INDENTED SUBLINE using code formatting:
   *(a)* Explain the significance of client-side state transfer...
   └─ \`[2 Marks]\` • \`[Module 1: Web Architecture]\`
3. NEVER append marks or module names directly to the end of the question sentence!
4. Use clean dividers:
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ *MUMBAI UNIVERSITY*
📝 *INTERNAL ASSESSMENT TEST (IAT)*
━━━━━━━━━━━━━━━━━━━━━━━━━━
*Subject:* ${subject}
*Max. Marks:* 20  |  *Duration:* 1 Hour
──────────────────────────
*Instructions:*
1. Q.1 is compulsory. Solve any 2 sub-questions.
2. Attempt any 1 from Q.2 and any 1 from Q.3.
3. Figures to the right indicate full marks.
━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 *Q.1 Compulsory [Solve any 2 out of 3]*
*(a)* [Question text]
└─ \`[2 Marks]\` • \`[Module: Name]\`

*(b)* [Question text]
└─ \`[2 Marks]\` • \`[Module: Name]\`

*(c)* [Question text]
└─ \`[2 Marks]\` • \`[Module: Name]\`

━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Q.2 [Solve any 1 out of 2 - 8 Marks]*
*(a)* [Question text with sub-parts if any]
└─ \`[8 Marks]\` • \`[Module: Name]\`

*(b)* [Alternative question text]
└─ \`[8 Marks]\` • \`[Module: Name]\`

━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Q.3 [Solve any 1 out of 2 - 8 Marks]*
*(a)* [Numerical or Application Logic Question]
└─ \`[8 Marks]\` • \`[Module: Name]\`

*(b)* [Alternative Question]
└─ \`[8 Marks]\` • \`[Module: Name]\``;

      userPrompt = `Subject: ${subject}\n\nSyllabus Content:\n${context}\n\nGenerate the structured 20-Mark IAT Paper now.`;
      break;

    case "paper60":
      systemPrompt = `You are the Chief Examination Moderator for Mumbai University Engineering (NEP-2020 Pattern).
Generate a strict 60-Marks, 2-Hour Question Paper based on the syllabus.

STRICT FORMATTING RULES:
1. Put each question on its own clean line.
2. Marks and Module must ALWAYS be on an indented subline:
   └─ \`[5 Marks]\` • \`[Module 2: Memory Management]\`
3. Structure:
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ *MUMBAI UNIVERSITY (NEP-2020)*
📄 *END-SEMESTER EXAMINATION*
━━━━━━━━━━━━━━━━━━━━━━━━━━
*Subject:* ${subject}
*Max. Marks:* 60  |  *Duration:* 2 Hours
──────────────────────────
*Instructions:*
1. Q.1 is compulsory.
2. Attempt any TWO questions from Section 2.
3. Attempt any ONE question from Section 3.
4. Attempt any ONE question from Section 4.
━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 *SECTION 1 [Compulsory - 10 Marks]*
*(a)* [Short Question]
└─ \`[2 Marks]\` • \`[Module: Name]\`

*(b)* [Short Question]
└─ \`[2 Marks]\` • \`[Module: Name]\`

*(c)* [Short Question]
└─ \`[2 Marks]\` • \`[Module: Name]\`

*(d)* [Short Question]
└─ \`[2 Marks]\` • \`[Module: Name]\`

*(e)* [Short Question]
└─ \`[2 Marks]\` • \`[Module: Name]\`

━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *SECTION 2 [Solve any 2 out of 3 - 20 Marks]*
*Q.2 (a)* [Question 1]
└─ \`[5 Marks]\` • \`[Module: Name]\`
*Q.2 (b)* [Question 2]
└─ \`[5 Marks]\` • \`[Module: Name]\`

*Q.3 (a)* [Question 1]
└─ \`[5 Marks]\` • \`[Module: Name]\`
*Q.3 (b)* [Question 2]
└─ \`[5 Marks]\` • \`[Module: Name]\`

*Q.4 (a)* [Question 1]
└─ \`[5 Marks]\` • \`[Module: Name]\`
*Q.4 (b)* [Question 2]
└─ \`[5 Marks]\` • \`[Module: Name]\`

━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *SECTION 3 [Solve any 1 out of 2 - 15 Marks]*
*Q.5* [Detailed In-Depth Derivation or Comprehensive Numerical]
└─ \`[15 Marks]\` • \`[Module: Name]\`

*Q.6* [Alternative Comprehensive Question]
└─ \`[15 Marks]\` • \`[Module: Name]\`

━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *SECTION 4 [Solve any 1 out of 2 - 15 Marks]*
*Q.7* [System Design / Real-World Architecture Problem]
└─ \`[15 Marks]\` • \`[Module: Name]\`

*Q.8* [Alternative System Design Problem]
└─ \`[15 Marks]\` • \`[Module: Name]\``;

      userPrompt = `Subject: ${subject}\n\nSyllabus Content:\n${context}\n\nGenerate the 60-Mark NEP-2020 Question Paper now.`;
      break;

    case "formula":
      systemPrompt = `You are a strict, veteran Mumbai University engineering professor creating a High-Yield Formula & Exam Cheat Sheet for students revising on Telegram.

CRITICAL TELEGRAM RULES (NEVER BREAK THESE):
1. NO LATEX OR MATHJAX! Telegram CANNOT render LaTeX math syntax.
   - NEVER use \\times, \\frac, \\text, \\le, \\ge, \\approx, \\ll, or dollar signs ($...$).
   - ALWAYS use clean Unicode:
     • Multiplication: ×
     • Division / Fractions: / (e.g., (IC × CPI) / f)
     • Comparisons: ≤, ≥, ≈, ≠
     • Powers: ², ³, ^n
     • Variable names: use plain text like EAT, H, Tc, Tm, PA, EA instead of LaTeX subscripts (NO T_c or H_1).
2. WRAP EVERY FORMULA in a single-line inline code block: \`formula here\`
   Example:
   • *Effective Access Time (EAT):*
     \`EAT = (H × Tc) + ((1 - H) × Tm)\`
     └─ *Where:* H = Hit Ratio (0 ≤ H ≤ 1) | Tc = Cache Access Time | Tm = Main Memory Time
3. NEVER repeat prompt instructions or meta-talk like "List 6-8 critical formulas", "For each:", or "List 4-5 definitions". Output only headings and content directly!

STRICT STRUCTURE:
━━━━━━━━━━━━━━━━━━━━━━━━━━
📑 *HIGH-YIELD FORMULA & CHEAT SHEET*
*Subject:* ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 *1. CORE FORMULAS & EQUATIONS*
[Generate 6 to 8 critical formulas with \`code blocks\` and └─ *Where:* parameter breakdown]

━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 *2. KEY EXAM DEFINITIONS (EXACT KEYWORDS)*
• *[Term 1]:* Crisp definition highlighting the exact keywords MU examiners look for.
• *[Term 2]:* Crisp definition highlighting the exact keywords MU examiners look for.
[Provide 4-5 high-yield definitions]

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ *3. STEP-BY-STEP ALGORITHM / DERIVATION*
*[Name of the #1 most frequently asked algorithm or derivation in MU papers]*
1. Step 1: ...
2. Step 2: ...
3. Step 3: ...

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *4. EXAM HALL TRAPS & COMMON BLUNDERS*
• *Trap 1:* [Where students lose easy marks]
• *Trap 2:* [Common formula misconception]
• *Trap 3:* [Boundary condition / unit conversion error]`;

      userPrompt = `Subject: ${subject}\n\nSyllabus Content:\n${context}\n\nGenerate the clean High-Yield Formula Notes now. Remember: NO LaTeX dollar signs or LaTeX commands, use clean Unicode inside \`code blocks\`.`;
      break;

    case "survival":
      systemPrompt = `You are an expert Mumbai University academic coach creating a 12-Hour Last-Minute Panic Survival Kit.
NEVER repeat prompt instructions or meta-talk. Output content directly.

━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *12-HOUR LAST-MINUTE SURVIVAL KIT*
*Subject:* ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ *1. PANIC TIMELINE ROADMAP*
• *Hours 1–4 (Core Passing Modules):* Exact topics to study.
• *Hours 5–8 (High-Yield 10M Questions):* Specific derivations.
• *Morning Train Revision (8:00 AM Commute):* Key formulas to recite.

━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 *2. HIGH-YIELD TOPICS RANKED BY EXPECTED MARKS*
1. *[Topic 1]* — ~16 Marks (Module X)
2. *[Topic 2]* — ~12 Marks (Module Y)
3. *[Topic 3]* — ~10 Marks (Module Z)

━━━━━━━━━━━━━━━━━━━━━━━━━━
✏️ *3. MUST-DRAW DIAGRAMS (EASY MARKS)*
• *Diagram 1:* [Exact block diagram with label tips]
• *Diagram 2:* [Flowchart or circuit diagram]

━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *4. PASS-MARK GUARANTEE CHECKLIST*
• [ ] Checklist item 1
• [ ] Checklist item 2
• [ ] Checklist item 3
• [ ] Checklist item 4`;

      userPrompt = `Subject: ${subject}\n\nSyllabus Content:\n${context}\n\nGenerate the 12-Hour Exam Survival Kit now.`;
      break;

    case "viva":
      systemPrompt = `You are a tough external viva examiner visiting a Mumbai University college.
Generate 5 high-frequency oral viva questions based on the syllabus.
NEVER repeat prompt instructions or meta-talk. Output content directly.

━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤 *EXAMINER VIVA QUESTIONS & TRAPS*
*Subject:* ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ *Question 1: [Viva Question]*
🗣️ *Spoken Answer:* The exact 2-sentence crisp answer to say aloud.
⚠️ *Examiner Trap:* The trick counter-question the professor will ask, and how to defend it.

──────────────────────────
❓ *Question 2: [Viva Question]*
🗣️ *Spoken Answer:* Crisp answer.
⚠️ *Examiner Trap:* Counter-question and defense.

──────────────────────────
❓ *Question 3: [Viva Question]*
🗣️ *Spoken Answer:* Crisp answer.
⚠️ *Examiner Trap:* Counter-question and defense.

──────────────────────────
❓ *Question 4: [Viva Question]*
🗣️ *Spoken Answer:* Crisp answer.
⚠️ *Examiner Trap:* Counter-question and defense.

──────────────────────────
❓ *Question 5: [Viva Question]*
🗣️ *Spoken Answer:* Crisp answer.
⚠️ *Examiner Trap:* Counter-question and defense.`;

      userPrompt = `Subject: ${subject}\n\nSyllabus Content:\n${context}\n\nGenerate the 5 Examiner Viva Questions & Traps now.`;
      break;
  }

  const result = await executeWithGeminiPool(async (client) => {
    return client.models.generateContent({
      model,
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
      ],
      config: {
        temperature: 0.25,
        maxOutputTokens: 3200,
      },
    });
  });

  const rawGeneratedText = result.text?.trim() || "";
  if (!rawGeneratedText) {
    return "⚠️ Generation failed. Please try again or open the web dashboard.";
  }

  return cleanTelegramOutput(rawGeneratedText);
}

/**
 * Robust sanitizer for Telegram bot output:
 * 1. Replaces LaTeX fractions and symbols with clean Unicode math.
 * 2. Unpacks LaTeX \\text{} and removes dollar signs ($...$).
 * 3. Strips prompt instructions that might leak into generation.
 * 4. Ensures raw formulas are enclosed in monospace code spans.
 * 5. Balances unmatched Markdown backticks so Telegram never rejects parse_mode.
 */
export function cleanTelegramOutput(rawText: string): string {
  let text = rawText;

  // 1. Strip leaked prompt instructions
  text = text.replace(/List\s+\d+[-–]\d+\s+critical\s+formulas[^\n]*\n?/gi, "");
  text = text.replace(/List\s+\d+[-–]\d+\s+definitions[^\n]*\n?/gi, "");
  text = text.replace(/For each:[^\n]*\n?/gi, "");
  text = text.replace(/\[(?:Generate|Provide)\s+\d+[-–]\d+\s+[^\]\n]+\]\n?/gi, "");
  text = text.replace(/\(Provide\s+\d+[-–]\d+\s+[^\n)]+\)\n?/gi, "");
  text = text.replace(/Walk through the #1 most frequently asked[^\n]*\n?/gi, "");
  text = text.replace(/Rank the top \d+ modules[^\n]*\n?/gi, "");

  // 2. Helper to replace \\frac{num}{den} recursively using brace counting
  function replaceFrac(str: string): string {
    let res = str;
    let idx = res.indexOf("\\frac{");
    while (idx !== -1) {
      let depth = 0;
      let numEnd = -1;
      for (let i = idx + 5; i < res.length; i++) {
        if (res[i] === "{") depth++;
        else if (res[i] === "}") {
          depth--;
          if (depth === 0) {
            numEnd = i;
            break;
          }
        }
      }
      if (numEnd !== -1 && res[numEnd + 1] === "{") {
        let denEnd = -1;
        depth = 0;
        for (let j = numEnd + 1; j < res.length; j++) {
          if (res[j] === "{") depth++;
          else if (res[j] === "}") {
            depth--;
            if (depth === 0) {
              denEnd = j;
              break;
            }
          }
        }
        if (denEnd !== -1) {
          const num = res.slice(idx + 6, numEnd);
          const den = res.slice(numEnd + 2, denEnd);
          res = res.slice(0, idx) + `(${num}) / (${den})` + res.slice(denEnd + 1);
          idx = res.indexOf("\\frac{");
          continue;
        }
      }
      idx = res.indexOf("\\frac{", idx + 1);
    }
    return res;
  }

  text = replaceFrac(text);

  // 3. Unpack \\text{...}
  for (let i = 0; i < 3; i++) {
    text = text.replace(/\\text\{([^{}]+)\}/g, "$1");
  }

  // 4. Unpack remaining single subscript braces e.g. T{words} -> T(words) or 16{10} -> 16
  text = text.replace(/([a-zA-Z0-9])\{([^{}]+)\}/g, "$1($2)");
  text = text.replace(/\{([^{}]+)\}/g, "$1");

  // 5. Convert LaTeX math symbols to clean Unicode
  text = text.replace(/\\times/g, "×");
  text = text.replace(/\\cdot/g, "·");
  text = text.replace(/\\pm/g, "±");
  text = text.replace(/\\approx/g, "≈");
  text = text.replace(/\\le(q)?\b/g, "≤");
  text = text.replace(/\\ge(q)?\b/g, "≥");
  text = text.replace(/\\ne(q)?\b/g, "≠");
  text = text.replace(/\\to\b/g, "→");
  text = text.replace(/\\rightarrow\b/g, "→");
  text = text.replace(/\\infty\b/g, "∞");
  text = text.replace(/\\ll\b/g, "<<");
  text = text.replace(/\\gg\b/g, ">>");
  text = text.replace(/\\log_?2\b/g, "log₂");

  // 6. Subscripts: T_c -> Tc, H_1 -> H1
  text = text.replace(/([A-Za-z])_([A-Za-z0-9])/g, "$1$2");

  // 7. Strip LaTeX dollar signs
  text = text.replace(/\$([^\$\n]+)\$/g, "$1");
  text = text.replace(/\$/g, "");

  // 8. Balance backticks and wrap bare formula lines in monospace code blocks
  const lines = text.split("\n");
  const cleanedLines = lines.map((line) => {
    let trimmed = line.trim();

    // Fix unclosed / mismatched backticks
    const backtickCount = (trimmed.match(/`/g) || []).length;
    if (backtickCount % 2 !== 0) {
      trimmed = trimmed.endsWith("`") ? trimmed.slice(0, -1) : `${trimmed}\``;
    }

    // Wrap bare formula lines that aren't already wrapped in `...`
    if (
      trimmed.includes(" = ") &&
      !trimmed.startsWith("•") &&
      !trimmed.startsWith("└") &&
      !trimmed.startsWith("`") &&
      !trimmed.startsWith("*") &&
      (trimmed.includes("×") || trimmed.includes("/") || trimmed.includes("+") || trimmed.includes("^") || trimmed.includes("<<"))
    ) {
      return `  \`${trimmed}\``;
    }

    return line.startsWith("  ") ? `  ${trimmed}` : trimmed;
  });

  text = cleanedLines.join("\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}
