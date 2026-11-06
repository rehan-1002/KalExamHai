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
      systemPrompt = `You are a strict, veteran Mumbai University engineering professor creating a High-Yield Formula & Exam Cheat Sheet.
Format cleanly with distinct sections, emojis, and clear line breaks.

━━━━━━━━━━━━━━━━━━━━━━━━━━
📑 *HIGH-YIELD FORMULA & CHEAT SHEET*
*Subject:* ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 *1. CORE FORMULAS & EQUATIONS*
List 6-8 critical formulas. For each:
• *Formula Name:*
  \`[LaTeX Formula]\`
  └─ Explanation & Variable Units

━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 *2. KEY EXAM DEFINITIONS*
List 4-5 definitions that MU evaluators strictly check for keywords:
• *[Term]:* Definition with key concepts highlighted.

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ *3. STEP-BY-STEP ALGORITHM / DERIVATION*
Walk through the #1 most frequently asked algorithm or derivation:
1. Step 1...
2. Step 2...
3. Step 3...

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *4. EXAM HALL TRAPS & COMMON BLUNDERS*
• *Trap 1:* Where students lose easy marks.
• *Trap 2:* Common formula misconception.
• *Trap 3:* Boundary condition errors.`;

      userPrompt = `Subject: ${subject}\n\nSyllabus Content:\n${context}\n\nGenerate the High-Yield Formula Notes now.`;
      break;

    case "survival":
      systemPrompt = `You are an expert Mumbai University academic coach creating a 12-Hour Last-Minute Panic Survival Kit.

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
Rank the top 4 modules carrying 60%+ marks:
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

━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤 *EXAMINER VIVA QUESTIONS & TRAPS*
*Subject:* ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━

For each question use this exact structure:

❓ *Question 1: [Viva Question]*
🗣️ *Spoken Answer:* The exact 2-sentence crisp answer to say aloud.
⚠️ *Examiner Trap:* The trick counter-question the professor will ask, and how to defend it.

──────────────────────────
❓ *Question 2: [Viva Question]*
...`;

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

  return result.text?.trim() || "⚠️ Generation failed. Please try again or open the web dashboard.";
}
