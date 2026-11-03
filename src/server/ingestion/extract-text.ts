import "server-only";
import { executeWithGeminiPool } from "../gemini/client";

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
 * excessive vertical whitespace, and trims lines while preserving math symbols and numbers.
 */
export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/[ \t]+/g, " ")
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
 * Extracts text from PDF, TXT, or Markdown buffers.
 */
export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ExtractedDocument> {
  const isPdf =
    mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf");

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
    const ocrText = await extractPdfViaGeminiOcr(buffer, filename);
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
    console.warn(
      `[PDF Extraction] Local parser failed for "${filename}", falling back to Gemini Vision OCR:`,
      pdfErr instanceof Error ? pdfErr.message : pdfErr
    );

    // Guaranteed fallback: Gemini Multimodal Vision & Handwriting OCR
    const ocrText = await extractPdfViaGeminiOcr(buffer, filename);
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

    throw new Error(
      `Could not extract text from "${filename}". Please ensure the upload is a valid document.`
    );
  }
}

/**
 * Multimodal fallback for scanned, handwritten, or image-based PDFs using Gemini 2.5 Flash.
 * Deciphers messy handwriting, cursive scripts, blackboard photos, and Xerox scans.
 */
async function extractPdfViaGeminiOcr(buffer: Buffer, filename: string): Promise<string> {
  const base64Data = buffer.toString("base64");

  const response = await executeWithGeminiPool(
    (client) =>
      client.models.generateContent({
        model: process.env.GEMINI_MODEL_GENERATION || "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
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
