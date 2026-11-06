import { NextRequest, NextResponse } from "next/server";
import {
  sendTelegramMessage,
  sendChatAction,
  answerCallbackQuery,
  downloadTelegramFile,
} from "@/server/telegram/bot";
import {
  saveTelegramSession,
  getTelegramSession,
  saveTelegramExport,
} from "@/server/telegram/session";
import {
  generateTelegramArtifact,
  buildRemainingKeyboard,
  ARTIFACT_NAMES,
  type TelegramArtifactType,
} from "@/server/telegram/generator";
import { extractDocumentText } from "@/server/ingestion/extract-text";

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

      if (!chatId || !data.startsWith("act:")) {
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
          "⚠️ Your previous session expired or was not found.\n\nPlease drop your syllabus PDF or notes again to generate!",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🌐 Open KalExamHai Web", url: "https://kalexamhai-one.vercel.app" }],
              ],
            },
          }
        );
        return NextResponse.json({ ok: true });
      }

      const meta = ARTIFACT_NAMES[chosenType] || { label: "Exam Kit", short: "Exam Kit" };

      // Inform user generation started
      await sendChatAction(chatId, "typing");
      await sendTelegramMessage(
        chatId,
        `⏳ *Generating your ${meta.short}...*\nApplying strict Mumbai University NEP-2020 marking scheme.`
      );

      // Generate the requested artifact via Gemini
      const generatedContent = await generateTelegramArtifact(
        chosenType,
        session.text,
        session.subject
      );

      // Save export for 1-tap A4 Print and Web PDF preview
      const exportId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await saveTelegramExport(exportId, {
        type: chosenType,
        subject: session.subject,
        title: meta.short,
        content: generatedContent,
      });

      // Send the generated content to chat
      await sendTelegramMessage(chatId, generatedContent);

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

    // Case A: User sent /start or Greeting
    if (
      text.startsWith("/start") ||
      text.toLowerCase() === "hi" ||
      text.toLowerCase() === "hello" ||
      text.toLowerCase() === "hey"
    ) {
      const welcomeText = `🎓 *Welcome to KalExamHai — Mumbai University Exam SOS!*

Stressed about tomorrow's paper? Don't worry, we've got you covered.

📎 *Just send me your Syllabus PDF, Lecture Notes, or a Question Photo*, and I will generate:

• 📝 *60-Mark NEP-2020 Question Paper* (with step-by-step marking schemes)
• ⚡ *20-Mark IAT Internal Paper*
• 📑 *High-Yield Formula Cheat Sheet*
• 🎯 *12-Hour Panic Survival Kit* (expected marks & must-draw diagrams)
• 🎤 *Examiner Viva Questions & Traps*

👇 *Drop your PDF or photo below to get started!*`;

      await sendTelegramMessage(chatId, welcomeText, {
        reply_markup: {
          inline_keyboard: [
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
      "📎 *Send me your Syllabus PDF, Notes, or take a photo of a question*, and I will generate your 60-mark paper, formula sheet, and viva prep!",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🌐 Open KalExamHai Web", url: "https://kalexamhai-one.vercel.app" }],
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

