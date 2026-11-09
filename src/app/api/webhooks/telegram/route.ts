import { NextRequest, NextResponse } from "next/server";
import {
  sendTelegramMessage,
  sendChatAction,
  answerCallbackQuery,
  downloadTelegramFile,
  sendTelegramDocument,
} from "@/server/telegram/bot";
import {
  saveTelegramSession,
  getTelegramSession,
  saveTelegramExport,
} from "@/server/telegram/session";
import {
  checkTelegramQuota,
  incrementTelegramQuota,
} from "@/server/telegram/quota";
import {
  generateTelegramArtifact,
  buildRemainingKeyboard,
  ARTIFACT_NAMES,
  type TelegramArtifactType,
} from "@/server/telegram/generator";
import { extractDocumentText } from "@/server/ingestion/extract-text";
import {
  BRANCHES,
  getBranchSubjects,
  formatSubjectSyllabusText,
} from "@/data/mu-syllabus";
import { findMuQuestionPapers } from "@/data/mu-pyqs";

export const maxDuration = 60; // Allow sufficient time for Gemini LLM generation on Vercel

const ALL_ARTIFACT_KEYS: TelegramArtifactType[] = [
  "paper60",
  "iat",
  "formula",
  "survival",
  "viva",
];

export async function GET() {
  return NextResponse.json({ ok: true, service: "KalExamHai Telegram Webhook" });
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // 1. Handle Inline Button Callback Clicks
    if (update.callback_query) {
      const cb = update.callback_query;
      const data = (cb.data as string) || "";
      const chatId = cb.message?.chat?.id;

      if (!chatId) {
        if (cb.id) await answerCallbackQuery(cb.id);
        return NextResponse.json({ ok: true });
      }

      // Handle Subject Catalog Browsing Callbacks
      if (data.startsWith("br:")) {
        if (cb.id) await answerCallbackQuery(cb.id);

        if (data === "br:branches") {
          const inline_keyboard = [
            [
              { text: "💻 Comps", callback_data: "br:b:comps" },
              { text: "🌐 IT", callback_data: "br:b:it" },
            ],
            [
              { text: "📊 AIDS", callback_data: "br:b:aids" },
              { text: "🤖 AIML", callback_data: "br:b:aiml" },
            ],
            [
              { text: "⚙️ Mech", callback_data: "br:b:mech" },
              { text: "⚡ Electrical", callback_data: "br:b:electrical" },
            ],
            [
              { text: "🏗️ Civil", callback_data: "br:b:civil" },
              { text: "📐 FE (All Branches)", callback_data: "br:b:fe" },
            ],
          ];
          await sendTelegramMessage(
            chatId,
            "🏛️ *Mumbai University (NEP-2020) Directory*\n\nSelect your engineering branch to pick subjects with verified 6-module syllabus without uploading any PDF:",
            { reply_markup: { inline_keyboard } }
          );
          return NextResponse.json({ ok: true });
        }

        if (data.startsWith("br:b:")) {
          const branchId = data.split(":")[2] || "";
          const branch = BRANCHES.find((b) => b.id === branchId);
          if (!branch) return NextResponse.json({ ok: true });

          const semButtons = branch.semesters.map((s) => ({
            text: `Semester ${s}`,
            callback_data: `br:s:${branchId}:${s}`,
          }));

          const inline_keyboard: { text: string; callback_data: string }[][] = [];
          for (let i = 0; i < semButtons.length; i += 2) {
            inline_keyboard.push(semButtons.slice(i, i + 2));
          }
          inline_keyboard.push([{ text: "« Back to Branches", callback_data: "br:branches" }]);

          await sendTelegramMessage(
            chatId,
            `${branch.icon} *${branch.name}*\nSelect your semester:`,
            { reply_markup: { inline_keyboard } }
          );
          return NextResponse.json({ ok: true });
        }

        if (data.startsWith("br:s:")) {
          const [, , branchId, semStr] = data.split(":");
          const sem = parseInt(semStr || "1", 10);
          const branch = BRANCHES.find((b) => b.id === branchId);
          const subjects = await getBranchSubjects(branchId || "", sem);

          const inline_keyboard: { text: string; callback_data: string }[][] = [];
          for (let i = 0; i < subjects.length; i += 2) {
            const row = [
              {
                text: subjects[i]!.shortName || subjects[i]!.name.slice(0, 16),
                callback_data: `br:sub:${branchId}:${subjects[i]!.code}`,
              },
            ];
            if (subjects[i + 1]) {
              row.push({
                text: subjects[i + 1]!.shortName || subjects[i + 1]!.name.slice(0, 16),
                callback_data: `br:sub:${branchId}:${subjects[i + 1]!.code}`,
              });
            }
            inline_keyboard.push(row);
          }
          inline_keyboard.push([
            { text: `« Back to ${branch?.shortName || "Branch"}`, callback_data: `br:b:${branchId}` },
          ]);

          await sendTelegramMessage(
            chatId,
            `📚 *${branch?.name} — Semester ${sem}*\nSelect a core theory subject:`,
            { reply_markup: { inline_keyboard } }
          );
          return NextResponse.json({ ok: true });
        }

        if (data.startsWith("br:sub:")) {
          const [, , branchId, code] = data.split(":");
          const subjects = await getBranchSubjects(branchId || "");
          const sub = subjects.find((s) => s.code === code);
          if (!sub) return NextResponse.json({ ok: true });

          const sessionId = `${chatId}_${Date.now()}`;
          const syllabusText = formatSubjectSyllabusText(sub);

          await saveTelegramSession(sessionId, {
            chatId,
            fileName: `${sub.shortName} (${sub.code}) Official NEP-2020`,
            subject: sub.name,
            text: syllabusText,
          });

          const keyboard = buildRemainingKeyboard(ALL_ARTIFACT_KEYS, sessionId);

          await sendTelegramMessage(
            chatId,
            `✅ *Loaded: ${sub.name} (${sub.code})*\nSemester ${sub.semester} • NEP-2020 Scheme\n\nAll 6 official modules loaded! What would you like me to generate for tomorrow's exam?`,
            { reply_markup: keyboard }
          );
          return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ ok: true });
      }

      // Handle Past Question Paper (PYQ) Callbacks
      if (data.startsWith("pyq:")) {
        if (cb.id) await answerCallbackQuery(cb.id);

        if (data === "pyq:branches") {
          const inline_keyboard = [
            [
              { text: "💻 Comps", callback_data: "pyq:b:comps" },
              { text: "🌐 IT", callback_data: "pyq:b:it" },
            ],
            [
              { text: "📊 AIDS", callback_data: "pyq:b:aids" },
              { text: "🤖 AIML", callback_data: "pyq:b:aiml" },
            ],
            [
              { text: "⚙️ Mech", callback_data: "pyq:b:mech" },
              { text: "⚡ Electrical", callback_data: "pyq:b:electrical" },
            ],
            [
              { text: "🏗️ Civil", callback_data: "pyq:b:civil" },
              { text: "📐 FE (All Branches)", callback_data: "pyq:b:fe" },
            ],
          ];
          await sendTelegramMessage(
            chatId,
            "📚 *Mumbai University Past Exam Question Papers (PYQs)*\n\nOfficial MU semester question papers (NEP-2020 & C-Scheme):\nSelect your branch:",
            { reply_markup: { inline_keyboard } }
          );
          return NextResponse.json({ ok: true });
        }

        if (data.startsWith("pyq:b:")) {
          const branchId = data.split(":")[2] || "";
          const branch = BRANCHES.find((b) => b.id === branchId);
          if (!branch) return NextResponse.json({ ok: true });

          const semButtons = branch.semesters.map((s) => ({
            text: `Semester ${s}`,
            callback_data: `pyq:s:${branchId}:${s}`,
          }));

          const inline_keyboard: { text: string; callback_data: string }[][] = [];
          for (let i = 0; i < semButtons.length; i += 2) {
            inline_keyboard.push(semButtons.slice(i, i + 2));
          }
          inline_keyboard.push([{ text: "« Back to Branches", callback_data: "pyq:branches" }]);

          await sendTelegramMessage(
            chatId,
            `${branch.icon} *${branch.name} — PYQs*\nSelect your semester to get official PDF question papers:`,
            { reply_markup: { inline_keyboard } }
          );
          return NextResponse.json({ ok: true });
        }

        // Step 3: pyq:s:<branchId>:<sem> -> Select official subject (Branch & Sem-wise)
        if (data.startsWith("pyq:s:")) {
          const [, , branchId, semStr] = data.split(":");
          const sem = parseInt(semStr || "1", 10);
          const branch = BRANCHES.find((b) => b.id === branchId);
          const subjects = await getBranchSubjects(branchId || "", sem);

          if (!subjects || subjects.length === 0) {
            await sendTelegramMessage(
              chatId,
              `⚠️ No subjects registered for ${branch?.name || branchId} Semester ${sem}.`,
              {
                reply_markup: {
                  inline_keyboard: [[{ text: "« Back to Semesters", callback_data: `pyq:b:${branchId}` }]],
                },
              }
            );
            return NextResponse.json({ ok: true });
          }

          const inline_keyboard: { text: string; callback_data: string }[][] = [];
          for (let i = 0; i < subjects.length; i += 2) {
            const row = [
              {
                text: `${branch?.icon || "📖"} ${subjects[i]!.shortName || subjects[i]!.name.slice(0, 16)}`,
                callback_data: `pyq:sub:${branchId}:${sem}:${subjects[i]!.code}`,
              },
            ];
            if (subjects[i + 1]) {
              row.push({
                text: `${branch?.icon || "📖"} ${subjects[i + 1]!.shortName || subjects[i + 1]!.name.slice(0, 16)}`,
                callback_data: `pyq:sub:${branchId}:${sem}:${subjects[i + 1]!.code}`,
              });
            }
            inline_keyboard.push(row);
          }
          inline_keyboard.push([
            { text: `« Back to ${branch?.shortName || "Branch"} Semesters`, callback_data: `pyq:b:${branchId}` },
            { text: "« All Branches", callback_data: "pyq:branches" },
          ]);

          await sendTelegramMessage(
            chatId,
            `📚 *${branch?.name} — Semester ${sem} PYQs*\n\nSelect your subject to access official past question papers:`,
            { reply_markup: { inline_keyboard } }
          );
          return NextResponse.json({ ok: true });
        }

        // Step 4: pyq:sub:<branchId>:<sem>:<code> -> Show exact papers for this subject
        if (data.startsWith("pyq:sub:")) {
          const [, , branchId, semStr, code] = data.split(":");
          const sem = parseInt(semStr || "1", 10);
          const branch = BRANCHES.find((b) => b.id === branchId);
          const subjects = await getBranchSubjects(branchId || "", sem);
          const sub = subjects.find((s) => s.code === code) || subjects[0];
          const subName = sub ? sub.name : code;

          const allSemPapers = await findMuQuestionPapers(branchId || "", sem);

          // Normalized fuzzy subject match
          const norm = (s: string) => s.toLowerCase().replace(/[-–—]/g, " ").replace(/\s+/g, " ").trim();
          const targetNorm = norm(subName || "");
          const targetShort = sub?.shortName ? norm(sub.shortName) : "";

          let matched = allSemPapers.filter((p) => {
            const pNorm = norm(p.subject);
            return (
              pNorm.includes(targetNorm) ||
              targetNorm.includes(pNorm) ||
              (targetShort && pNorm.includes(targetShort))
            );
          });

          // If no fuzzy match, fallback to all papers in that semester
          if (matched.length === 0) {
            matched = allSemPapers;
          }

          // Sort: NEP-2020 first, then by year desc
          matched.sort((a, b) => {
            if (a.isNep && !b.isNep) return -1;
            if (!a.isNep && b.isNep) return 1;
            const yearA = parseInt(a.year || "0", 10) || 0;
            const yearB = parseInt(b.year || "0", 10) || 0;
            return yearB - yearA;
          });

          const topPapers = matched.slice(0, 8);

          if (topPapers.length === 0) {
            await sendTelegramMessage(
              chatId,
              `⚠️ No past question papers found for *${subName}*.`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "« Back to Subjects", callback_data: `pyq:s:${branchId}:${sem}` }],
                  ],
                },
              }
            );
            return NextResponse.json({ ok: true });
          }

          // Build buttons for each paper to deliver directly
          const inline_keyboard: { text: string; callback_data?: string; url?: string }[][] = [];

          topPapers.slice(0, 5).forEach((p) => {
            const nepTag = p.isNep ? "⭐ NEP-2020" : p.scheme || "C-Scheme";
            inline_keyboard.push([
              {
                text: `📄 ${p.session} ${p.year} (${nepTag})`,
                callback_data: `pyq:doc:${branchId}:${sem}:${encodeURIComponent(p.slug.slice(0, 30))}`,
              },
            ]);
          });

          inline_keyboard.push([
            { text: "« Back to Subjects", callback_data: `pyq:s:${branchId}:${sem}` },
            { text: "« Back to Semesters", callback_data: `pyq:b:${branchId}` },
          ]);

          let msg = `📚 *${subName}*\n`;
          msg += `*${branch?.name} — Semester ${sem}*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
          msg += `Tap any exam session below to receive the **official question paper PDF directly here in chat**:\n\n`;

          topPapers.slice(0, 5).forEach((p, i) => {
            const nepTag = p.isNep ? "⭐ *[NEP-2020]*" : `_[${p.scheme || "Rev-2019"}]_`;
            msg += `${i + 1}. **${p.session} ${p.year}** ${nepTag}\n`;
          });

          await sendTelegramMessage(chatId, msg, { reply_markup: { inline_keyboard } });
          return NextResponse.json({ ok: true });
        }

        // Step 5: pyq:doc:<branchId>:<sem>:<slugPrefix> -> Deliver the actual PDF document directly to chat!
        if (data.startsWith("pyq:doc:")) {
          const [, , branchId, semStr, slugPrefixRaw] = data.split(":");
          const sem = parseInt(semStr || "1", 10);
          const slugPrefix = decodeURIComponent(slugPrefixRaw || "");

          const allSemPapers = await findMuQuestionPapers(branchId || "", sem);
          const paper = allSemPapers.find((p) => p.slug.startsWith(slugPrefix)) || allSemPapers[0];

          if (!paper) {
            await sendTelegramMessage(chatId, "⚠️ Could not locate this question paper file.");
            return NextResponse.json({ ok: true });
          }

          await sendChatAction(chatId, "upload_document");

          const caption = `📄 *${paper.subject}*\n${paper.session} ${paper.year} • ${paper.scheme || "Mumbai University"}\nOfficial examination paper from KalExamHai archive.`;

          const docRes = await sendTelegramDocument(chatId, paper.pdfUrl, caption);

          if (!docRes.ok) {
            // Direct KalExamHai download proxy (100% white-labeled, zero competitor redirects)
            const cleanDownloadUrl = `https://kalexamhai-one.vercel.app/api/pyqs/download?url=${encodeURIComponent(paper.pdfUrl)}&filename=${encodeURIComponent(`KalExamHai_${paper.subject.replace(/[^a-zA-Z0-9]/g, "_")}_${paper.session}_${paper.year}.pdf`)}`;
            await sendTelegramMessage(
              chatId,
              `📄 *${paper.subject} (${paper.session} ${paper.year})*\n\n[📥 1-Click Download PDF Document](${cleanDownloadUrl})\n\n_(Official examination paper from KalExamHai archive)_`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "« Back to Papers", callback_data: `pyq:s:${branchId}:${sem}` }],
                    [{ text: "« Back to Semesters", callback_data: `pyq:b:${branchId}` }],
                  ],
                },
              }
            );
          } else {
            await sendTelegramMessage(
              chatId,
              `✅ *Question Paper delivered above!*\n\nReady to prepare for this exam?`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "🏛️ Browse MU Subjects (NEP-2020)", callback_data: "br:branches" }],
                    [{ text: "🌐 Open 3D Workspace on Web", url: "https://kalexamhai-one.vercel.app" }],
                  ],
                },
              }
            );
          }
          return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ ok: true });
      }

      if (!data.startsWith("act:")) {
        if (cb.id) await answerCallbackQuery(cb.id);
        return NextResponse.json({ ok: true });
      }

      await answerCallbackQuery(cb.id, "Generating your exam prep...");

      // Parse callback payload: act:<type>:<remainingKeys>:<sessionId>
      const parts = data.split(":");
      const chosenType = parts[1] as TelegramArtifactType;
      const remainingStr = parts[2] || "";
      const sessionId = parts[3] || "";

      const session = await getTelegramSession(sessionId);
      if (!session) {
        await sendTelegramMessage(
          chatId,
          "⚠️ *Session Timed Out*\n\nDon't worry, you don't have to re-upload! Tap below to pick your subject from our verified MU directory or start fresh in 1 tap:",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🏛️ Pick Subject from MU Directory (Zero-Upload)", callback_data: "br:branches" }],
                [{ text: "📚 Download Official MU PYQs", callback_data: "pyq:branches" }],
                [{ text: "🌐 Open KalExamHai Web Portal", url: "https://kalexamhai-one.vercel.app" }],
              ],
            },
          }
        );
        return NextResponse.json({ ok: true });
      }

      const meta = ARTIFACT_NAMES[chosenType] || { label: "Exam Kit", short: "Exam Kit" };

      // 1. Check daily free Telegram quota (prevents Gemini API exhaustion)
      const quota = await checkTelegramQuota(chatId);
      if (!quota.allowed) {
        await sendTelegramMessage(
          chatId,
          `⏳ *Daily Free Telegram Limit Reached (${quota.used}/${quota.limit} used)*\n\nBhai, you've used your 5 free Telegram generations for today! Your free quota resets tonight at 12:00 AM IST.\n\nWant to continue studying right now without waiting? Open your full 3D student workspace on our web app (100% free):`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🌐 Open KalExamHai Web (100% Free)", url: "https://kalexamhai-one.vercel.app" }],
                [
                  {
                    text: "📤 Share Bot with Classmates",
                    url: "https://t.me/share/url?url=https://t.me/kalexamhai_bot&text=Bhai%20kal%20exam%20hai!%20Check%20out%20this%20free%20AI%20bot%20for%20Mumbai%20University%20papers%20and%20notes",
                  },
                ],
              ],
            },
          }
        );
        return NextResponse.json({ ok: true });
      }

      // Inform user generation started
      await sendChatAction(chatId, "typing");
      await sendTelegramMessage(
        chatId,
        `⏳ *Generating your ${meta.short}...*\nApplying strict Mumbai University NEP-2020 marking scheme.\n_(Daily Quota: ${quota.used + 1}/${quota.limit} today)_`
      );

      // Generate the requested artifact via Gemini
      const { telegramText, webContent } = await generateTelegramArtifact(
        chosenType,
        session.text,
        session.subject
      );

      // Increment daily quota after successful generation
      await incrementTelegramQuota(chatId);

      // Save export for 1-tap A4 Print and Web PDF preview
      const exportId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await saveTelegramExport(exportId, {
        type: chosenType,
        subject: session.subject,
        title: meta.short,
        content: webContent,
      });

      // Send the clean Unicode content to Telegram chat
      await sendTelegramMessage(chatId, telegramText);

      // Parse remaining options (excluding the chosen one)
      const remainingKeys = remainingStr
        .split(",")
        .map((k) => k.trim())
        .filter((k): k is TelegramArtifactType => k in ARTIFACT_NAMES && k !== chosenType);

      if (remainingKeys.length > 0) {
        const keyboard = buildRemainingKeyboard(remainingKeys, sessionId, exportId);
        await sendTelegramMessage(
          chatId,
          `✅ *${meta.short} ready above!*\n\nTap below to print or choose your next prep tool:`,
          { reply_markup: keyboard }
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `🎉 *You've unlocked all study kits for ${session.subject}!*\n\nTap below to print or open your 3D student workspace:`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🖨️ Open & Print Official A4 PDF",
                    url: `https://kalexamhai-one.vercel.app/view/${exportId}`,
                  },
                ],
                [{ text: "🌐 Open Full 3D Workspace on Web (Free)", url: "https://kalexamhai-one.vercel.app" }],
                [
                  {
                    text: "📤 Share Bot with Classmates",
                    url: "https://t.me/share/url?url=https://t.me/kalexamhai_bot&text=Bhai%20kal%20exam%20hai!%20Check%20out%20this%20free%20AI%20bot%20for%20Mumbai%20University%20papers%20and%20notes",
                  },
                ],
              ],
            },
          }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // 2. Handle Messages (Text, Document, Photo)
    const msg = update.message;
    if (!msg) {
      return NextResponse.json({ ok: true });
    }

    const chatId = msg.chat?.id;
    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    const text = (msg.text || "").trim();

    // Case A0: User sent /pyqs or /pyq
    if (
      text.startsWith("/pyq") ||
      text.startsWith("/papers") ||
      text.toLowerCase() === "pyq" ||
      text.toLowerCase() === "pyqs" ||
      text.toLowerCase() === "papers"
    ) {
      const inline_keyboard = [
        [
          { text: "💻 Comps", callback_data: "pyq:b:comps" },
          { text: "🌐 IT", callback_data: "pyq:b:it" },
        ],
        [
          { text: "📊 AIDS", callback_data: "pyq:b:aids" },
          { text: "🤖 AIML", callback_data: "pyq:b:aiml" },
        ],
        [
          { text: "⚙️ Mech", callback_data: "pyq:b:mech" },
          { text: "⚡ Electrical", callback_data: "pyq:b:electrical" },
        ],
        [
          { text: "🏗️ Civil", callback_data: "pyq:b:civil" },
          { text: "📐 FE (All Branches)", callback_data: "pyq:b:fe" },
        ],
      ];
      await sendTelegramMessage(
        chatId,
        "📚 *Mumbai University Past Exam Question Papers (PYQs)*\n\nOfficial MU semester question papers (NEP-2020 & C-Scheme):\nSelect your branch:",
        { reply_markup: { inline_keyboard } }
      );
      return NextResponse.json({ ok: true });
    }

    // Case A1: User sent /subjects or /browse
    if (
      text.startsWith("/subjects") ||
      text.startsWith("/browse") ||
      text.startsWith("/syllabus")
    ) {
      const inline_keyboard = [
        [
          { text: "💻 Comps", callback_data: "br:b:comps" },
          { text: "🌐 IT", callback_data: "br:b:it" },
        ],
        [
          { text: "📊 AIDS", callback_data: "br:b:aids" },
          { text: "🤖 AIML", callback_data: "br:b:aiml" },
        ],
        [
          { text: "⚙️ Mech", callback_data: "br:b:mech" },
          { text: "⚡ Electrical", callback_data: "br:b:electrical" },
        ],
        [
          { text: "🏗️ Civil", callback_data: "br:b:civil" },
          { text: "📐 FE (All Branches)", callback_data: "br:b:fe" },
        ],
      ];
      await sendTelegramMessage(
        chatId,
        "🏛️ *Mumbai University (NEP-2020) Directory*\n\nSelect your engineering branch to pick subjects with verified 6-module syllabus without uploading any PDF:",
        { reply_markup: { inline_keyboard } }
      );
      return NextResponse.json({ ok: true });
    }

    // Case A: User sent /start or Greeting
    if (
      text.startsWith("/start") ||
      text.toLowerCase() === "hi" ||
      text.toLowerCase() === "hello" ||
      text.toLowerCase() === "hey"
    ) {
      const welcomeText = `🎓 *Welcome to KalExamHai — Mumbai University Exam SOS!*

Stressed about tomorrow's paper? Don't worry, we've got you covered.

Choose one of two ways to generate your exam prep:
1️⃣ *Tap "Browse Official MU Subjects"* below to choose from verified NEP-2020 syllabi (Zero-Upload!)
2️⃣ *Or drop your own Syllabus PDF, notes, or question photo* right here in the chat.

I can generate:
• 📝 *60-Mark NEP-2020 Question Paper* (with step-by-step marking schemes)
• ⚡ *20-Mark IAT Internal Paper*
• 📑 *High-Yield Formula Cheat Sheet*
• 🎯 *12-Hour Panic Survival Kit* (expected marks & must-draw diagrams)
• 🎤 *Examiner Viva Questions & Traps*

👇 *Choose an option or drop your notes below:*`;

      await sendTelegramMessage(chatId, welcomeText, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🏛️ Browse MU Subjects (NEP-2020)", callback_data: "br:branches" }],
            [{ text: "📥 Download Official MU PYQs", callback_data: "pyq:branches" }],
            [{ text: "🌐 Open KalExamHai Web Portal", url: "https://kalexamhai-one.vercel.app" }],
          ],
        },
      });
      return NextResponse.json({ ok: true });
    }

    // Case B: User uploaded a Document (PDF, doc, txt)
    if (msg.document) {
      const doc = msg.document;
      const fileName = doc.file_name || "Syllabus_Document.pdf";
      const mimeType = doc.mime_type || "application/pdf";

      await sendChatAction(chatId, "upload_document");
      await sendTelegramMessage(
        chatId,
        `📥 *Reading ${fileName}...*\nExtracting syllabus units & modules.`
      );

      const { buffer } = await downloadTelegramFile(doc.file_id);
      const extracted = await extractDocumentText(buffer, mimeType, fileName);

      if (!extracted.text || extracted.text.length < 50) {
        await sendTelegramMessage(
          chatId,
          "⚠️ Could not extract readable text from this file. Please make sure it's not password-protected, or send a clear photo instead!"
        );
        return NextResponse.json({ ok: true });
      }

      const sessionId = `${chatId}_${Date.now()}`;
      const subject = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      await saveTelegramSession(sessionId, {
        chatId,
        fileName,
        subject,
        text: extracted.text,
      });

      const keyboard = buildRemainingKeyboard(ALL_ARTIFACT_KEYS, sessionId);

      await sendTelegramMessage(
        chatId,
        `✅ *${fileName} received & analyzed!*\n\nWhat would you like me to generate for tomorrow's exam?`,
        { reply_markup: keyboard }
      );

      return NextResponse.json({ ok: true });
    }

    // Case C: User sent a Photo (e.g. textbook page, question photo)
    if (msg.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
      // Pick highest resolution photo
      const photo = msg.photo[msg.photo.length - 1]!;
      await sendChatAction(chatId, "typing");
      await sendTelegramMessage(
        chatId,
        "📷 *Analyzing your photo with Gemini Vision OCR...*"
      );

      const { buffer } = await downloadTelegramFile(photo.file_id);
      const extracted = await extractDocumentText(buffer, "image/jpeg", "Photo_Note.jpg");

      if (!extracted.text || extracted.text.length < 20) {
        await sendTelegramMessage(
          chatId,
          "⚠️ Could not read text clearly from the photo. Please try sending a clearer, well-lit photo!"
        );
        return NextResponse.json({ ok: true });
      }

      const sessionId = `${chatId}_${Date.now()}`;
      await saveTelegramSession(sessionId, {
        chatId,
        fileName: "Exam Photo Notes",
        subject: "Exam Topic",
        text: extracted.text,
      });

      const keyboard = buildRemainingKeyboard(ALL_ARTIFACT_KEYS, sessionId);

      await sendTelegramMessage(
        chatId,
        `✅ *Text extracted from your photo!*\n\nWhat would you like me to generate?`,
        { reply_markup: keyboard }
      );

      return NextResponse.json({ ok: true });
    }

    // Case D: User sent raw text (e.g. topic name, pasted questions or syllabus)
    if (text.length > 10) {
      await sendChatAction(chatId, "typing");

      const sessionId = `${chatId}_${Date.now()}`;
      const subject = text.slice(0, 40).replace(/\n/g, " ");

      await saveTelegramSession(sessionId, {
        chatId,
        fileName: subject,
        subject,
        text,
      });

      const keyboard = buildRemainingKeyboard(ALL_ARTIFACT_KEYS, sessionId);

      await sendTelegramMessage(
        chatId,
        `✅ *Topic received: "${subject}"*\n\nSelect what you want to generate:`,
        { reply_markup: keyboard }
      );

      return NextResponse.json({ ok: true });
    }

    // Fallback: short unrecognized text
    await sendTelegramMessage(
      chatId,
      "⚡ *What would you like to prepare for tomorrow?*\n\nChoose an option below or send your notes/syllabus:",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🏛️ Pick Subject from MU Directory (Zero-Upload)", callback_data: "br:branches" }],
            [{ text: "📚 Download Official MU PYQs", callback_data: "pyq:branches" }],
            [{ text: "🌐 Open KalExamHai Web Portal", url: "https://kalexamhai-one.vercel.app" }],
          ],
        },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 OK so Telegram doesn't retry spam
  }
}

