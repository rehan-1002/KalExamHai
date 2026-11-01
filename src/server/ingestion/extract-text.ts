import "server-only";
import { getGeminiClient } from "../gemini/client";

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

    // If we extracted sufficient text, return immediately (<500ms)
    if (parsed.text.trim().length > 50) {
      return {
        text: parsed.text,
        pages: parsed.pages,
        pageCount: parsed.pageCount,
        extractionQuality: avgCharsPerPage < 150 ? 0.8 : 1.0,
      };
    }

    // If document yielded almost no text (scanned PDF), only attempt Gemini OCR if buffer < 1 MB
    if (buffer.length < 1024 * 1024) {
      const ocrText = await extractPdfViaGeminiOcr(buffer, filename);
      if (ocrText && ocrText.trim().length > 50) {
        const cleanedOcr = normalizeText(ocrText);
        return {
          text: cleanedOcr,
          pages: [{ pageNumber: 1, text: cleanedOcr }],
          pageCount: Math.max(1, parsed.pageCount),
          extractionQuality: 0.9,
        };
      }
    }

    throw new Error(
      "No readable text could be found in this PDF. If this is a scanned document or image, please copy-paste the text using the 'Paste Notes' tab."
    );
  } catch (pdfErr) {
    console.warn(
      `[PDF Extraction] Pure JS parser error for "${filename}":`,
      pdfErr instanceof Error ? pdfErr.message : pdfErr
    );

    // If small buffer (< 1 MB), attempt Gemini OCR fallback
    if (buffer.length < 1024 * 1024) {
      const ocrText = await extractPdfViaGeminiOcr(buffer, filename);
      if (ocrText && ocrText.trim().length > 50) {
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
          extractionQuality: 0.9,
        };
      }
    }

    throw new Error(
      pdfErr instanceof Error && pdfErr.message.includes("No readable text")
        ? pdfErr.message
        : `Could not extract text from "${filename}". Please ensure the PDF contains selectable text, or use the 'Paste Notes' tab.`
    );
  }
}

/**
 * Multimodal fallback for scanned/complex PDFs using Gemini API.
 */
async function extractPdfViaGeminiOcr(buffer: Buffer, filename: string): Promise<string> {
  const ai = getGeminiClient();
  const base64Data = buffer.toString("base64");

  const response = await ai.models.generateContent({
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
            text: `Extract all readable text, formulas, equations, headings, and numbers from this document (${filename}). Output clean, verbatim plain text with LaTeX math delimiters ($...$ for inline, $$...$$ for display equations). Do not add conversational commentary.`,
          },
        ],
      },
    ],
  });

  return response.text || "";
}
