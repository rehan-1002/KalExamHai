import "server-only";
import { executeWithGeminiPool, getGenerationModel } from "../gemini/client";

export interface PageContent {
  pageNumber: number;
  text: string;
}

export interface ExtractedDocument {
  text: string;
  pages: PageContent[];
  pageCount: number;
  extractionQuality: number; // 0.00 to 1.00
}

/**
 * Normalizes raw text: removes control characters (except newlines), collapses
 * excessive vertical whitespace, strips repeated boilerplate headers/footers (D-11),
 * and trims lines while preserving math symbols and numbers.
 */
export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/[ \t]+/g, " ")
    // Edge case D-11: Strip repeated margin headers and page number lines
    .replace(/(?:^|\n)\s*(?:Page\s+\d+(?:\s+of\s+\d+)?|\d+\s+of\s+\d+)\s*(?=\n|$)/gi, "\n")
    .replace(/(?:^|\n)\s*(?:University\s+of\s+Mumbai|Mumbai\s+University)\s*[-•|]?\s*(?:NEP|Answer\s+Book|Syllabus)?[\s\S]{0,60}?(?:Page\s+\d+|\n)/gi, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Pure JavaScript PDF text extraction using pdfjs-dist legacy build.
 * Zero native C++ addons, zero canvas dependencies, zero segmentation faults on Vercel Linux.
 */
async function extractPdfWithPdfJs(
  buffer: Buffer
): Promise<{ text: string; pages: PageContent[]; pageCount: number }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    isEvalSupported: false,
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  const pages: PageContent[] = [];
  let fullText = "";

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();

    const cleaned = normalizeText(pageText);
    pages.push({
      pageNumber: pageNum,
      text: cleaned,
    });
    fullText += (fullText ? "\n\n" : "") + cleaned;
  }

  return {
    text: fullText,
    pages,
    pageCount: Math.max(1, numPages),
  };
}

/**
 * Extracts text from PDF, Images (JPG, PNG, WebP), TXT, or Markdown buffers.
 */
export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ExtractedDocument> {
  const lowerName = filename.toLowerCase();
  const lowerMime = (mimeType || "").toLowerCase();

  const isImage =
    lowerMime.startsWith("image/") ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".webp");

  if (isImage) {
    const resolvedMime = lowerMime.startsWith("image/")
      ? lowerMime
      : lowerName.endsWith(".png")
      ? "image/png"
      : lowerName.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";

    const ocrText = await extractMediaViaGeminiOcr(buffer, resolvedMime, filename);
    if (!ocrText || ocrText.trim().length === 0) {
      throw new Error(
        "Could not detect readable text from this image. Please ensure the photo is clear, upright, and legible."
      );
    }

    const cleanedText = normalizeText(ocrText);
    const pages: PageContent[] = [{ pageNumber: 1, text: cleanedText }];

    return {
      text: cleanedText,
      pages,
      pageCount: 1,
      extractionQuality: 0.95,
    };
  }

  const isPdf =
    lowerMime === "application/pdf" || lowerName.endsWith(".pdf");

  if (!isPdf) {
    const rawText = buffer.toString("utf-8");
    const cleanedText = normalizeText(rawText);
    const estimatedPages = Math.max(1, Math.ceil(cleanedText.length / 2500));

    const pages: PageContent[] = [];
    const pageSize = 2500;
    for (let i = 0; i < estimatedPages; i++) {
      pages.push({
        pageNumber: i + 1,
        text: cleanedText.slice(i * pageSize, (i + 1) * pageSize),
      });
    }

    return {
      text: cleanedText,
      pages,
      pageCount: estimatedPages,
      extractionQuality: 1.0,
    };
  }

  // PDF Extraction via pure JS pdfjs-dist
  try {
    const parsed = await extractPdfWithPdfJs(buffer);
    const avgCharsPerPage = parsed.pageCount > 0 ? parsed.text.length / parsed.pageCount : 0;

    // If we extracted sufficient digital text (> 100 characters), return immediately (<500ms)
    if (parsed.text.trim().length > 100) {
      return {
        text: parsed.text,
        pages: parsed.pages,
        pageCount: parsed.pageCount,
        extractionQuality: avgCharsPerPage < 150 ? 0.8 : 1.0,
      };
    }

    console.log(
      `[PDF Extraction] Little or no digital text found in "${filename}" (${parsed.text.trim().length} chars). Activating Gemini Vision & Handwriting OCR...`
    );

    // Automatic fallback: Gemini Vision & Handwriting OCR for handwritten/scanned PDFs
    const ocrText = await extractMediaViaGeminiOcr(buffer, "application/pdf", filename);
    if (ocrText && ocrText.trim().length > 20) {
      const cleanedOcr = normalizeText(ocrText);
      const estimatedPages = Math.max(1, Math.ceil(cleanedOcr.length / 2500));
      const pages: PageContent[] = [];
      const pageSize = 2500;
      for (let i = 0; i < estimatedPages; i++) {
        pages.push({
          pageNumber: i + 1,
          text: cleanedOcr.slice(i * pageSize, (i + 1) * pageSize),
        });
      }
      return {
        text: cleanedOcr,
        pages,
        pageCount: Math.max(parsed.pageCount || 1, estimatedPages),
        extractionQuality: 0.95,
      };
    }

    throw new Error(
      "Could not decipher text from this document. Please ensure the document is legible or try taking a clearer photo."
    );
  } catch (pdfErr) {
    // Edge case D-04: Explicit detection for password-protected PDFs
    const pdfErrName = (pdfErr as { name?: string })?.name || "";
    const pdfErrMsg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);
    if (pdfErrName === "PasswordException" || /password/i.test(pdfErrMsg)) {
      throw new Error(
        "This PDF is password-protected. Please remove the password protection before uploading."
      );
    }

    console.warn(
      `[PDF Extraction] Local parser failed for "${filename}", falling back to Gemini Vision OCR:`,
      pdfErrMsg
    );

    // Guaranteed fallback: Gemini Multimodal Vision & Handwriting OCR
    try {
      const ocrText = await extractMediaViaGeminiOcr(buffer, "application/pdf", filename);
      if (ocrText && ocrText.trim().length > 20) {
        const cleanedOcr = normalizeText(ocrText);
        const estimatedPages = Math.max(1, Math.ceil(cleanedOcr.length / 2500));
        const pages: PageContent[] = [];
        const pageSize = 2500;
        for (let i = 0; i < estimatedPages; i++) {
          pages.push({
            pageNumber: i + 1,
            text: cleanedOcr.slice(i * pageSize, (i + 1) * pageSize),
          });
        }
        return {
          text: cleanedOcr,
          pages,
          pageCount: estimatedPages,
          extractionQuality: 0.95,
        };
      }
    } catch {
      // Fall through to corrupt/unreadable error
    }

    throw new Error(
      `This file appears to be damaged, password-protected, or corrupted and could not be read.`
    );
  }
}

/**
 * Multimodal extraction for images (JPG, PNG, WebP) and scanned/handwritten PDFs using Gemini Flash Vision.
 * Deciphers messy handwriting, cursive scripts, blackboard photos, and Xerox scans.
 */
async function extractMediaViaGeminiOcr(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const base64Data = buffer.toString("base64");

  const response = await executeWithGeminiPool(
    (client) =>
      client.models.generateContent({
        model: getGenerationModel(),
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: `You are an expert OCR and handwriting transcription engine specialized in engineering notes, formulas, diagrams, and university syllabi.
Transcribe all readable text, handwriting, derivations, mathematical formulas, and diagrams from this document (${filename}).
Even if the handwriting is messy, cursive, faint, or low contrast, decipher every word with highest precision.
Preserve formulas using LaTeX math delimiters ($...$ for inline formulas, $$...$$ for standalone display equations).
Preserve all Module, Unit, Chapter headings, step numbers, and bullet points.
Output only the clean, transcribed text. Do not add conversational commentary.`,
              },
            ],
          },
        ],
      }),
    { label: "Gemini Vision OCR" }
  );

  return response.text || "";
}
