import "server-only";

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface SendMessageOptions {
  parse_mode?: "Markdown" | "HTML";
  reply_markup?: InlineKeyboardMarkup;
  disable_web_page_preview?: boolean;
}

function getBotToken(): string {
  const token =
    process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    "9104065578:AAFTBMA842Y4W6dfg7XPzOiRvgeKSP_vunE";
  return token;
}

/**
 * Sends a chat action (e.g. 'typing', 'upload_document') to let the user know the bot is working.
 */
export async function sendChatAction(
  chatId: number | string,
  action: "typing" | "upload_document" = "typing"
): Promise<void> {
  const token = getBotToken();
  try {
    await fetch(`${TELEGRAM_API_BASE}${token}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
  } catch {
    // Ignore transient chat action failures
  }
}

/**
 * Answers a Telegram callback query to dismiss the loading clock icon on the button.
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  const token = getBotToken();
  try {
    await fetch(`${TELEGRAM_API_BASE}${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: false,
      }),
    });
  } catch {
    // Ignore callback query response errors
  }
}

/**
 * Sends a message to a Telegram chat. If the text exceeds 4000 characters,
 * cleanly splits it into multiple messages to respect Telegram's 4096-char limit.
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options: SendMessageOptions = {}
): Promise<{ ok: boolean; messageId?: number }> {
  const token = getBotToken();
  const maxLen = 3900;

  if (text.length <= maxLen) {
    const res = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options.parse_mode ?? "Markdown",
        reply_markup: options.reply_markup,
        disable_web_page_preview: options.disable_web_page_preview ?? true,
      }),
    });

    const json = (await res.json()) as { ok: boolean; result?: { message_id: number }; description?: string };
    if (!json.ok) {
      // Fallback: if Markdown parsing failed, try sending as plain text
      if (options.parse_mode === "Markdown") {
        const fallbackRes = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            reply_markup: options.reply_markup,
            disable_web_page_preview: true,
          }),
        });
        const fallbackJson = (await fallbackRes.json()) as { ok: boolean; result?: { message_id: number } };
        return { ok: fallbackJson.ok, messageId: fallbackJson.result?.message_id };
      }
    }
    return { ok: json.ok, messageId: json.result?.message_id };
  }

  // Split into chunks if longer than 3900 characters
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Find last newline before maxLen
    let splitIndex = remaining.lastIndexOf("\n\n", maxLen);
    if (splitIndex === -1 || splitIndex < 1500) {
      splitIndex = remaining.lastIndexOf("\n", maxLen);
    }
    if (splitIndex === -1 || splitIndex < 1500) {
      splitIndex = maxLen;
    }
    chunks.push(remaining.slice(0, splitIndex).trim());
    remaining = remaining.slice(splitIndex).trim();
  }

  let lastMessageId: number | undefined;
  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;
    const chunkOptions: SendMessageOptions = {
      parse_mode: options.parse_mode ?? "Markdown",
      reply_markup: isLast ? options.reply_markup : undefined,
      disable_web_page_preview: true,
    };
    const res = await sendTelegramMessage(chatId, chunks[i]!, chunkOptions);
    lastMessageId = res.messageId;
  }

  return { ok: true, messageId: lastMessageId };
}

/**
 * Downloads a document or photo file buffer directly from Telegram's Bot API.
 */
export async function downloadTelegramFile(fileId: string): Promise<{ buffer: Buffer; filePath: string }> {
  const token = getBotToken();

  // 1. Get file path from Telegram
  const fileRes = await fetch(`${TELEGRAM_API_BASE}${token}/getFile?file_id=${encodeURIComponent(fileId)}`);
  const fileJson = (await fileRes.json()) as { ok: boolean; result?: { file_path: string } };

  if (!fileJson.ok || !fileJson.result?.file_path) {
    throw new Error("Failed to get file metadata from Telegram.");
  }

  const filePath = fileJson.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

  // 2. Fetch the raw file bytes
  const downloadRes = await fetch(downloadUrl);
  if (!downloadRes.ok) {
    throw new Error(`Failed to download file from Telegram: ${downloadRes.statusText}`);
  }

  const arrayBuffer = await downloadRes.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    filePath,
  };
}
