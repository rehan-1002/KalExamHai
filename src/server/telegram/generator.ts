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
 * Excludes the current option and appends the Web App & Share buttons.
 */
export function buildRemainingKeyboard(
  remainingKeys: TelegramArtifactType[],
  sessionId: string
) {
  const keyboardRows: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [];

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

  // Always append web app link and share button
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
 * Generates an artifact via Gemini with Mumbai University NEP-2020 strict rules.
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
    case "formula":
      systemPrompt = `You are a strict, veteran Mumbai University engineering professor creating a High-Yield Formula & Cheat Sheet for a student taking an exam tomorrow morning.
Format your output cleanly in Telegram Markdown with bold headings, emojis, and bullet points.
Include:
1. 📌 **CORE FORMULAS & NUMERICAL EQUATIONS**: List the 6-8 most critical formulas with variable meanings and units.
2. 📖 **KEY EXAM DEFINITIONS**: 4-5 definitions that external evaluators look for, with expected keywords.
3. ⚙️ **STEP-BY-STEP ALGORITHM / DERIVATION**: Walk through the 1 most commonly asked algorithm or derivation step-by-step.
4. ⚠️ **EXAM HALL TRAPS**: 3 deadly blunders where MU students lose marks (e.g. wrong assumptions, missing base cases).`;
      userPrompt = `Subject: ${subject}\n\nSyllabus Content:\n${context}\n\nGenerate the High-Yield Formula & Exam Cheat Sheet now.`;
      break;

    case "survival":
      systemPrompt = `You are an expert Mumbai University academic coach creating a 12-Hour Last-Minute Panic Survival Kit for a student who only has tonight to prepare.
Format your output cleanly in Telegram Markdown with emojis and bold sections.
Include:
1. ⏳ **PANIC TIMELINE ROADMAP**: Hour-by-hour action plan (Hour 1-4, Hour 5-8, Morning Train Revision).
2. 🏆 **HIGH-YIELD TOPICS RANKED BY EXPECTED MARKS**: The top 4 topics that carry 60%+ of the total marks with module attribution.
3. ✏️ **MUST-DRAW DIAGRAMS**: Exactly which 3 block diagrams or circuit diagrams MUST be drawn for easy marks.
4. 🎯 **PASS-MARK GUARANTEE CHECKLIST**: 5 specific concepts to memorize right now to comfortably clear the passing cutoff (24/60 or 32/80).`;
      userPrompt = `Subject: ${subject}\n\nSyllabus Content:\n${context}\n\nGenerate the 12-Hour Exam Survival Kit now.`;
      break;

    case "paper60":
      systemPrompt = `You are the Chief Examination Moderator for Mumbai University Engineering (NEP-2020 Pattern).
Generate a strict 60-Marks, 2-Hour Question Paper based on the syllabus.
Structure:
• Maximum Marks: 60 | Duration: 2 Hours | NEP-2020 Pattern
• **SECTION 1** (10 Marks): 5 compulsory short conceptual questions (2 Marks each).
• **SECTION 2** (20 Marks): Solve any 2 out of 3 comprehensive questions (10 Marks each, with internal 5M+5M sub-questions).
• **SECTION 3** (15 Marks): Solve any 1 out of 2 detailed numerical / derivation questions (15 Marks).
• **SECTION 4** (15 Marks): Solve any 1 out of 2 design / real-world application questions (15 Marks).
For each question, indicate [Marks] and the Module Name.`;
      userPrompt = `Subject: ${subject}\n\nSyllabus Content:\n${context}\n\nGenerate the complete 60-Mark NEP-2020 Question Paper now.`;
      break;

    case "iat":
      systemPrompt = `You are a Mumbai University engineering professor designing a 20-Marks, 1-Hour Internal Assessment Test (IAT) paper following the official MU scheme.
Structure:
• Maximum Marks: 20 | Duration: 1 Hour
• **Q.1 Compulsory** (4 Marks): Solve any 2 out of 3 conceptual questions (2 Marks each).
• **Q.2** (8 Marks): Detailed question with internal sub-parts (solve any 1 out of 2).
• **Q.3** (8 Marks): Numerical or application question (solve any 1 out of 2).
Indicate [Marks] and [Module] for each.`;
      userPrompt = `Subject: ${subject}\n\nSyllabus Content:\n${context}\n\nGenerate the 20-Mark IAT Paper now.`;
      break;

    case "viva":
      systemPrompt = `You are a tough, experienced external viva examiner visiting a Mumbai University college.
Generate 5 high-frequency oral viva questions based on the syllabus.
For each question provide:
1. ❓ **The Examiner Question** (Conceptual or tricky)
2. 🗣️ **What to Say (Spoken Answer)**: The exact 2-sentence crisp answer the professor wants to hear.
3. ⚠️ **The Examiner Trap**: The counter-question the professor will ask if you hesitate, and how to defend it.`;
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
        maxOutputTokens: 3000,
      },
    });
  });

  return result.text?.trim() || "⚠️ Generation failed. Please try again or open the web dashboard.";
}
