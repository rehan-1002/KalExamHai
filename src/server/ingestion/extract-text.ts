import "server-only";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { PDFParse } from "pdf-parse";
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

// PDFParse runs natively in-process without worker configuration

/**
 * Normalizes raw text: removes control characters (except newlines), collapses
 * excessive vertical whitespace, and trims lines while preserving math symbols and numbers.
 */
export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Replace non-printable ASCII (except \t, \n) with space
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    // Collapse horizontal whitespace runs
    .replace(/[ \t]+/g, " ")
    // Collapse 3+ newlines into 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extracts text from PDF, TXT, or Markdown buffers.
 * Features automatic Gemini multimodal OCR fallback if local PDF parsing encounters worker or format issues.
 */
export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ExtractedDocument> {
  const isPdf =
    mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    // TXT or MD document
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

  // PDF extraction: Try local PDFParse first, gracefully fall back to Gemini OCR on any worker or parsing failure
  try {
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      const pageCount = parsed.total || parsed.pages.length || 1;
      const pages: PageContent[] = [];
      let fullText = "";

      for (const page of parsed.pages) {
        const pageCleaned = normalizeText(page.text);
        pages.push({
          pageNumber: page.num,
          text: pageCleaned,
        });
        fullText += (fullText ? "\n\n" : "") + pageCleaned;
      }

      const avgCharsPerPage = pageCount > 0 ? fullText.length / pageCount : 0;

      // If we extracted sufficient text, return immediately (fast path, <1s)
      if (fullText.trim().length > 50) {
        return {
          text: fullText,
          pages,
          pageCount,
          extractionQuality: avgCharsPerPage < 150 ? 0.8 : 1.0,
        };
      }

      // If document yielded almost no text (likely scanned or image-based PDF)
      // Only attempt Gemini OCR if buffer is small enough (< 1 MB) to finish within Vercel's 10s budget
      if (buffer.length < 1024 * 1024) {
        const ocrText = await extractPdfViaGeminiOcr(buffer, filename);
        if (ocrText && ocrText.trim().length > 50) {
          const cleanedOcr = normalizeText(ocrText);
          return {
            text: cleanedOcr,
            pages: [{ pageNumber: 1, text: cleanedOcr }],
            pageCount: Math.max(1, pageCount),
            extractionQuality: 0.9,
          };
        }
      }

      throw new Error(
        "No readable text could be found in this PDF. If this is a scanned document or image, please copy-paste the text using the 'Paste Notes' tab."
      );
    } finally {
      try {
        await parser.destroy();
      } catch {
        // Ignore destroy error
      }
    }
  } catch (pdfErr) {
    console.warn(
      `[PDF Extraction] Local parser failed for "${filename}":`,
      pdfErr instanceof Error ? pdfErr.message : pdfErr
    );

    // If buffer is small (< 1 MB), attempt Gemini OCR fallback with tight budget
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
